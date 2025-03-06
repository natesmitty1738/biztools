#!/usr/bin/env python
"""
Fast Search Service with Embeddings and LLaMA Reranking

This script implements a hybrid search approach that:
1. Uses lightweight embeddings for initial fast retrieval
2. Optionally reranks results using LLaMA for complex queries
"""

import os
import sys
import argparse
import json
import logging
import time
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import faiss
from tqdm import tqdm

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fast-search")

# Try to import the LLaMA module for reranking
try:
    # First try the direct import
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
    logger.warning(f"Could not import LlamaBloomRecommender: {str(e)}. Reranking will be disabled.")
    LlamaBloomRecommender = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    logger.error("Could not import sentence_transformers. Please install with: pip install sentence-transformers")
    sys.exit(1)

class SearchItem:
    """Represents an item to be searched."""
    
    def __init__(self, item_id: str, title: str, content: str, metadata: Optional[Dict] = None):
        self.item_id = item_id
        self.title = title
        self.content = content
        self.metadata = metadata or {}
    
    def get_full_text(self) -> str:
        """Get the full text representation for embedding."""
        return f"Title: {self.title}. Content: {self.content}"
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation."""
        return {
            "id": self.item_id,
            "title": self.title,
            "content": self.content,
            "metadata": self.metadata
        }

class FastSearchService:
    """Service for fast embedding-based search with optional LLaMA reranking."""
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', llama_model_path: Optional[str] = None):
        """
        Initialize the search service.
        
        Args:
            model_name: The sentence-transformer model to use for embeddings
            llama_model_path: Optional path to LLaMA model for reranking
        """
        self.items = {}  # Dict of item_id -> SearchItem
        self.index = None  # FAISS index for fast retrieval
        self.embeddings = None  # Item embeddings
        self.item_ids = []  # List of item_ids in the same order as embeddings
        
        # Initialize the embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.embedding_model = SentenceTransformer(model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        logger.info(f"Embedding dimension: {self.embedding_dim}")
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product (cosine similarity)
        
        # Initialize LLaMA for reranking if path provided
        self.llama = None
        if llama_model_path and LlamaBloomRecommender:
            try:
                logger.info(f"Initializing LLaMA for reranking with model: {llama_model_path}")
                self.llama = LlamaBloomRecommender(
                    llama_model_path=llama_model_path,
                    cache_size=1000,
                    false_positive_rate=0.05,
                    context_size=512,
                    embedding_size=64
                )
                logger.info("LLaMA initialized successfully for reranking")
            except Exception as e:
                logger.error(f"Failed to initialize LLaMA for reranking: {str(e)}")
                self.llama = None
    
    def add_item(self, item: SearchItem) -> None:
        """Add an item to the search index."""
        if item.item_id in self.items:
            logger.warning(f"Item {item.item_id} already exists, updating")
        
        # Store the item
        self.items[item.item_id] = item
        
        # Clear cached embeddings and index
        self.embeddings = None
        self.item_ids = []
        self.index = faiss.IndexFlatIP(self.embedding_dim)
    
    def add_items(self, items: List[SearchItem]) -> None:
        """Add multiple items to the search index."""
        for item in items:
            self.add_item(item)
    
    def build_index(self) -> None:
        """Build the search index from the current items."""
        if not self.items:
            logger.warning("No items to index")
            return
        
        # Get all item texts
        texts = []
        self.item_ids = []
        
        logger.info(f"Building index with {len(self.items)} items")
        for item_id, item in self.items.items():
            texts.append(item.get_full_text())
            self.item_ids.append(item_id)
        
        # Compute embeddings
        logger.info("Computing embeddings...")
        self.embeddings = self.embedding_model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        
        # Add to FAISS index
        logger.info("Adding to FAISS index...")
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(self.embeddings)
        self.index.add(self.embeddings)
        
        logger.info(f"Index built successfully with {len(self.items)} items")
    
    def search(self, query: str, k: int = 5, rerank: bool = False) -> List[Dict]:
        """
        Search for items matching the query.
        
        Args:
            query: The search query
            k: Number of results to return
            rerank: Whether to use LLaMA for reranking
            
        Returns:
            List of search results with scores
        """
        if not self.items or self.embeddings is None:
            logger.warning("No items indexed, building index first")
            self.build_index()
        
        # Encode the query
        query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
        # Normalize for cosine similarity
        faiss.normalize_L2(query_embedding)
        
        # Search the index
        scores, indices = self.index.search(query_embedding, min(k * 2, len(self.items)))
        
        # Format results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self.item_ids):
                continue
                
            item_id = self.item_ids[idx]
            item = self.items[item_id]
            score = float(scores[0][i])
            
            results.append({
                "id": item_id,
                "title": item.title,
                "content": item.content,
                "score": score,
                "metadata": item.metadata
            })
        
        # Optionally rerank with LLaMA
        if rerank and self.llama and len(results) > 1:
            logger.info("Reranking results with LLaMA")
            reranked_results = self._rerank_with_llama(query, results)
            # Take the top k after reranking
            return reranked_results[:k]
        
        # Return the top k results
        return results[:k]
    
    def _rerank_with_llama(self, query: str, results: List[Dict]) -> List[Dict]:
        """Rerank search results using LLaMA."""
        try:
            # Prepare the context for LLaMA
            context = f"QUERY: {query}\n\nRESULTS:\n"
            for i, result in enumerate(results):
                context += f"{i+1}. {result['title']}: {result['content'][:100]}...\n"
            
            # Use LLaMA to evaluate relevance
            reranked = []
            for result in results:
                prompt = f"Rate the relevance of this result to the query '{query}' on a scale of 0-10:\nTitle: {result['title']}\nContent: {result['content'][:200]}..."
                
                # Get LLaMA's evaluation
                llama_score = self.llama.evaluate_text_relevance(prompt, reference=query)
                
                # Combine original score with LLaMA score (weighted)
                # Original score is in [-1,1], convert to [0,1]
                original_score = (result['score'] + 1) / 2
                combined_score = 0.7 * original_score + 0.3 * llama_score
                
                reranked.append({
                    **result,
                    "score": combined_score,
                    "llama_score": llama_score
                })
            
            # Sort by combined score
            reranked.sort(key=lambda x: x['score'], reverse=True)
            return reranked
            
        except Exception as e:
            logger.error(f"Error during LLaMA reranking: {str(e)}")
            # Fall back to original results
            return results
    
    def export_index(self, file_path: str) -> None:
        """Export the search index to disk."""
        if self.embeddings is None:
            logger.warning("No index to export")
            return
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Export the index
        logger.info(f"Exporting FAISS index to {file_path}")
        faiss.write_index(self.index, f"{file_path}.faiss")
        
        # Export the item_ids mapping
        with open(f"{file_path}.json", 'w') as f:
            json.dump({
                "item_ids": self.item_ids,
                "items": {item_id: item.to_dict() for item_id, item in self.items.items()}
            }, f)
        
        logger.info("Export complete")
    
    def import_index(self, file_path: str) -> None:
        """Import a search index from disk."""
        # Import the FAISS index
        logger.info(f"Importing FAISS index from {file_path}.faiss")
        self.index = faiss.read_index(f"{file_path}.faiss")
        
        # Import the item_ids mapping
        with open(f"{file_path}.json", 'r') as f:
            data = json.load(f)
            self.item_ids = data["item_ids"]
            
            # Convert items back to SearchItem objects
            self.items = {}
            for item_id, item_dict in data["items"].items():
                self.items[item_id] = SearchItem(
                    item_id=item_dict["id"],
                    title=item_dict["title"],
                    content=item_dict["content"],
                    metadata=item_dict["metadata"]
                )
        
        # Set embeddings dimension
        self.embedding_dim = self.index.d
        
        logger.info(f"Import complete. {len(self.items)} items loaded.")
    
    def cleanup(self) -> None:
        """Clean up resources."""
        if self.llama:
            logger.info("Cleaning up LLaMA resources")
            del self.llama
            self.llama = None

def create_test_items() -> List[SearchItem]:
    """Create test items for the search index."""
    return [
        SearchItem(
            item_id="doc1",
            title="Introduction to Python Programming",
            content="Python is a high-level, interpreted programming language known for its readability and versatility. It supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
            metadata={"category": "programming", "difficulty": "beginner"}
        ),
        SearchItem(
            item_id="doc2",
            title="Machine Learning with Python",
            content="Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Python has numerous libraries for ML such as scikit-learn, TensorFlow, and PyTorch.",
            metadata={"category": "data science", "difficulty": "intermediate"}
        ),
        SearchItem(
            item_id="doc3",
            title="Web Development with JavaScript",
            content="JavaScript is a programming language commonly used for web development. It allows you to create interactive elements on websites and is supported by all modern web browsers.",
            metadata={"category": "web development", "difficulty": "intermediate"}
        ),
        SearchItem(
            item_id="doc4",
            title="Data Analysis with Pandas",
            content="Pandas is a Python library for data manipulation and analysis. It offers data structures and operations for manipulating numerical tables and time series data.",
            metadata={"category": "data science", "difficulty": "intermediate"}
        ),
        SearchItem(
            item_id="doc5",
            title="Deep Learning Fundamentals",
            content="Deep learning is a subset of machine learning that uses neural networks with many layers. It has achieved remarkable results in areas such as image recognition, natural language processing, and game playing.",
            metadata={"category": "data science", "difficulty": "advanced"}
        ),
        SearchItem(
            item_id="doc6",
            title="React: A JavaScript Library for Building User Interfaces",
            content="React is a JavaScript library for building user interfaces, particularly single-page applications. It allows developers to create reusable UI components and efficiently update the DOM.",
            metadata={"category": "web development", "difficulty": "intermediate"}
        ),
        SearchItem(
            item_id="doc7",
            title="SQL Databases: Relational Data Storage",
            content="SQL (Structured Query Language) is a domain-specific language used for managing relational databases. Common SQL databases include MySQL, PostgreSQL, and SQLite.",
            metadata={"category": "databases", "difficulty": "intermediate"}
        ),
        SearchItem(
            item_id="doc8",
            title="NoSQL Databases: Beyond Relational",
            content="NoSQL databases provide a mechanism for storage and retrieval of data that is modeled in ways other than the tabular relations used in relational databases. Examples include MongoDB, Cassandra, and Redis.",
            metadata={"category": "databases", "difficulty": "intermediate"}
        )
    ]

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Fast Search Service with Embeddings and LLaMA Reranking')
    
    # Action group
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--build-index', action='store_true', help='Build search index with test data')
    group.add_argument('--search', type=str, help='Search query')
    group.add_argument('--export-index', type=str, help='Export index to file path')
    group.add_argument('--import-index', type=str, help='Import index from file path')
    
    # Parameters
    parser.add_argument('--model', type=str, default='all-MiniLM-L6-v2', help='Sentence transformer model to use')
    parser.add_argument('--llama-model', type=str, help='Path to LLaMA model for reranking')
    parser.add_argument('--limit', type=int, default=5, help='Number of results to return')
    parser.add_argument('--rerank', action='store_true', help='Use LLaMA to rerank results')
    parser.add_argument('--index-path', type=str, default='data/search_index', help='Path for index storage')
    
    args = parser.parse_args()
    
    # Get LLaMA model path
    llama_model_path = args.llama_model or os.environ.get('LLAMA_MODEL_PATH')
    if not llama_model_path and (args.rerank or args.build_index):
        # Try to find model in models directory
        for root, dirs, files in os.walk('models'):
            for file in files:
                if file.endswith('.gguf'):
                    llama_model_path = os.path.join(root, file)
                    logger.info(f"Found LLaMA model at {llama_model_path}")
                    break
            if llama_model_path:
                break
    
    # Create service
    service = FastSearchService(model_name=args.model, llama_model_path=llama_model_path)
    
    try:
        if args.build_index:
            # Create test items
            test_items = create_test_items()
            logger.info(f"Created {len(test_items)} test items")
            
            # Add items and build index
            service.add_items(test_items)
            service.build_index()
            
            # Export the index
            service.export_index(args.index_path)
            
            print(json.dumps({"success": True, "message": "Index built and exported successfully"}))
        
        elif args.search:
            # Import index if it exists
            if os.path.exists(f"{args.index_path}.faiss"):
                service.import_index(args.index_path)
            else:
                # Create test items if no index exists
                test_items = create_test_items()
                logger.info(f"No index found. Creating test index with {len(test_items)} items")
                service.add_items(test_items)
                service.build_index()
            
            # Perform search
            results = service.search(args.search, k=args.limit, rerank=args.rerank)
            
            # Output results
            print(json.dumps(results))
        
        elif args.export_index:
            # Export the index
            service.export_index(args.export_index)
            print(json.dumps({"success": True, "message": f"Index exported to {args.export_index}"}))
        
        elif args.import_index:
            # Import the index
            service.import_index(args.import_index)
            print(json.dumps({"success": True, "message": f"Index imported from {args.import_index}"}))
    
    finally:
        # Clean up
        service.cleanup()

if __name__ == "__main__":
    main() 