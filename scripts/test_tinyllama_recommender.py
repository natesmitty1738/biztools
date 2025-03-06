#!/usr/bin/env python3
import os
import sys
import argparse
import logging
import time
import json
from pathlib import Path

# Add the packages directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'packages'))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from biztools_recommender import LlamaBloomRecommender
except ImportError:
    logger.error("Failed to import LlamaBloomRecommender. Make sure biztools_recommender is installed.")
    sys.exit(1)

def load_model_path():
    """Load the model path from environment or config"""
    # Try environment variable first
    model_path = os.environ.get("LLAMA_MODEL_PATH")
    if model_path and os.path.exists(model_path):
        return model_path
        
    # Try to find the latest model symlink
    latest_link = Path("./models/llama-latest")
    if latest_link.exists() and latest_link.is_symlink():
        return str(latest_link)
        
    # Look in models directory for any .gguf files
    models_dir = Path("./models")
    if models_dir.exists():
        gguf_files = list(models_dir.glob("**/*.gguf"))
        if gguf_files:
            return str(gguf_files[0])
    
    raise FileNotFoundError(
        "Could not find LLaMA model. Please set LLAMA_MODEL_PATH environment variable "
        "or run setup_llama.py first."
    )

def add_test_items(recommender):
    """Add sample items to the recommender"""
    logger.info("Adding test items to recommender")
    
    # Electronics
    recommender.add_item(
        "item1",
        "Smartphone XS10",
        "Advanced smartphone with 8GB RAM and 128GB storage",
        ["Electronics", "Phones"],
        ["5G", "AMOLED", "8GB RAM"]
    )
    
    recommender.add_item(
        "item2",
        "Laptop Pro 15",
        "Professional laptop with 16GB RAM and 512GB SSD",
        ["Electronics", "Computers"],
        ["Intel i7", "16GB RAM", "512GB SSD"]
    )
    
    recommender.add_item(
        "item3",
        "Wireless Headphones",
        "Noise-cancelling wireless headphones with 30h battery life",
        ["Electronics", "Audio"],
        ["Wireless", "Noise-cancelling", "30h battery"]
    )
    
    # Books
    recommender.add_item(
        "item4",
        "Python Programming",
        "Comprehensive guide to Python programming language",
        ["Books", "Programming"],
        ["Python", "Programming", "Beginner friendly"]
    )
    
    recommender.add_item(
        "item5",
        "Machine Learning Basics",
        "Introduction to machine learning concepts and algorithms",
        ["Books", "Programming", "AI"],
        ["ML", "AI", "Data Science"]
    )
    
    # Clothing
    recommender.add_item(
        "item6",
        "Winter Jacket",
        "Warm winter jacket with water-resistant material",
        ["Clothing", "Outerwear"],
        ["Winter", "Water-resistant", "Warm"]
    )
    
    # More items can be added as needed

def simulate_user_interactions(recommender):
    """Simulate user interactions with items"""
    logger.info("Simulating user interactions")
    
    # User interested in electronics
    recommender.add_user_interaction(
        "user1",
        "item1",  # Smartphone
        "click",
        time.time()
    )
    
    recommender.add_user_interaction(
        "user1",
        "item3",  # Headphones
        "purchase",
        time.time()
    )
    
    # User interested in books
    recommender.add_user_interaction(
        "user2",
        "item4",  # Python book
        "click",
        time.time()
    )
    
    recommender.add_user_interaction(
        "user2",
        "item5",  # ML book
        "wishlist",
        time.time()
    )
    
    # User with mixed interests
    recommender.add_user_interaction(
        "user3",
        "item2",  # Laptop
        "click",
        time.time()
    )
    
    recommender.add_user_interaction(
        "user3",
        "item5",  # ML book
        "purchase",
        time.time()
    )
    
    recommender.add_user_interaction(
        "user3",
        "item6",  # Winter jacket
        "wishlist",
        time.time()
    )

def main():
    parser = argparse.ArgumentParser(description="Test the TinyLlama-based recommender")
    parser.add_argument("--model-path", help="Path to LLaMA model file")
    parser.add_argument("--cache-size", type=int, default=1000, help="Bloom filter cache size")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Get model path
    model_path = args.model_path
    if not model_path:
        try:
            model_path = load_model_path()
            logger.info(f"Using model from: {model_path}")
        except FileNotFoundError as e:
            logger.error(str(e))
            sys.exit(1)
    
    # Initialize recommender
    try:
        recommender = LlamaBloomRecommender(
            llama_model_path=model_path,
            cache_size=args.cache_size,
            false_positive_rate=0.01
        )
        
        # Add test items
        add_test_items(recommender)
        
        # Simulate user interactions
        simulate_user_interactions(recommender)
        
        # Test recommendations
        logger.info("Getting recommendations for user1 (electronics preference)")
        recs_user1 = recommender.recommend("user1", limit=3)
        print(f"\nRecommendations for user1:")
        for i, rec in enumerate(recs_user1):
            print(f"{i+1}. {rec['title']} (score: {rec['score']:.2f})")
        
        logger.info("Getting recommendations for user2 (books preference)")
        recs_user2 = recommender.recommend("user2", limit=3)
        print(f"\nRecommendations for user2:")
        for i, rec in enumerate(recs_user2):
            print(f"{i+1}. {rec['title']} (score: {rec['score']:.2f})")
        
        logger.info("Getting recommendations for user3 (mixed preferences)")
        recs_user3 = recommender.recommend("user3", limit=3)
        print(f"\nRecommendations for user3:")
        for i, rec in enumerate(recs_user3):
            print(f"{i+1}. {rec['title']} (score: {rec['score']:.2f})")
        
        # Test similar items
        logger.info("Finding items similar to Laptop Pro 15")
        similar_laptop = recommender.similar_items("item2", limit=2)
        print(f"\nItems similar to Laptop Pro 15:")
        for i, item in enumerate(similar_laptop):
            print(f"{i+1}. {item['title']} (similarity: {item['similarity']:.2f})")
        
        logger.info("Finding items similar to Python Programming book")
        similar_python = recommender.similar_items("item4", limit=2)
        print(f"\nItems similar to Python Programming:")
        for i, item in enumerate(similar_python):
            print(f"{i+1}. {item['title']} (similarity: {item['similarity']:.2f})")
        
        logger.info("Test completed successfully")
        
    except Exception as e:
        logger.error(f"Error testing recommender: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main() 