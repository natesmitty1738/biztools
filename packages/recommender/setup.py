from setuptools import setup, find_packages

setup(
    name="biztools-recommender",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy>=1.24.3",
        "scipy>=1.10.1",
        "scikit-learn>=1.3.2",
        "pandas>=2.1.2",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "black>=23.3.0",
            "isort>=5.12.0",
            "mypy>=1.5.1",
        ],
    },
    author="Your Name",
    author_email="your.email@example.com",
    description="LLaMA-powered recommendation engine with Bloom filter optimization",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/biztools",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
) 