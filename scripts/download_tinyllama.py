#!/usr/bin/env python3
"""
Download TinyLlama Model

This script downloads the TinyLlama model for local testing.
TinyLlama is a smaller, more accessible alternative to larger LLaMA models.
"""

import os
import sys
import logging
import argparse
import requests
from pathlib import Path
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("download-tinyllama")

# TinyLlama model info - Updated URL to Q4_0 model
TINYLLAMA_MODEL_URL = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_0.gguf"
TINYLLAMA_MODEL_SIZE = 636734336  # ~637 MB
TINYLLAMA_MODEL_SHA256 = "b79256be5b7f437dbb8d0bdf30fa760f567d5df1b01acf0fec29f31ec172d34d"

def download_file(url, destination, expected_size=None):
    """Download a file with progress bar"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    block_size = 8192  # 8 KB
    
    if expected_size and total_size > 0 and abs(total_size - expected_size) > 1024:
        logger.warning(
            f"Expected file size ({expected_size} bytes) doesn't match "
            f"reported size ({total_size} bytes)"
        )
    
    # Create parent directories if they don't exist
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    with open(destination, 'wb') as f:
        with tqdm(total=total_size, unit='B', unit_scale=True, desc=os.path.basename(destination)) as pbar:
            for chunk in response.iter_content(chunk_size=block_size):
                if chunk:
                    f.write(chunk)
                    pbar.update(len(chunk))
    
    return os.path.getsize(destination)

def verify_file_size(file_path, expected_size):
    """Verify the file size is as expected"""
    actual_size = os.path.getsize(file_path)
    if abs(actual_size - expected_size) > 1024:  # Allow 1KB difference
        logger.warning(
            f"File size mismatch. Expected: {expected_size} bytes, "
            f"Actual: {actual_size} bytes"
        )
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description='Download TinyLlama model for local testing')
    parser.add_argument('--output-dir', type=str, default='models',
                        help='Directory to save the model (default: models)')
    args = parser.parse_args()
    
    # Set up paths
    project_root = Path(__file__).parent.parent.absolute()
    output_dir = project_root / args.output_dir / "tinyllama-1.1b"
    model_path = output_dir / "tinyllama-1.1b-chat-v1.0.Q4_0.gguf"
    
    # Check if model already exists
    if model_path.exists() and verify_file_size(model_path, TINYLLAMA_MODEL_SIZE):
        logger.info(f"Model already exists at {model_path}")
        logger.info(f"File size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
        return 0
    
    # Download the model
    logger.info(f"Downloading TinyLlama model to {model_path}")
    try:
        download_file(TINYLLAMA_MODEL_URL, model_path, TINYLLAMA_MODEL_SIZE)
        logger.info(f"Downloaded TinyLlama model ({os.path.getsize(model_path) / (1024*1024):.2f} MB)")
        
        # Verify downloaded file
        if verify_file_size(model_path, TINYLLAMA_MODEL_SIZE):
            logger.info("File size verification passed")
        
        logger.info(f"Model saved to: {model_path}")
        return 0
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 