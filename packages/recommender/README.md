# BizTools Recommender

A powerful recommendation engine combining LLaMA language model with Bloom filters for efficient and context-aware recommendations.

## Features

- Content-based recommendations using LLaMA
- Efficient filtering with Bloom filters
- Metal acceleration support for macOS
- Real-time user interaction tracking
- Similar item recommendations
- Caching for improved performance

## Installation

```bash
pip install -e .
```

## Requirements

- Python 3.9+
- LLaMA model (7B, 13B, 30B, or 65B)
- CMake for building llama.cpp
- Metal-capable GPU (for macOS) 