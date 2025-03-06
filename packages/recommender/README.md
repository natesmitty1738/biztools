# BizTools Recommender

A powerful, modular recommendation engine that combines the strengths of LLaMA embeddings with efficient Bloom filters for ultra-fast retrieval and personalization.

## Features

- **LLaMA Integration**: Uses LLaMA/TinyLlama for high-quality embeddings
- **Bloom Filter Optimization**: Efficiently pre-filters candidate items
- **Multiple Recommendation Types**: Content-based, collaborative filtering, and hybrid approaches
- **Low Resource Requirements**: Can run on smaller models for development
- **Simple API**: Easy to integrate with any web application
- **Next.js Integration**: Ready-to-use API routes and components

## Installation

```bash
pip install biztools-recommender
```

Or install in development mode:

```bash
git clone https://github.com/yourusername/biztools.git
cd biztools
pip install -e ./packages/recommender
```

## Quick Start

```python
from biztools_recommender import LlamaBloomRecommender

# Initialize with model path
recommender = LlamaBloomRecommender(
    llama_model_path="/path/to/model.gguf",
    cache_size=10000,
    false_positive_rate=0.01
)

# Add items to the catalog
recommender.add_item(
    "item1", 
    "Smartphone XS10",
    "Advanced smartphone with 8GB RAM and 128GB storage",
    ["Electronics", "Phones"],
    ["5G", "AMOLED", "8GB RAM"]
)

# Record user interactions
recommender.add_user_interaction(
    "user1",
    "item1",
    "click",
    timestamp=1677721600
)

# Get recommendations
recommendations = recommender.recommend("user1", limit=5)
print(recommendations)

# Find similar items
similar_items = recommender.similar_items("item1", limit=3)
print(similar_items)
```

## Using Smaller Models for Development

For development and testing, you can use smaller models like TinyLlama instead of the full-sized LLaMA models. This significantly reduces memory usage and speeds up loading times.

### Setup TinyLlama

1. Download a quantized TinyLlama model:

```bash
python scripts/setup_llama.py --model-name tinyllama-1.1B --quantization q4_0
```

2. This will download a ~600MB model instead of the multi-gigabyte LLaMA models.

3. Use the model path in your recommender:

```python
recommender = LlamaBloomRecommender(
    llama_model_path="models/tinyllama-1.1b/tinyllama-1.1b-chat-v0.3.q4_0.gguf",
    cache_size=1000,  # Can be smaller for development
    false_positive_rate=0.01
)
```

## Next.js Integration

Check the `examples/nextjs_integration.ts` file for a complete example of how to integrate the recommender with a Next.js application.

Key components:

1. **API Routes**: Ready-to-use API routes for recommendations and tracking clicks
2. **Service Layer**: A singleton service for efficient model management
3. **React Components**: Example components for displaying recommendations

## Production Deployment

For production:

1. Use the larger LLaMA models (7B or 13B) for better quality
2. Consider deploying the recommender service separately from your web server
3. Use a distributed cache for the Bloom filters
4. Implement periodic model retraining based on new interactions

## License

MIT 