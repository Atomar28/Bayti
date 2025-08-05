#!/bin/bash

# Start both Node.js and Python servers for Bayti AI integration

echo "Starting Bayti AI Calling Backend..."

# Kill any existing Python processes
pkill -f "python.*start.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Start Python FastAPI server in background
cd ai_backend 
echo "Starting Python FastAPI server on port 8000..."
nohup python3 -c "
import sys
sys.path.append('.')
from main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
" > /tmp/ai_backend.log 2>&1 &
PYTHON_PID=$!

# Wait for Python server to start
sleep 3

# Test Python server
curl -f http://localhost:8000/health || echo "Python server failed to start"

# Start Node.js server in foreground
cd ..
echo "Starting Node.js Express server on port 5000..."
npm run dev &
NODE_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit
}

# Trap exit signals
trap cleanup SIGINT SIGTERM EXIT

echo "Both servers started. Python PID: $PYTHON_PID, Node PID: $NODE_PID"
echo "Access the dashboard at http://localhost:5000"
echo "AI backend health check: http://localhost:8000/health"

# Wait for both processes
wait