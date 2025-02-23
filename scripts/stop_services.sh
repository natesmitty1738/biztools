#!/bin/bash

RECOMMENDER_PID_FILE=".recommender.pid"

echo "🛑 Stopping BizTools services..."

# Stop recommender service
if [ -f "$RECOMMENDER_PID_FILE" ]; then
    PID=$(cat "$RECOMMENDER_PID_FILE")
    if ps -p "$PID" > /dev/null; then
        echo "📚 Stopping recommender service (PID: $PID)..."
        kill "$PID"
        while ps -p "$PID" > /dev/null; do
            sleep 1
        done
        echo "✅ Recommender service stopped"
    else
        echo "⚠️  Recommender service was not running"
    fi
    rm "$RECOMMENDER_PID_FILE"
else
    echo "⚠️  No recommender PID file found"
fi

echo "🎉 All services stopped successfully!" 