import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createWriteStream } from 'fs';

const streamPipeline = promisify(pipeline);

async function downloadModel() {
  const MODEL_DIR = join(process.cwd(), 'models');
  const MODEL_PATH = join(MODEL_DIR, 'llama-2-7b-chat.gguf');
  const MODEL_URL = 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf';

  // Create models directory if it doesn't exist
  if (!existsSync(MODEL_DIR)) {
    mkdirSync(MODEL_DIR, { recursive: true });
  }

  // Skip if model already exists
  if (existsSync(MODEL_PATH)) {
    console.log('Model already exists, skipping download...');
    return;
  }

  console.log('Downloading LLaMA model...');
  const response = await fetch(MODEL_URL);

  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  await streamPipeline(response.body, createWriteStream(MODEL_PATH));
  console.log('Model downloaded successfully!');
}

async function main() {
  try {
    // Install node-llama-cpp if not already installed
    try {
      execSync('npm list node-llama-cpp', { stdio: 'ignore' });
    } catch {
      console.log('Installing node-llama-cpp...');
      execSync('npm install node-llama-cpp@latest');
    }

    // Download model
    await downloadModel();

    console.log('LLaMA setup completed successfully!');
  } catch (error) {
    console.error('Error setting up LLaMA:', error);
    process.exit(1);
  }
}

main(); 