#!/usr/bin/env python
"""
Script for running a local recommender system with TinyLlama integration.
This script allows initialization, querying, and management of recommendations.
"""

import os
import sys
import argparse
import json
import logging
from typing import List, Dict, Any, Optional
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("local_recommender")

# Try to import the recommender classes
try:
    # First try the direct import
    try:
        from biztools.recommender import LlamaBloomRecommender
    except ImportError:
        # Try the project-specific import
        try:
            from biztools_recommender.llama_bloom import LlamaBloomRecommender
        except ImportError:
            # Try with relative path
            import sys
            import os
            from pathlib import Path
            # Add the project root to the Python path
            project_root = Path(__file__).parent.parent.absolute()
            if str(project_root) not in sys.path:
                sys.path.insert(0, str(project_root))
            # Try direct path to package
            try:
                from packages.recommender.biztools_recommender.llama_bloom import LlamaBloomRecommender
            except ImportError:
                raise ImportError("Could not find LlamaBloomRecommender in any of the expected locations")
except ImportError as e:
    logger.error(f"Could not import recommender: {str(e)}. Check that the biztools package is installed.")
    sys.exit(1)

class LocalRecommenderService:
    """Service for local recommender system operations."""
    
    def __init__(self):
        self.recommender = None
        self.items = {}
        self.item_features = {}
        self.users = {}
        self.user_interactions = {}
        self.initialized = False
        
        # Initialize test users
        self.setup_test_users()
        # Initialize test items
        self.setup_test_items()
    
    def setup_test_users(self):
        """Setup test users for the recommender."""
        self.users = {
            "user1": {"name": "Alice", "preferences": ["electronics", "gadgets"]},
            "user2": {"name": "Bob", "preferences": ["books", "learning"]},
            "user3": {"name": "Charlie", "preferences": ["mixed", "various"]}
        }
        
        # Initialize interactions storage
        self.user_interactions = {
            "user1": {"clicks": [], "purchases": [], "wishlists": []},
            "user2": {"clicks": [], "purchases": [], "wishlists": []},
            "user3": {"clicks": [], "purchases": [], "wishlists": []}
        }
        
        # Add default interactions for testing
        self.user_interactions["user1"]["clicks"] = ["item1", "item2"]
        self.user_interactions["user1"]["purchases"] = ["item2"]
        self.user_interactions["user1"]["wishlists"] = []
        
        self.user_interactions["user2"]["clicks"] = ["item4", "item5"]
        self.user_interactions["user2"]["purchases"] = ["item5"]
        self.user_interactions["user2"]["wishlists"] = ["item4"]
        
        self.user_interactions["user3"]["clicks"] = ["item2", "item5"]
        self.user_interactions["user3"]["purchases"] = ["item5"]
        self.user_interactions["user3"]["wishlists"] = ["item6"]
    
    def setup_test_items(self):
        """Setup test items for the recommender."""
        self.items = {
            "item1": {
                "title": "Smartphone XS10",
                "description": "Latest smartphone with advanced camera and fast processor",
                "categories": ["electronics", "phones"],
                "features": ["camera", "5G", "waterproof"]
            },
            "item2": {
                "title": "Laptop Pro 15",
                "description": "Professional laptop with high performance",
                "categories": ["electronics", "computers"],
                "features": ["16GB RAM", "1TB SSD", "Intel i7"]
            },
            "item3": {
                "title": "Wireless Headphones",
                "description": "Noise cancelling wireless headphones with long battery life",
                "categories": ["electronics", "audio"],
                "features": ["bluetooth", "noise-cancelling", "40h battery"]
            },
            "item4": {
                "title": "Python Programming",
                "description": "Complete guide to Python programming language",
                "categories": ["books", "programming"],
                "features": ["beginner-friendly", "exercises", "Python 3.9"]
            },
            "item5": {
                "title": "Machine Learning Basics",
                "description": "Introduction to machine learning concepts and applications",
                "categories": ["books", "technology", "data science"],
                "features": ["algorithms", "practical examples", "mathematics"]
            },
            "item6": {
                "title": "Winter Jacket",
                "description": "Warm winter jacket with water-resistant outer layer",
                "categories": ["clothing", "outerwear"],
                "features": ["warm", "water-resistant", "hood"]
            }
        }
        
        # Create item features for embedding
        for item_id, item in self.items.items():
            self.item_features[item_id] = self._create_feature_text(item)
    
    def _create_feature_text(self, item: Dict[str, Any]) -> str:
        """Create a text representation of item features for embedding."""
        return (
            f"Title: {item['title']}. "
            f"Description: {item['description']}. "
            f"Categories: {', '.join(item['categories'])}. "
            f"Features: {', '.join(item['features'])}."
        )
    
    def initialize(self) -> bool:
        """Initialize the recommender with model and items."""
        if self.initialized:
            logger.info("Recommender already initialized")
            return True
        
        try:
            # Get model path (either use TinyLlama or a specified model)
            model_path = os.environ.get('LLAMA_MODEL_PATH', 'models/tinyllama-1.1b/tinyllama-1.1b-chat-v0.3.q4_0.gguf')
            if not os.path.exists(model_path):
                logger.warning(f"Model not found at {model_path}, searching in models directory...")
                # Try to find model in models directory
                for root, dirs, files in os.walk('models'):
                    for file in files:
                        if file.endswith('.gguf'):
                            model_path = os.path.join(root, file)
                            logger.info(f"Found model at {model_path}")
                            break
                    if os.path.exists(model_path):
                        break
            
            if not os.path.exists(model_path):
                logger.error("No GGUF model found. Please download a model or set LLAMA_MODEL_PATH.")
                return False
            
            # Initialize the recommender
            logger.info(f"Initializing recommender with model: {model_path}")
            self.recommender = LlamaBloomRecommender(
                llama_model_path=model_path,
                cache_size=10000,
                false_positive_rate=0.01,
                context_size=512,
                embedding_size=64
            )
            
            # Add items to the recommender
            logger.info(f"Adding {len(self.items)} items to recommender")
            for item_id, item in self.items.items():
                self.recommender.add_item(
                    item_id=item_id,
                    title=item["title"],
                    description=item["description"],
                    categories=item["categories"],
                    features=item["features"]
                )
            
            # Record interactions
            logger.info("Recording user interactions")
            current_time = time.time()
            for user_id, interactions in self.user_interactions.items():
                for click_item in interactions["clicks"]:
                    self.recommender.add_user_interaction(
                        user_id=user_id,
                        item_id=click_item,
                        interaction_type="click",
                        timestamp=current_time
                    )
                
                for purchase_item in interactions["purchases"]:
                    self.recommender.add_user_interaction(
                        user_id=user_id,
                        item_id=purchase_item,
                        interaction_type="purchase",
                        timestamp=current_time
                    )
                
                for wishlist_item in interactions["wishlists"]:
                    self.recommender.add_user_interaction(
                        user_id=user_id,
                        item_id=wishlist_item,
                        interaction_type="wishlist",
                        timestamp=current_time
                    )
            
            self.initialized = True
            logger.info("Recommender initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing recommender: {str(e)}")
            return False
    
    def get_recommendations(self, user_id: str, limit: int = 3) -> List[Dict]:
        """Get recommendations for a user."""
        if not self.initialized:
            success = self.initialize()
            if not success:
                logger.error("Failed to initialize recommender")
                return []
        
        if user_id not in self.users:
            logger.error(f"User {user_id} not found")
            return []
        
        try:
            # Get recommendations
            recommendations = self.recommender.recommend(
                user_id=user_id,
                limit=limit
            )
            
            # Format recommendations
            result = []
            for recommendation in recommendations:
                if isinstance(recommendation, dict) and "item_id" in recommendation and "score" in recommendation:
                    item_id = recommendation["item_id"]
                    score = recommendation["score"]
                    if item_id in self.items:
                        result.append({
                            "itemId": item_id,
                            "title": self.items[item_id]["title"],
                            "score": score
                        })
            
            logger.info(f"Generated {len(result)} recommendations for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []
    
    def get_similar_items(self, item_id: str, limit: int = 3) -> List[Dict]:
        """Get items similar to a given item."""
        if not self.initialized:
            success = self.initialize()
            if not success:
                logger.error("Failed to initialize recommender")
                return []
        
        if item_id not in self.items:
            logger.error(f"Item {item_id} not found")
            return []
        
        try:
            # Get similar items
            similar_items = self.recommender.similar_items(
                item_id=item_id,
                limit=limit
            )
            
            # Format similar items
            result = []
            for similar_item in similar_items:
                if isinstance(similar_item, dict) and "item_id" in similar_item and "similarity" in similar_item:
                    similar_id = similar_item["item_id"]
                    score = similar_item["similarity"]
                    if similar_id in self.items:
                        result.append({
                            "itemId": similar_id,
                            "title": self.items[similar_id]["title"],
                            "score": score
                        })
            
            logger.info(f"Found {len(result)} similar items for {item_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error getting similar items: {str(e)}")
            return []
    
    def record_interaction(self, user_id: str, item_id: str, interaction_type: str) -> bool:
        """Record a user interaction with an item."""
        if not self.initialized:
            success = self.initialize()
            if not success:
                logger.error("Failed to initialize recommender")
                return False
        
        if user_id not in self.users:
            logger.error(f"User {user_id} not found")
            return False
        
        if item_id not in self.items:
            logger.error(f"Item {item_id} not found")
            return False
        
        try:
            # Map interaction type to valid type
            valid_types = ["click", "view", "purchase", "wishlist"]
            
            if interaction_type not in valid_types:
                logger.error(f"Unknown interaction type: {interaction_type}")
                return False
            
            # Record in local storage
            if interaction_type == "click":
                if item_id not in self.user_interactions[user_id]["clicks"]:
                    self.user_interactions[user_id]["clicks"].append(item_id)
            elif interaction_type == "purchase":
                if item_id not in self.user_interactions[user_id]["purchases"]:
                    self.user_interactions[user_id]["purchases"].append(item_id)
            elif interaction_type == "wishlist":
                if item_id not in self.user_interactions[user_id]["wishlists"]:
                    self.user_interactions[user_id]["wishlists"].append(item_id)
            
            # Record in recommender
            current_time = time.time()
            self.recommender.add_user_interaction(
                user_id=user_id,
                item_id=item_id,
                interaction_type=interaction_type,
                timestamp=current_time
            )
            
            logger.info(f"Recorded {interaction_type} interaction for user {user_id} with item {item_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error recording interaction: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up resources used by the recommender."""
        if self.recommender:
            logger.info("Cleaning up recommender resources")
            # Free resources
            del self.recommender
            self.recommender = None
            self.initialized = False

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Run local recommender operations')
    
    # Action group
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--initialize-only', action='store_true', help='Initialize the recommender')
    group.add_argument('--recommend', action='store_true', help='Get recommendations for a user')
    group.add_argument('--similar', action='store_true', help='Get similar items')
    group.add_argument('--interaction', action='store_true', help='Record a user interaction')
    
    # Parameters
    parser.add_argument('--user', type=str, help='User ID for recommendations or interactions')
    parser.add_argument('--item', type=str, help='Item ID for similar items or interactions')
    parser.add_argument('--type', type=str, help='Interaction type (click, purchase, wishlist)')
    parser.add_argument('--limit', type=int, default=3, help='Number of recommendations to return')
    
    args = parser.parse_args()
    
    # Create service
    service = LocalRecommenderService()
    
    try:
        if args.initialize_only:
            # Initialize only
            success = service.initialize()
            if success:
                print(json.dumps({"success": True, "message": "Recommender initialized successfully"}))
                sys.exit(0)
            else:
                print(json.dumps({"success": False, "message": "Failed to initialize recommender"}))
                sys.exit(1)
        
        elif args.recommend:
            # Check required params
            if not args.user:
                print(json.dumps({"error": "User ID is required for recommendations"}))
                sys.exit(1)
            
            # Get recommendations
            recommendations = service.get_recommendations(args.user, args.limit)
            print(json.dumps(recommendations))
        
        elif args.similar:
            # Check required params
            if not args.item:
                print(json.dumps({"error": "Item ID is required for similar items"}))
                sys.exit(1)
            
            # Get similar items
            similar_items = service.get_similar_items(args.item, args.limit)
            print(json.dumps(similar_items))
        
        elif args.interaction:
            # Check required params
            if not args.user or not args.item or not args.type:
                print(json.dumps({
                    "error": "User ID, Item ID, and interaction type are required for recording interactions"
                }))
                sys.exit(1)
            
            # Record interaction
            success = service.record_interaction(args.user, args.item, args.type)
            if success:
                print(json.dumps({
                    "success": True,
                    "message": f"Recorded {args.type} interaction for user {args.user} with item {args.item}"
                }))
            else:
                print(json.dumps({
                    "success": False,
                    "message": "Failed to record interaction"
                }))
                sys.exit(1)
    
    finally:
        # Clean up
        service.cleanup()

if __name__ == "__main__":
    main() 