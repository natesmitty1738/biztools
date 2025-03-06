# BizTools Development Guide

This guide explains how to set up and run the BizTools development environment, including the recommender system, Next.js frontend, and PostgreSQL database.

## Prerequisites

- Docker (for PostgreSQL)
- Python 3.9+
- Node.js 18+
- Fish shell (for running dev scripts) 
- The LLaMA or TinyLlama model files

## Quick Start

The easiest way to start the development environment is to use our `dev.fish` script:

```bash
# Make the script executable if needed
chmod +x scripts/dev.fish

# Run the development environment
./scripts/dev.fish
```

This will:
1. Start PostgreSQL in Docker
2. Set up the Prisma database schema
3. Start the recommender service with LLaMA
4. Start the FastAPI backend server
5. Start the Next.js frontend

When you're done, press `Ctrl+C` to stop all services cleanly.

## TinyLlama Setup

For faster development, we recommend using the TinyLlama model instead of the full LLaMA model:

```bash
# Download and set up TinyLlama
python scripts/setup_llama.py --model-name tinyllama-1.1B --quantization q4_0
```

Then set the environment variable before starting the development environment:

```bash
export LLAMA_MODEL_PATH="./models/tinyllama-1.1b/tinyllama-1.1b-chat-v0.3.q4_0.gguf"
./scripts/dev.fish
```

## Testing the Recommender

Once the development environment is running, you can test the recommender system:

```bash
# Run the integration test script
./scripts/test_recommender_integration.py
```

This will:
1. Add test items to the recommender
2. Simulate user interactions
3. Test recommendations for different users
4. Test similar item recommendations
5. Test the Next.js API integration

## Manual Service Management

If you prefer to start services individually:

### PostgreSQL
```bash
docker run --name biztools-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=biztools -p 5432:5432 -d postgres:15-alpine
```

### Recommender Service
```bash
python scripts/start_recommender.py --llama-model <path-to-model> --port 8001
```

### Next.js Frontend
```bash
cd biztools-admin
npm run dev
```

## Environment Configuration

These are the key environment variables:

- `LLAMA_MODEL_PATH`: Path to the LLaMA model file
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/biztools`)

## Troubleshooting

### PostgreSQL Issues
- If you get "port already in use" errors, check for existing PostgreSQL instances: `docker ps`
- To reset the database: `docker rm -f biztools-postgres && docker volume rm biztools_postgres_data`

### LLaMA Model Issues
- Make sure the model file exists at the specified path
- For memory issues, try using a smaller quantized model (e.g., `q4_0` quantization)

### Prisma Issues
- If schema changes, run: `cd biztools-admin && npx prisma migrate dev`
- To reset the database: `cd biztools-admin && npx prisma migrate reset` 