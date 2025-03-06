#!/usr/bin/env fish

# Ensure we're in the project root
cd (dirname (status -f))/..

# Project configuration
set -g POSTGRES_PORT 5432
set -g BACKEND_PORT 8000
set -g RECOMMENDER_PORT 8001
set -g FRONTEND_PORT 3000
set -g DATABASE_URL "postgresql://postgres:postgres@localhost:$POSTGRES_PORT/biztools"
set -g MAX_STARTUP_WAIT 60  # Maximum seconds to wait for each service

function setup_environment
    echo "🔧 Setting up environment variables..."
    
    # Check for LLAMA_MODEL_PATH
    if test -z "$LLAMA_MODEL_PATH"
        # Default to TinyLlama model for faster development
        set -gx LLAMA_MODEL_PATH "./models/tinyllama-1.1b/tinyllama-1.1b-chat-v0.3.q4_0.gguf"
        echo "⚠️  LLAMA_MODEL_PATH not set, using default: $LLAMA_MODEL_PATH"
        
        # Check if the model file exists
        if not test -f "$LLAMA_MODEL_PATH"
            echo "⚠️  Model file not found. You may need to run: python scripts/setup_llama.py --model-name tinyllama-1.1B"
        end
    end
    
    # Set up DATABASE_URL
    set -gx DATABASE_URL $DATABASE_URL
end

function start_postgres
    echo "🐘 Starting PostgreSQL via Docker..."
    
    # Check if PostgreSQL is already running
    if docker ps | grep -q postgres
        echo "✅ PostgreSQL is already running"
        return 0
    end
    
    # Start PostgreSQL container
    docker run --name biztools-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=biztools \
        -p $POSTGRES_PORT:5432 \
        -v biztools_postgres_data:/var/lib/postgresql/data \
        -d postgres:15-alpine
    
    # Check if PostgreSQL started successfully
    if test $status -ne 0
        echo "❌ Failed to start PostgreSQL"
        return 1
    end
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in (seq $MAX_STARTUP_WAIT)
        if docker exec biztools-postgres pg_isready -U postgres > /dev/null 2>&1
            echo "✅ PostgreSQL is ready!"
            return 0
        end
        sleep 1
        echo -n "."
    end
    
    echo "❌ Timed out waiting for PostgreSQL"
    return 1
end

function setup_prisma
    echo "🔄 Setting up Prisma and database schema..."
    
    cd biztools-admin
    
    # Install dependencies if needed
    if not test -d node_modules
        echo "📦 Installing npm dependencies..."
        npm install
    end
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # Run migrations if needed
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy
    
    # Seed the database with initial data
    echo "🌱 Seeding the database..."
    npx prisma db seed
    
    cd ..
end

function start_recommender
    echo "🧠 Starting LLaMA-Bloom recommender service..."
    
    # Install recommender dependencies
    pip install -e packages/recommender

    # Start the recommender service
    python scripts/start_recommender.py \
        --llama-model $LLAMA_MODEL_PATH \
        --port $RECOMMENDER_PORT \
        --host 0.0.0.0 &
    set -g RECOMMENDER_PID $last_pid

    # Wait for recommender to be ready
    echo "⏳ Waiting for recommender service to be ready..."
    for i in (seq $MAX_STARTUP_WAIT)
        if curl -s http://localhost:$RECOMMENDER_PORT/health >/dev/null
            echo "✅ Recommender service is ready!"
            return 0
        end
        sleep 1
        echo -n "."
        if test $i -eq $MAX_STARTUP_WAIT
            echo "❌ Timed out waiting for recommender service"
            return 1
        end
    end
end

function start_backend
    echo "🚀 Starting FastAPI backend server..."
    
    # Install backend dependencies
    pip install -e packages/billing
    pip install "urllib3<2.0.0" fastapi uvicorn pydantic python-dotenv
    
    # Start the server
    cd packages/billing
    python -m uvicorn biztools.billing.api:app --reload --port $BACKEND_PORT --host 0.0.0.0 &
    set -g BACKEND_PID $last_pid
    cd ../..

    # Wait for server to be ready
    echo "⏳ Waiting for backend server to be ready..."
    for i in (seq $MAX_STARTUP_WAIT)
        if curl -s http://localhost:$BACKEND_PORT/docs >/dev/null
            echo "✅ Backend server is ready!"
            return 0
        end
        sleep 1
        echo -n "."
        if test $i -eq $MAX_STARTUP_WAIT
            echo "❌ Timed out waiting for backend server"
            return 1
        end
    end
end

function start_frontend
    echo "🌐 Starting Next.js frontend server..."
    cd biztools-admin
    
    # Start the Next.js server
    npm run dev &
    set -g FRONTEND_PID $last_pid
    cd ..

    # Wait for server to be ready
    echo "⏳ Waiting for frontend server to be ready..."
    for i in (seq $MAX_STARTUP_WAIT)
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null
            echo "✅ Frontend server is ready!"
            return 0
        end
        sleep 1
        echo -n "."
        if test $i -eq $MAX_STARTUP_WAIT
            echo "❌ Timed out waiting for frontend server"
            return 1
        end
    end
end

function cleanup
    echo "🧹 Cleaning up processes..."
    
    # Kill backend process
    if set -q BACKEND_PID
        kill -TERM $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    end
    
    # Kill frontend process
    if set -q FRONTEND_PID
        kill -TERM $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    end
    
    # Kill recommender process
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
    
    # Stop PostgreSQL
    echo "🛑 Stopping PostgreSQL container..."
    docker stop biztools-postgres 2>/dev/null
    docker rm biztools-postgres 2>/dev/null
    
    exit 0
end

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Create Python virtual environment if it doesn't exist
if not test -d .venv
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv .venv
end

# Activate virtual environment
source .venv/bin/activate.fish

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -e packages/billing
pip install -e packages/recommender
pip install "urllib3<2.0.0" fastapi uvicorn pydantic python-dotenv

# Start all services
echo "🚀 Starting BizTools development environment..."

setup_environment
if start_postgres
    setup_prisma
    if start_recommender; and start_backend; and start_frontend
        echo "🎉 All services started successfully!"
        echo "📊 Services summary:"
        echo "  - Frontend: http://localhost:$FRONTEND_PORT"
        echo "  - Backend: http://localhost:$BACKEND_PORT"
        echo "  - Recommender: http://localhost:$RECOMMENDER_PORT"
        echo "  - PostgreSQL: localhost:$POSTGRES_PORT"
        echo "💡 Press Ctrl+C to stop all services"
    else
        echo "❌ Failed to start some services"
        cleanup
    end
else
    echo "❌ Failed to start PostgreSQL"
    cleanup
end

# Keep script running
wait 