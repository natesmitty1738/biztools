#!/usr/bin/env fish

# Ensure we're in the project root
cd (dirname (status -f))/..

function start_recommender
    echo "Starting LLaMA-Bloom recommender service..."
    # Install recommender dependencies
    pip install -e packages/recommender

    # Start the recommender service
    set -l LLAMA_MODEL_PATH $LLAMA_MODEL_PATH
    if test -z "$LLAMA_MODEL_PATH"
        set LLAMA_MODEL_PATH "./models/llama-7b"
    end

    python scripts/start_recommender.py \
        --llama-model $LLAMA_MODEL_PATH \
        --port 8001 &
    set -g RECOMMENDER_PID $last_pid

    # Wait for recommender to be ready
    echo "Waiting for recommender service to be ready..."
    for i in (seq 30)
        if curl -s http://localhost:8001/health >/dev/null
            echo "Recommender service is ready!"
            break
        end
        sleep 1
        if test $i -eq 30
            echo "Timed out waiting for recommender service"
            cleanup
            exit 1
        end
    end
end

function start_backend
    echo "Starting FastAPI backend server..."
    # Install backend dependencies
    source .venv/bin/activate.fish
    pip install -e packages/billing
    pip install "urllib3<2.0.0" fastapi uvicorn pydantic python-dotenv
    
    # Start the server
    cd packages/billing
    python -m uvicorn biztools.billing.api:app --reload --port 8000 --host 0.0.0.0 &
    set -g BACKEND_PID $last_pid
    cd ../..

    # Wait for server to be ready
    echo "Waiting for backend server to be ready..."
    for i in (seq 30)
        if curl -s http://localhost:8000/docs >/dev/null
            echo "Backend server is ready!"
            break
        end
        sleep 1
        if test $i -eq 30
            echo "Timed out waiting for backend server"
            cleanup
            exit 1
        end
    end
end

function start_frontend
    echo "Starting Next.js frontend server..."
    cd biztools-admin
    npm run dev &
    set -g FRONTEND_PID $last_pid
    cd ..

    # Wait for server to be ready
    echo "Waiting for frontend server to be ready..."
    for i in (seq 30)
        if curl -s http://localhost:3000 >/dev/null
            echo "Frontend server is ready!"
            break
        end
        sleep 1
        if test $i -eq 30
            echo "Timed out waiting for frontend server"
            cleanup
            exit 1
        end
    end
end

function cleanup
    echo "Cleaning up processes..."
    if set -q BACKEND_PID
        kill -TERM $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    end
    if set -q FRONTEND_PID
        kill -TERM $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    end
    if set -q RECOMMENDER_PID
        kill -TERM $RECOMMENDER_PID 2>/dev/null
        wait $RECOMMENDER_PID 2>/dev/null
    end
    # Kill any remaining uvicorn processes
    pkill -f "uvicorn biztools.billing.api:app" 2>/dev/null
    # Kill any remaining next processes
    pkill -f "next dev" 2>/dev/null
    # Kill any remaining recommender processes
    pkill -f "start_recommender.py" 2>/dev/null
    exit 0
end

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Create Python virtual environment if it doesn't exist
if not test -d .venv
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
end

# Activate virtual environment
source .venv/bin/activate.fish

# Upgrade pip
python -m pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -e packages/billing
pip install -e packages/recommender
pip install "urllib3<2.0.0" fastapi uvicorn pydantic python-dotenv

# Install frontend dependencies
if not test -d biztools-admin/node_modules
    echo "Installing frontend dependencies..."
    cd biztools-admin
    npm install
    cd ..
end

# Start servers
start_backend
start_recommender
start_frontend

echo "Development servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Recommender: http://localhost:8001"
echo "Press Ctrl+C to stop all servers"

# Keep script running
wait 