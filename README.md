# BizTools Suite

A modular ecosystem of open-source business tools for modern websites. Each component is independently usable while maintaining seamless integration capabilities.

## 🎯 Components

### Core (`biztools-core`)
[![PyPI version](https://badge.fury.io/py/biztools-core.svg)](https://badge.fury.io/py/biztools-core)
- Base utilities and shared infrastructure
- Configuration management
- Common interfaces and protocols
- Authentication helpers

### Recommender (`biztools-recommender`)
[![PyPI version](https://badge.fury.io/py/biztools-recommender.svg)](https://badge.fury.io/py/biztools-recommender)
- Lightweight recommendation engine
- Multiple algorithm implementations
- Easy integration with existing product catalogs
- Customizable scoring and ranking

### Search (`biztools-search`)
[![PyPI version](https://badge.fury.io/py/biztools-search.svg)](https://badge.fury.io/py/biztools-search)
- Fast and relevant search functionality
- Auto-complete and suggestions
- Faceted search support
- Multiple backend options

### E-commerce (`biztools-ecommerce`) [Coming Soon]
- Product management
- Inventory systems
- Order processing
- Payment integrations

## 📦 Installation

Each module can be installed independently:

```bash
# Install individual components
pip install biztools-core
pip install biztools-recommender
pip install biztools-search

# Or install everything
pip install biztools[all]
```

## 🚀 Quick Start

Each module includes its own quick start guide. Here's a basic example:

```python
from biztools.recommender import SimpleRecommender
from biztools.search import SearchEngine

# Initialize components
recommender = SimpleRecommender()
search = SearchEngine()

# Use independently or together
results = search.query("winter jackets")
recommendations = recommender.suggest_similar(product_id="123")
```

## 🏗️ Project Structure

```
biztools/
├── packages/
│   ├── core/
│   │   ├── setup.py
│   │   └── biztools_core/
│   ├── recommender/
│   │   ├── setup.py
│   │   └── biztools_recommender/
│   ├── search/
│   │   ├── setup.py
│   │   └── biztools_search/
│   └── ecommerce/
│       ├── setup.py
│       └── biztools_ecommerce/
├── examples/
│   ├── recommender_demo/
│   ├── search_demo/
│   └── integrated_demo/
├── docs/
└── tests/
```

## 🤝 Contributing

We welcome contributions! Each module has its own contribution guidelines and test suite. Check the respective package directories for specific instructions.

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/biztools.git
cd biztools
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install development dependencies:
```bash
pip install -e ".[dev]"
```

4. Run tests:
```bash
pytest packages/core/tests
pytest packages/recommender/tests
pytest packages/search/tests
```

## 📖 Documentation

Each module includes detailed documentation:

- Core: https://biztools.readthedocs.io/core
- Recommender: https://biztools.readthedocs.io/recommender
- Search: https://biztools.readthedocs.io/search
- E-commerce: Coming Soon

## 📜 License

Each module is licensed under the MIT License, allowing for maximum flexibility in both commercial and open-source projects.

## 🤝 Support

- 📫 [GitHub Issues](https://github.com/yourusername/biztools/issues)
- 💬 [Discord Community](https://discord.gg/biztools)
- 📧 support@biztools.dev 
- postgresql://natesmith@localhost:5432/natesmith