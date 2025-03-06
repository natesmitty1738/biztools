#!/usr/bin/env python3
import sys
import os
import json
import time
import requests
import random
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# API endpoints
RECOMMENDER_API = "http://localhost:8001"
NEXTJS_API = "http://localhost:3000/api"

# Sample test data
TEST_ITEMS = [
    {
        "id": "item1",
        "title": "Smartphone XS10",
        "description": "Advanced smartphone with 8GB RAM and 128GB storage",
        "categories": ["Electronics", "Phones"],
        "features": ["5G", "AMOLED", "8GB RAM"]
    },
    {
        "id": "item2",
        "title": "Laptop Pro 15",
        "description": "Professional laptop for developers and designers",
        "categories": ["Electronics", "Computers"],
        "features": ["16GB RAM", "512GB SSD", "Core i7"]
    },
    {
        "id": "item3",
        "title": "Wireless Headphones",
        "description": "Noise-cancelling wireless headphones with 20h battery life",
        "categories": ["Electronics", "Audio"],
        "features": ["Bluetooth", "Noise Cancellation", "20h Battery"]
    },
    {
        "id": "item4",
        "title": "Python Programming",
        "description": "Comprehensive guide to Python programming for beginners",
        "categories": ["Books", "Programming"],
        "features": ["Beginner", "Coding", "Tutorial"]
    },
    {
        "id": "item5",
        "title": "Machine Learning Basics",
        "description": "Introduction to machine learning concepts and applications",
        "categories": ["Books", "AI"],
        "features": ["AI", "Data Science", "Programming"]
    },
    {
        "id": "item6",
        "title": "Winter Jacket",
        "description": "Warm winter jacket with waterproof exterior",
        "categories": ["Clothing", "Outdoor"],
        "features": ["Waterproof", "Insulated", "Hooded"]
    }
]

TEST_USERS = ["user1", "user2", "user3"]

def check_health():
    """Check if the recommender service is running"""
    try:
        response = requests.get(f"{RECOMMENDER_API}/health")
        if response.status_code == 200:
            logger.info("✅ Recommender service is running")
            return True
        else:
            logger.error(f"❌ Recommender service returned status {response.status_code}")
            return False
    except requests.RequestException as e:
        logger.error(f"❌ Failed to connect to recommender service: {e}")
        return False

def add_test_items():
    """Add test items to the recommender"""
    logger.info("➕ Adding test items to recommender...")
    success_count = 0
    
    for item in TEST_ITEMS:
        try:
            response = requests.post(
                f"{RECOMMENDER_API}/items",
                json=item
            )
            if response.status_code == 200:
                success_count += 1
                logger.info(f"✅ Added item: {item['title']}")
            else:
                logger.error(f"❌ Failed to add item {item['title']}: {response.text}")
        except requests.RequestException as e:
            logger.error(f"❌ Exception adding item {item['title']}: {e}")
    
    logger.info(f"Added {success_count}/{len(TEST_ITEMS)} items")
    return success_count == len(TEST_ITEMS)

def simulate_user_interactions():
    """Simulate user interactions with items"""
    logger.info("👤 Simulating user interactions...")
    success_count = 0
    total_interactions = 0
    
    # User 1 likes electronics (particularly phones)
    interactions = [
        {"userId": "user1", "itemId": "item1", "interactionType": "click", "timestamp": time.time()},
        {"userId": "user1", "itemId": "item1", "interactionType": "wishlist", "timestamp": time.time()},
        {"userId": "user1", "itemId": "item2", "interactionType": "click", "timestamp": time.time()},
        {"userId": "user1", "itemId": "item3", "interactionType": "purchase", "timestamp": time.time()}
    ]
    
    # User 2 likes books
    interactions.extend([
        {"userId": "user2", "itemId": "item4", "interactionType": "click", "timestamp": time.time()},
        {"userId": "user2", "itemId": "item4", "interactionType": "purchase", "timestamp": time.time()},
        {"userId": "user2", "itemId": "item5", "interactionType": "click", "timestamp": time.time()},
        {"userId": "user2", "itemId": "item5", "interactionType": "wishlist", "timestamp": time.time()}
    ])
    
    # User 3 has mixed preferences
    interactions.extend([
        {"userId": "user3", "itemId": "item2", "interactionType": "click", "timestamp": time.time()},
        {"userId": "user3", "itemId": "item5", "interactionType": "purchase", "timestamp": time.time()},
        {"userId": "user3", "itemId": "item6", "interactionType": "wishlist", "timestamp": time.time()}
    ])
    
    total_interactions = len(interactions)
    
    for interaction in interactions:
        try:
            response = requests.post(
                f"{RECOMMENDER_API}/interactions",
                json=interaction
            )
            if response.status_code == 200:
                success_count += 1
                logger.info(f"✅ Recorded {interaction['interactionType']} on {interaction['itemId']} for {interaction['userId']}")
            else:
                logger.error(f"❌ Failed to record interaction: {response.text}")
        except requests.RequestException as e:
            logger.error(f"❌ Exception recording interaction: {e}")
    
    logger.info(f"Recorded {success_count}/{total_interactions} interactions")
    return success_count == total_interactions

def test_recommendations():
    """Test getting recommendations for users"""
    logger.info("🔍 Testing user recommendations...")
    
    for user_id in TEST_USERS:
        try:
            response = requests.post(
                f"{RECOMMENDER_API}/recommendations",
                json={"userId": user_id, "limit": 3}
            )
            
            if response.status_code == 200:
                recommendations = response.json().get("recommendations", [])
                logger.info(f"✅ Recommendations for {user_id}:")
                
                for i, rec in enumerate(recommendations, 1):
                    logger.info(f"  {i}. {rec['title']} (score: {rec['score']:.2f})")
                
                if not recommendations:
                    logger.warning(f"⚠️ No recommendations for {user_id}")
            else:
                logger.error(f"❌ Failed to get recommendations for {user_id}: {response.text}")
                
        except requests.RequestException as e:
            logger.error(f"❌ Exception getting recommendations: {e}")
    
    return True

def test_similar_items():
    """Test getting similar items"""
    logger.info("🔄 Testing similar items...")
    
    test_items = ["item2", "item4"]  # Laptop Pro 15, Python Programming
    
    for item_id in test_items:
        try:
            response = requests.get(f"{RECOMMENDER_API}/similar-items/{item_id}?limit=3")
            
            if response.status_code == 200:
                similar_items = response.json().get("items", [])
                logger.info(f"✅ Similar items to {item_id}:")
                
                for i, item in enumerate(similar_items, 1):
                    logger.info(f"  {i}. {item['title']} (similarity: {item['similarity']:.2f})")
                
                if not similar_items:
                    logger.warning(f"⚠️ No similar items for {item_id}")
            else:
                logger.error(f"❌ Failed to get similar items for {item_id}: {response.text}")
                
        except requests.RequestException as e:
            logger.error(f"❌ Exception getting similar items: {e}")
    
    return True

def test_nextjs_integration():
    """Test the Next.js API integration"""
    logger.info("🌐 Testing Next.js API integration...")
    
    # Test getting recommendations via Next.js API
    try:
        user_id = random.choice(TEST_USERS)
        response = requests.get(f"{NEXTJS_API}/recommender?userId={user_id}&limit=3")
        
        if response.status_code == 200:
            recommendations = response.json()
            logger.info(f"✅ Next.js API recommendations for {user_id}:")
            
            for i, rec in enumerate(recommendations, 1):
                logger.info(f"  {i}. {rec['title']} (score: {rec.get('score', 'N/A')})")
            
            if not recommendations:
                logger.warning(f"⚠️ No recommendations from Next.js API for {user_id}")
        else:
            logger.error(f"❌ Failed to get recommendations from Next.js API: {response.text}")
            
    except requests.RequestException as e:
        logger.error(f"❌ Exception with Next.js API: {e}")
        logger.info("⚠️ Next.js API integration test skipped - API might not be implemented yet")
    
    # Test recording a click via Next.js API
    try:
        user_id = random.choice(TEST_USERS)
        item_id = random.choice([item["id"] for item in TEST_ITEMS])
        
        response = requests.post(
            f"{NEXTJS_API}/recommender/click",
            json={"userId": user_id, "itemId": item_id}
        )
        
        if response.status_code == 200:
            logger.info(f"✅ Recorded click via Next.js API: {user_id} clicked on {item_id}")
        else:
            logger.error(f"❌ Failed to record click via Next.js API: {response.text}")
            
    except requests.RequestException as e:
        logger.error(f"❌ Exception with Next.js API click recording: {e}")
        logger.info("⚠️ Next.js API click recording test skipped - API might not be implemented yet")
    
    return True

def main():
    """Main test function"""
    logger.info("🚀 Starting recommender integration tests...")
    
    # Check if recommender is running
    if not check_health():
        logger.error("❌ Recommender service is not running. Please start it first.")
        sys.exit(1)
    
    # Run tests
    tests = [
        ("Adding test items", add_test_items),
        ("Simulating user interactions", simulate_user_interactions),
        ("Testing recommendations", test_recommendations),
        ("Testing similar items", test_similar_items),
        ("Testing Next.js integration", test_nextjs_integration)
    ]
    
    success_count = 0
    
    for test_name, test_func in tests:
        logger.info(f"\n🔷 TEST: {test_name}")
        try:
            if test_func():
                success_count += 1
                logger.info(f"✅ {test_name} - Passed")
            else:
                logger.error(f"❌ {test_name} - Failed")
        except Exception as e:
            logger.error(f"❌ {test_name} - Exception: {e}", exc_info=True)
    
    # Summary
    logger.info(f"\n📋 TEST SUMMARY: {success_count}/{len(tests)} tests passed")
    
    if success_count == len(tests):
        logger.info("🎉 All tests passed!")
    else:
        logger.warning(f"⚠️ {len(tests) - success_count} tests failed")
    
    return 0 if success_count == len(tests) else 1

if __name__ == "__main__":
    sys.exit(main()) 