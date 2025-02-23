from biztools_recommender import ContentBasedRecommender
from typing import List, Dict, Any
import json

def load_sample_data() -> List[Dict[str, Any]]:
    """
    Load or create sample data for demonstration
    """
    return [
        {
            "id": "item1",
            "content": "Python programming language tutorial for beginners",
            "categories": ["programming", "python", "education"]
        },
        {
            "id": "item2",
            "content": "Advanced machine learning techniques in Python",
            "categories": ["programming", "python", "machine learning"]
        },
        {
            "id": "item3",
            "content": "Web development with JavaScript and React",
            "categories": ["programming", "javascript", "web development"]
        },
        {
            "id": "item4",
            "content": "Data analysis and visualization using Python pandas",
            "categories": ["programming", "python", "data science"]
        }
    ]

def main():
    # Initialize the recommender
    recommender = ContentBasedRecommender()
    
    # Load sample data
    items = load_sample_data()
    
    # Train the recommender
    print("Training the recommender...")
    recommender.fit(items)
    
    # Generate recommendations for a user
    # Let's assume the user has interacted with item1
    user_id = "user123"
    recommendations = recommender.predict(user_id, n_recommendations=2)
    
    print("\nRecommendations for user:", user_id)
    print(json.dumps(recommendations, indent=2))
    
    # Compute similarity between two items
    item1 = "item1"
    item2 = "item2"
    similarity = recommender.compute_similarity(item1, item2)
    print(f"\nSimilarity between {item1} and {item2}: {similarity:.2f}")

if __name__ == "__main__":
    main() 