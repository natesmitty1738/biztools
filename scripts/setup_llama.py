#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_llama(model_size: str = "7B", output_dir: str = None):
    """
    Set up LLaMA model
    model_size: Size of the model (7B, 13B, 30B, or 65B)
    output_dir: Directory to store the model
    """
    if output_dir is None:
        output_dir = os.path.join(os.getcwd(), "models", f"llama-{model_size.lower()}")
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Clone llama.cpp if not exists
    llama_cpp_dir = Path("./vendor/llama.cpp")
    if not llama_cpp_dir.exists():
        logger.info("Cloning llama.cpp...")
        subprocess.run([
            "git", "clone",
            "https://github.com/ggerganov/llama.cpp.git",
            str(llama_cpp_dir)
        ], check=True)

    # Build llama.cpp using CMake
    logger.info("Building llama.cpp...")
    build_dir = llama_cpp_dir / "build"
    build_dir.mkdir(exist_ok=True)
    
    # Configure CMake
    subprocess.run([
        "cmake",
        "..",
        "-DLLAMA_METAL=ON",  # Enable Metal support for macOS
        "-DBUILD_SHARED_LIBS=ON"
    ], cwd=str(build_dir), check=True)
    
    # Build
    subprocess.run([
        "cmake",
        "--build", ".",
        "--config", "Release",
        "-j", str(os.cpu_count())
    ], cwd=str(build_dir), check=True)

    # Download the model
    logger.info(f"Downloading LLaMA {model_size} model...")
    model_url = f"https://huggingface.co/TheBloke/LLaMA-{model_size}-GGML/resolve/main"
    model_file = f"llama-{model_size.lower()}.ggmlv3.q4_0.bin"
    
    subprocess.run([
        "curl", "-L",
        f"{model_url}/{model_file}",
        "-o", str(output_dir / model_file)
    ], check=True)

    # Create a symlink to the latest model
    latest_link = Path("./models/llama-latest")
    if latest_link.exists():
        latest_link.unlink()
    latest_link.symlink_to(output_dir)

    logger.info(f"LLaMA {model_size} model setup complete!")
    logger.info(f"Model path: {output_dir / model_file}")
    
    # Set environment variable
    with open(".env", "a") as f:
        f.write(f"\nLLAMA_MODEL_PATH={output_dir / model_file}\n")
    
    logger.info("Added LLAMA_MODEL_PATH to .env file")

def main():
    parser = argparse.ArgumentParser(description="Set up LLaMA model")
    parser.add_argument(
        "--model-size",
        choices=["7B", "13B", "30B", "65B"],
        default="7B",
        help="Size of the LLaMA model to use"
    )
    parser.add_argument(
        "--output-dir",
        help="Directory to store the model"
    )
    
    args = parser.parse_args()
    setup_llama(args.model_size, args.output_dir)

if __name__ == "__main__":
    main() 