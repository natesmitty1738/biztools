#!/usr/bin/env python3
import os
import json
from datetime import datetime
from biztools_recommender import LlamaBloomRecommender

def main():
    # Initialize recommender
    model_path = os.getenv('LLAMA_MODEL_PATH', './models/llama-7b/llama-7b.ggmlv3.q4_0.bin')
    recommender = LlamaBloomRecommender(
        llama_model_path=model_path,
        cache_size=10000,
        false_positive_rate=0.01
    )

    # Add some test items
    test_items = [
        {
            "id": "tool1",
            "title": "Business Analytics Dashboard",
            "description": "Comprehensive analytics dashboard for business metrics",
            "categories": ["analytics", "dashboard", "business"],
            "features": ["real-time", "customizable", "export"]
        },
        {
            "id": "tool2",
            "title": "Invoice Generator Pro",
            "description": "Professional invoice generation and management system",
            "categories": ["finance", "business", "automation"],
            "features": ["templates", "automation", "export"]
        },
        {
            "id": "tool3",
            "title": "Customer CRM Suite",
            "description": "Complete customer relationship management solution",
            "categories": ["crm", "business", "sales"],
            "features": ["contact-management", "automation", "analytics"]
        }
    ]

    print("Adding test items...")
    for item in test_items:
        recommender.add_item(
            item_id=item["id"],
            title=item["title"],
            description=item["description"],
            categories=item["categories"],
            features=item["features"]
        )

    # Simulate some user interactions
    print("\nAdding user interactions...")
    user_id = "test_user"
    interactions = [
        ("tool1", "view", datetime.now().timestamp() - 3600),  # 1 hour ago
        ("tool2", "click", datetime.now().timestamp() - 1800),  # 30 mins ago
        ("tool1", "favorite", datetime.now().timestamp() - 900)  # 15 mins ago
    ]

    for item_id, action, timestamp in interactions:
        recommender.add_user_interaction(
            user_id=user_id,
            item_id=item_id,
            interaction_type=action,
            timestamp=timestamp
        )

    # Get recommendations
    print("\nGetting recommendations...")
    recommendations = recommender.recommend(
        user_id=user_id,
        context="Looking for business automation tools",
        limit=2
    )
    
    print("\nRecommendations:")
    print(json.dumps(recommendations, indent=2))

    # Get similar items
    print("\nFinding similar items to tool1...")
    similar_items = recommender.similar_items("tool1", limit=2)
    print("\nSimilar items:")
    print(json.dumps(similar_items, indent=2))

if __name__ == "__main__":
    main() 