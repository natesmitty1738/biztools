#!/usr/bin/env fish
# Setup script for local recommender system without Docker (Fish shell version)

# Set working directory to project root
set SCRIPT_DIR (dirname (status -f))
set PROJECT_ROOT (dirname $SCRIPT_DIR)
cd $PROJECT_ROOT

# Check Python
if not command -v python3 &> /dev/null
    echo "❌ Error: Python 3 is required but not found."
    exit 1
end

# Create virtual environment if it doesn't exist
if not test -d ".venv"
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv .venv
end

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate.fish

# Install or upgrade pip
echo "🔧 Upgrading pip..."
python -m pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."

# Check if tqdm is installed for download progress bars
python -m pip install tqdm requests

# Install recommender package in development mode
if test -d "packages/recommender"
    echo "📦 Installing recommender package in development mode..."
    python -m pip install -e packages/recommender
else
    echo "❌ Error: Recommender package not found at packages/recommender."
    exit 1
end

# Create models directory if it doesn't exist
if not test -d "models"
    mkdir -p models
end

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
echo "   set -x LLAMA_MODEL_PATH /path/to/your/model.gguf"
echo "" 