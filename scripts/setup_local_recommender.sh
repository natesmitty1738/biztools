#!/bin/bash
# Setup script for local recommender system without Docker

# Exit on error
set -e

# Set working directory to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not found."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install or upgrade pip
echo "🔧 Upgrading pip..."
python -m pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."

# Check if tqdm is installed for download progress bars
python -m pip install tqdm requests

# Install recommender package in development mode
if [ -d "packages/recommender" ]; then
    echo "📦 Installing recommender package in development mode..."
    python -m pip install -e packages/recommender
else
    echo "❌ Error: Recommender package not found at packages/recommender."
    exit 1
fi

# Create models directory if it doesn't exist
if [ ! -d "models" ]; then
    mkdir -p models
fi

# Download TinyLlama model if needed
echo "📥 Checking for TinyLlama model..."
python scripts/download_tinyllama.py

# Make scripts executable
chmod +x scripts/run_local_recommender.py
chmod +x scripts/download_tinyllama.py

echo "✅ Setup complete!"
echo ""
echo "🚀 To run the recommender demo, use:"
echo "   python scripts/run_local_recommender.py"
echo ""
echo "💾 To download the TinyLlama model again, use:"
echo "   python scripts/download_tinyllama.py"
echo ""
echo "📝 If you're using a specific model, you can set the environment variable:"
echo "   export LLAMA_MODEL_PATH=/path/to/your/model.gguf"
echo "" 