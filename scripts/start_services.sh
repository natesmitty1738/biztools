#!/bin/bash

# Configuration
LLAMA_MODEL_PATH="${LLAMA_MODEL_PATH:-./models/llama-7b}"
RECOMMENDER_PORT=8000
RECOMMENDER_PID_FILE=".recommender.pid"
LOG_DIR="./logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "🚀 Starting BizTools services..."

# Start the recommender service
echo "📚 Starting recommender service..."
python scripts/start_recommender.py \
  --llama-model "$LLAMA_MODEL_PATH" \
  --port "$RECOMMENDER_PORT" \
  > "$LOG_DIR/recommender.log" 2>&1 &

# Save the PID
echo $! > "$RECOMMENDER_PID_FILE"
echo "✅ Recommender service started (PID: $!)"

# Wait for recommender to initialize
echo "⏳ Waiting for recommender to initialize..."
while ! curl -s "http://localhost:$RECOMMENDER_PORT/health" > /dev/null; do
  sleep 1
done

echo "🎉 All services started successfully!"
echo "📝 Logs available in $LOG_DIR"
echo "💡 To stop services, run: ./scripts/stop_services.sh" 