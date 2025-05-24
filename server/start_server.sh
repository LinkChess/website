#!/bin/bash
# Start the ChessLink server with virtual environment
cd "$(dirname "$0")"
source venv/bin/activate
python app.py
