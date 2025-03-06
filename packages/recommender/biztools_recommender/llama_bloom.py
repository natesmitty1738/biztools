"""
LLaMA-powered recommender with Bloom filter optimization
"""

import os
import ctypes
import logging
import numpy as np
import json
from time import time
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from collections import defaultdict

logger = logging.getLogger(__name__)

class LlamaBloomRecommender:
    def __init__(
        self,
        llama_model_path: str,
        cache_size: int = 10000,
        false_positive_rate: float = 0.01,
        context_size: int = 512,
        embedding_size: int = 64  # Smaller embedding size for TinyLlama
    ):
        """
        Initialize the LLaMA-Bloom recommender
        
        Args:
            llama_model_path: Path to the LLaMA model file (GGUF format)
            cache_size: Size of the Bloom filter cache
            false_positive_rate: Acceptable false positive rate for Bloom filters
            context_size: Size of context window for LLaMA
            embedding_size: Size of embeddings to generate
        """
        self.model_path = llama_model_path
        self.cache_size = cache_size
        self.fp_rate = false_positive_rate
        self.context_size = context_size
        self.embedding_size = embedding_size
        
        # Initialize data structures
        self.items = {}
        self.item_embeddings = {}
        self.user_interactions = defaultdict(list)
        self.user_profiles = {}
        
        logger.info(f"Initializing LlamaBloomRecommender with model: {llama_model_path}")
        
        # Load llama.cpp library
        lib_path = self._find_llama_library()
        
        try:
            self.lib = ctypes.CDLL(lib_path)
            logger.info(f"Successfully loaded library: {lib_path}")
        except Exception as e:
            logger.error(f"Failed to load library {lib_path}: {str(e)}")
            raise RuntimeError(f"Failed to load library: {str(e)}")
        
        # Initialize LLaMA model
        self._init_llama()
        
        # Initialize Bloom filters
        self._init_bloom_filters()
        
        logger.info("LlamaBloomRecommender initialized successfully")

    def _find_llama_library(self):
        """Find the llama.cpp library file"""
        # Common locations to check
        possible_paths = [
            # Standard location in our project
            os.path.join(
                os.path.dirname(__file__),
                "..", "..", "..",
                "vendor", "llama.cpp", "build", "bin",
                "libllama.dylib"
            ),
            # Linux path
            os.path.join(
                os.path.dirname(__file__),
                "..", "..", "..",
                "vendor", "llama.cpp", "build", 
                "libllama.so"
            ),
            # Mac path with direct build
            os.path.join(
                os.path.dirname(__file__),
                "..", "..", "..",
                "vendor", "llama.cpp", "build",
                "libllama.dylib"
            )
        ]
        
        for path in possible_paths:
            full_path = Path(path).resolve()
            if full_path.exists():
                return str(full_path)
                
        raise FileNotFoundError(
            "Could not find libllama. Make sure llama.cpp is built properly. "
            f"Tried paths: {', '.join(possible_paths)}"
        )

    def _init_llama(self):
        """Initialize LLaMA model - for testing, we don't fully load the model"""
        logger.info("Initializing LLaMA model (testing mode)")
        # For testing purposes, we'll just log the model path
        # and confirm we can load it later when needed
        logger.info(f"Will use model at: {self.model_path}")
        if not os.path.exists(self.model_path):
            logger.warning(f"Model file doesn't exist at: {self.model_path}")
        else:
            logger.info(f"Model file exists and is {os.path.getsize(self.model_path) / (1024*1024):.2f} MB")

    def _init_bloom_filters(self):
        """Initialize Bloom filters"""
        logger.info("Initializing Bloom filters")
        # We'll implement a simple in-memory version for testing
        self.user_bloom_filter = {}
        self.item_bloom_filter = {}

    def _generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate an embedding for text using a simple hashing approach for testing
        
        In a real implementation, this would call the LLaMA model
        """
        # Simple deterministic embedding generation for testing
        # Creates a reproducible vector based on the text content
        np.random.seed(hash(text) % 2**32)
        embedding = np.random.normal(0, 1, self.embedding_size)
        # Normalize the embedding
        embedding = embedding / np.linalg.norm(embedding)
        return embedding

    def _calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings"""
        return np.dot(embedding1, embedding2)

    def _update_user_profile(self, user_id: str):
        """Update user profile based on interactions"""
        if not self.user_interactions[user_id]:
            return
            
        # Get embeddings for items the user has interacted with
        embeddings = []
        weights = []
        
        for interaction in self.user_interactions[user_id]:
            item_id = interaction["item_id"]
            if item_id in self.item_embeddings:
                # Weight by interaction type
                weight = 1.0
                if interaction["interaction_type"] == "purchase":
                    weight = 3.0
                elif interaction["interaction_type"] == "wishlist":
                    weight = 2.0
                
                # Apply recency weighting
                time_diff = time() - interaction["timestamp"]
                recency_weight = 1.0 / (1.0 + time_diff / (7 * 24 * 3600))  # 7 days half-life
                
                embeddings.append(self.item_embeddings[item_id])
                weights.append(weight * recency_weight)
        
        if embeddings:
            # Weighted average of embeddings
            weights = np.array(weights) / sum(weights)
            user_embedding = np.zeros(self.embedding_size)
            for i, emb in enumerate(embeddings):
                user_embedding += emb * weights[i]
            
            # Normalize
            norm = np.linalg.norm(user_embedding)
            if norm > 0:
                user_embedding = user_embedding / norm
                
            self.user_profiles[user_id] = user_embedding

    def recommend(
        self,
        user_id: str,
        context: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate recommendations for a user
        
        Args:
            user_id: User identifier
            context: Optional context for recommendations
            limit: Maximum number of recommendations
            
        Returns:
            List of recommendations with scores
        """
        logger.info(f"Generating recommendations for user {user_id}")
        
        # Get or calculate user profile
        if user_id not in self.user_profiles:
            self._update_user_profile(user_id)
        
        # If user has no profile, return popular items
        if user_id not in self.user_profiles:
            logger.info(f"No profile for user {user_id}, returning popular items")
            return self._get_popular_items(limit)
        
        user_embedding = self.user_profiles[user_id]
        
        # Calculate similarity with all items
        items_with_scores = []
        for item_id, embedding in self.item_embeddings.items():
            score = self._calculate_similarity(user_embedding, embedding)
            
            # Check if user has already interacted with this item
            for interaction in self.user_interactions[user_id]:
                if interaction["item_id"] == item_id:
                    # Reduce score for already interacted items
                    score *= 0.5
                    break
            
            items_with_scores.append((item_id, score))
        
        # Sort by score and return top items
        items_with_scores.sort(key=lambda x: x[1], reverse=True)
        recommendations = []
        
        for item_id, score in items_with_scores[:limit]:
            recommendations.append({
                "id": item_id,
                "title": self.items[item_id]["title"],
                "score": float(score),
                "reason": "Recommended based on your profile"
            })
        
        return recommendations

    def _get_popular_items(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular items as fallback"""
        # For testing, simply return available items
        recommendations = []
        item_ids = list(self.items.keys())
        
        # Return available items with dummy popularity scores
        for i, item_id in enumerate(item_ids[:limit]):
            recommendations.append({
                "id": item_id, 
                "title": self.items[item_id]["title"],
                "score": 1.0 - (i * 0.1),
                "reason": "Popular item"
            })
            
        return recommendations

    def add_item(
        self,
        item_id: str,
        title: str,
        description: str,
        categories: List[str],
        features: List[str]
    ) -> None:
        """
        Add or update an item in the catalog
        
        Args:
            item_id: Item identifier
            title: Item title
            description: Item description
            categories: List of categories
            features: List of features
        """
        logger.info(f"Adding item {item_id}: {title}")
        
        # Store item in our simple dictionary
        self.items[item_id] = {
            "title": title,
            "description": description,
            "categories": categories,
            "features": features
        }
        
        # Generate embedding for the item
        item_text = f"{title}. {description}. Categories: {', '.join(categories)}. Features: {', '.join(features)}"
        self.item_embeddings[item_id] = self._generate_embedding(item_text)
        logger.debug(f"Generated embedding for item {item_id}")

    def add_user_interaction(
        self,
        user_id: str,
        item_id: str,
        interaction_type: str,
        timestamp: float
    ) -> None:
        """
        Record a user interaction with an item
        
        Args:
            user_id: User identifier
            item_id: Item identifier
            interaction_type: Type of interaction
            timestamp: Interaction timestamp
        """
        logger.info(f"Recording {interaction_type} interaction: user {user_id} → item {item_id}")
        
        # Add the interaction
        self.user_interactions[user_id].append({
            "item_id": item_id,
            "interaction_type": interaction_type,
            "timestamp": timestamp
        })
        
        # Clear user profile to force recalculation
        if user_id in self.user_profiles:
            del self.user_profiles[user_id]

    def similar_items(
        self,
        item_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find items similar to the given item
        
        Args:
            item_id: Item identifier
            limit: Maximum number of similar items
            
        Returns:
            List of similar items with similarity scores
        """
        logger.info(f"Finding items similar to {item_id}")
        
        if item_id not in self.item_embeddings:
            logger.warning(f"Item {item_id} not found or has no embedding")
            return []
        
        source_embedding = self.item_embeddings[item_id]
        
        # Calculate similarity with all other items
        items_with_scores = []
        for other_id, embedding in self.item_embeddings.items():
            if other_id != item_id:
                similarity = self._calculate_similarity(source_embedding, embedding)
                items_with_scores.append((other_id, similarity))
        
        # Sort by similarity and return top items
        items_with_scores.sort(key=lambda x: x[1], reverse=True)
        similar = []
        
        for other_id, similarity in items_with_scores[:limit]:
            similar.append({
                "id": other_id,
                "title": self.items[other_id]["title"],
                "similarity": float(similarity)
            })
            
        return similar
        
    def export_state(self, file_path: str) -> None:
        """
        Export the recommender state to a file
        
        Args:
            file_path: Path to export the state to
        """
        state = {
            "items": self.items,
            "user_interactions": dict(self.user_interactions)
        }
        
        with open(file_path, 'w') as f:
            json.dump(state, f)
            
        logger.info(f"Recommender state exported to {file_path}")
    
    def import_state(self, file_path: str) -> None:
        """
        Import recommender state from a file
        
        Args:
            file_path: Path to import the state from
        """
        with open(file_path, 'r') as f:
            state = json.load(f)
        
        # Restore items
        for item_id, item_data in state["items"].items():
            self.add_item(
                item_id,
                item_data["title"],
                item_data["description"],
                item_data["categories"],
                item_data["features"]
            )
        
        # Restore interactions
        for user_id, interactions in state["user_interactions"].items():
            for interaction in interactions:
                self.add_user_interaction(
                    user_id,
                    interaction["item_id"],
                    interaction["interaction_type"],
                    interaction["timestamp"]
                )
                
        logger.info(f"Recommender state imported from {file_path}")

    def __del__(self):
        """Cleanup resources"""
        logger.info("Cleaning up LlamaBloomRecommender resources")
        # For now, nothing specific to clean up in test mode 