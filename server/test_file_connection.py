#!/usr/bin/env python3
"""
Test script for the file-based connection to the ChessLink server.
This connects to the server, specifies moves.txt as the input file,
and starts a game to monitor the file for changes.
"""

import socketio
import time
import asyncio
import json
import sys
import signal
import os

# Server address
SERVER_URI = "http://127.0.0.1:8765"
GAME_ID = "long-sim-game-001"

# Create Socket.IO client
sio = socketio.AsyncClient()

# Event handlers
@sio.event
async def connect():
    print("Connected to server!")

@sio.event
async def disconnect():
    print("Disconnected from server")

@sio.event
async def connect_error(data):
    print(f"Connection error: {data}")

@sio.on('*')
def catch_all(event, data):
    """Handle all events from the server"""
    print(f"\n[EVENT] Received event '{event}':")
    print(json.dumps(data, indent=2))
    
    # Special handling for position events
    if event == 'position':
        print(f"\n[MOVE] New position detected!")
        print(f"  Player: {data.get('player', 'unknown')}")
        print(f"  Move: {data.get('algebraic', 'unknown')}")
        print(f"  FEN: {data.get('fen', 'unknown')}")

async def check_file_status():
    """Periodically check the file status"""
    while True:
        try:
            # Read the current content of the file
            if os.path.exists("moves.txt"):
                with open("moves.txt", "r", encoding="utf-8") as f:
                    lines = f.readlines()
                print(f"\n[FILE] moves.txt has {len(lines)} lines")
                if lines:
                    print(f"  Last line: {lines[-1].strip()}")
            else:
                print("\n[FILE] moves.txt does not exist")
        except Exception as e:
            print(f"\n[ERROR] Error checking file: {e}")
            
        await asyncio.sleep(5)  # Check every 5 seconds

async def run_test():
    """Run the test"""
    print(f"Connecting to {SERVER_URI}...")
    await sio.connect(SERVER_URI)
    
    # Start file monitoring task
    asyncio.create_task(check_file_status())
    
    # Connect to the file
    print("Connecting to moves.txt file...")
    await sio.emit("connect_hardware", {"port": "FILE", "file_path": "moves.txt"})
    await asyncio.sleep(2)  # Wait for connection to establish
    
    # Start a game
    print(f"Starting game with ID: {GAME_ID}")
    await sio.emit("start_game", {
        "id": GAME_ID,
        "title": "File Test Game",
        "white": "File Player 1",
        "black": "File Player 2"
    })
    
    # Wait indefinitely to receive position updates
    print("Listening for position updates (Ctrl+C to exit)...")
    try:
        while True:
            # Periodically emit get_live_games to keep things active
            await sio.emit("get_live_games")
            await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("Test cancelled")
    
    # End the game
    print("Ending game...")
    await sio.emit("end_game", {"gameId": GAME_ID})
    await asyncio.sleep(1)
    
    # Disconnect hardware
    print("Disconnecting hardware...")
    await sio.emit("disconnect_hardware")
    await asyncio.sleep(1)
    
    # Disconnect from server
    await sio.disconnect()

def signal_handler(sig, frame):
    """Handle Ctrl+C"""
    print("\nInterrupted by user. Shutting down...")
    
    # Create a new event loop to run the clean shutdown process
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def shutdown():
        if sio.connected:
            # Try to gracefully clean up
            try:
                await sio.emit("end_game", {"gameId": GAME_ID})
                await asyncio.sleep(0.5)
                await sio.emit("disconnect_hardware")
                await asyncio.sleep(0.5)
                await sio.disconnect()
            except:
                pass
    
    loop.run_until_complete(shutdown())
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Run the test
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Error during test: {e}")
    
    print("Test completed") 