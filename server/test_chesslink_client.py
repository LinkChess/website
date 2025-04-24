#!/usr/bin/env python
"""
Test client for the ChessLink WebSocket server (app.py)
"""

import socketio
import time

# Create a SocketIO client
sio = socketio.Client()

# Define event handlers
@sio.event
def connect():
    print("Connected to ChessLink server!")

@sio.event
def disconnect():
    print("Disconnected from ChessLink server!")

@sio.on('hardware_status')
def on_hardware_status(data):
    print(f"Hardware status: {data}")

@sio.on('hardware_connected')
def on_hardware_connected(data):
    print(f"Hardware connected: {data}")

@sio.on('error')
def on_error(data):
    print(f"Error: {data}")

@sio.on('game_started')
def on_game_started(data):
    print(f"Game started: {data}")

@sio.on('position')
def on_position(data):
    print(f"Position update: {data}")

def main():
    print("ChessLink Test Client")
    print("Connecting to server...")
    
    try:
        # Connect to the server
        sio.connect('http://localhost:8765')
        
        # Try to connect to hardware (using MOCK for testing)
        print("\nTesting hardware connection...")
        sio.emit('connect_hardware', {'port': 'MOCK'})
        time.sleep(2)
        
        # Get list of live games
        print("\nGetting live games...")
        sio.emit('get_live_games')
        time.sleep(2)
        
        # Try to start a game
        print("\nTrying to start a game...")
        sio.emit('start_game', {
            'id': 'test-game-123',
            'title': 'Test Game',
            'white': 'Player 1',
            'black': 'Player 2'
        })
        time.sleep(2)
        
        # Disconnect
        print("\nDisconnecting...")
        sio.disconnect()
        
    except socketio.exceptions.ConnectionError as e:
        print(f"Connection error: {e}")
    except (socketio.exceptions.TimeoutError, RuntimeError) as e:  # More specific exceptions
        print(f"Socket error: {e}")

if __name__ == "__main__":
    main() 