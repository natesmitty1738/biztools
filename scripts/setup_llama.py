#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_llama(model_name: str = "llama-7B", output_dir: str = None, quantization: str = "q4_0"):
    """
    Set up LLaMA or TinyLlama model
    model_name: Name of the model (llama-7B, llama-13B, tinyllama-1.1B, etc.)
    output_dir: Directory to store the model
    quantization: Quantization format (q4_0, q3_K_S, q2_K, etc.)
    """
    if output_dir is None:
        output_dir = os.path.join(os.getcwd(), "models", model_name.lower())
    
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

    # Download the model based on selection
    logger.info(f"Downloading {model_name} model with {quantization} quantization...")
    
    if "tinyllama" in model_name.lower():
        # TinyLlama model
        model_url = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main"
        model_file = f"tinyllama-1.1b-chat-v1.0.{quantization}.gguf"
    elif "llama-7b" in model_name.lower():
        # Standard LLaMA 7B model
        model_url = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main"
        model_file = f"llama-2-7b-chat.{quantization}.gguf"
    elif "llama-13b" in model_name.lower():
        # LLaMA 13B model
        model_url = "https://huggingface.co/TheBloke/Llama-2-13B-Chat-GGUF/resolve/main"
        model_file = f"llama-2-13b-chat.{quantization}.gguf"
    else:
        raise ValueError(f"Unsupported model: {model_name}")
    
    subprocess.run([
        "curl", "-L",
        f"{model_url}/{model_file}",
        "-o", str(output_dir / model_file)
    ], check=True)

    # Create a symlink to the latest model
    latest_link = Path("./models/llama-latest")
    if latest_link.exists():
        latest_link.unlink()
    latest_link.symlink_to(output_dir / model_file)

    logger.info(f"Model setup complete!")
    logger.info(f"Model path: {output_dir / model_file}")
    
    # Set environment variable
    with open(".env", "a") as f:
        f.write(f"\nLLAMA_MODEL_PATH={output_dir / model_file}\n")
    
    logger.info("Added LLAMA_MODEL_PATH to .env file")

def main():
    parser = argparse.ArgumentParser(description="Set up LLaMA or TinyLlama model")
    parser.add_argument(
        "--model-name",
        choices=["llama-7B", "llama-13B", "tinyllama-1.1B"],
        default="tinyllama-1.1B",
        help="Name of the model to use"
    )
    parser.add_argument(
        "--quantization",
        choices=["q2_K", "q3_K_S", "q4_0", "q5_0", "q6_K", "q8_0"],
        default="q4_0",
        help="Quantization format"
    )
    parser.add_argument(
        "--output-dir",
        help="Directory to store the model"
    )
    
    args = parser.parse_args()
    setup_llama(args.model_name, args.output_dir, args.quantization)

if __name__ == "__main__":
    main() 