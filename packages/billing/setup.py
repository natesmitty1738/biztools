from setuptools import setup, find_packages

setup(
    name="biztools-billing",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn>=0.24.0",
        "pydantic>=2.4.2",
        "python-dotenv>=1.0.0",
        "stripe>=7.0.0",
        "PyYAML>=6.0",
        "Jinja2>=3.0.0",
        "urllib3<2.0.0",
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
    description="Billing system for BizTools Suite",
    long_description=open("README.md").read() if open("README.md") else "",
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