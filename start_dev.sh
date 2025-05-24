#!/bin/bash
# Start both the frontend and backend servers

# Function to kill processes on exit
cleanup() {
  echo "Stopping servers..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
  exit 0
}

# Set up trap to kill processes on script exit
trap cleanup SIGINT SIGTERM

# Start the backend server
echo "Starting ChessLink backend server..."
cd "$(dirname "$0")/server"
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Start the frontend server
echo "Starting ChessLink frontend server..."
cd "$(dirname "$0")"
npm run dev &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:8765"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID
