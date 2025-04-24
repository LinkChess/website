#!/usr/bin/env python3
"""
WebSocket Client Test Script for ChessLink Server

Tests connecting to the ChessLink WebSocket server, sending commands, and receiving updates.
"""

import asyncio
import websockets
import json
import sys
import signal
import time

# Server address
SERVER_URI = "ws://localhost:8765"

async def send_message(websocket, message_type, data=None):
    """Send a message to the server"""
    if data is None:
        data = {}
    message = {**data, **{"type": message_type}}
    await websocket.send(json.dumps(message))
    print(f">>> Sent: {message_type}")

async def print_received(websocket):
    """Print all messages received from the server"""
    try:
        response = await websocket.recv()
        data = json.loads(response)
        print(f"<<< Received: {json.dumps(data, indent=2)}")
        return data
    except websockets.exceptions.ConnectionClosedOK:
        print("Connection closed")
        return None
    except Exception as e:
        print(f"Error receiving message: {e}")
        return None

async def host_client():
    """Simulate a host client connection"""
    try:
        print("Host client connecting to server...")
        async with websockets.connect(SERVER_URI) as websocket:
            print("Host client connected!")

            # Step 1: Wait for connection acknowledgment
            await print_received(websocket)
            
            # Step 2: List available serial ports
            print("\nGetting available serial ports...")
            await send_message(websocket, "get_ports")
            await asyncio.sleep(1)
            
            # Step 3: Connect to hardware (simulated)
            # In a real test, you'd provide an actual port
            print("\nConnecting to hardware...")
            await send_message(websocket, "connect_hardware", {
                "port": "COM1"  # This will fail but it's fine for testing
            })
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 4: Start a game
            print("\nStarting a new game...")
            await send_message(websocket, "start_game", {
                "id": "test-game-123",
                "title": "Test Game",
                "white": "Player 1",
                "black": "Player 2"
            })
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 5: Get list of live games
            print("\nGetting list of live games...")
            await send_message(websocket, "get_live_games")
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 6: Simulate receiving position updates for 10 seconds
            print("\nWaiting for position updates (10 seconds)...")
            timeout = time.time() + 10
            while time.time() < timeout:
                try:
                    data = await asyncio.wait_for(print_received(websocket), timeout=1.0)
                    if data and data.get("type") == "position":
                        print(f"Position update received: {data.get('fen')}")
                except asyncio.TimeoutError:
                    # Just a timeout, continue waiting
                    pass
            
            # Step 7: End the game
            print("\nEnding the game...")
            await send_message(websocket, "end_game", {
                "gameId": "test-game-123"
            })
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 8: Disconnect hardware
            print("\nDisconnecting hardware...")
            await send_message(websocket, "disconnect_hardware")
            await asyncio.sleep(1)
            await print_received(websocket)
            
            print("\nHost test completed!")
    
    except Exception as e:
        print(f"Host client error: {e}")

async def spectator_client(game_id="test-game-123"):
    """Simulate a spectator client connection"""
    try:
        print("Spectator client connecting to server...")
        async with websockets.connect(SERVER_URI) as websocket:
            print("Spectator client connected!")

            # Step 1: Wait for connection acknowledgment
            await print_received(websocket)
            
            # Step 2: Get list of live games
            print("\nGetting list of live games...")
            await send_message(websocket, "get_live_games")
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 3: Get state of specific game
            print(f"\nGetting state of game {game_id}...")
            await send_message(websocket, "get_game_state", {
                "gameId": game_id
            })
            await asyncio.sleep(1)
            await print_received(websocket)
            
            # Step 4: Listen for position updates for 30 seconds
            print("\nWaiting for position updates (30 seconds)...")
            timeout = time.time() + 30
            while time.time() < timeout:
                try:
                    data = await asyncio.wait_for(print_received(websocket), timeout=1.0)
                    if data and data.get("type") == "position":
                        print(f"Position update received: {data.get('fen')}")
                except asyncio.TimeoutError:
                    # Just a timeout, continue waiting
                    pass
            
            print("\nSpectator test completed!")
    
    except Exception as e:
        print(f"Spectator client error: {e}")

async def run_tests():
    """Run all tests"""
    # Run host and spectator clients concurrently
    await asyncio.gather(
        host_client(),
        spectator_client()
    )

def signal_handler(sig, frame):
    """Handle interrupt signal"""
    print("\nInterrupted, exiting...")
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    
    print("ChessLink WebSocket Client Test")
    print(f"Connecting to: {SERVER_URI}")
    print("Press Ctrl+C to exit")
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "host":
            asyncio.run(host_client())
        elif sys.argv[1] == "spectator":
            game_id = sys.argv[2] if len(sys.argv) > 2 else "test-game-123"
            asyncio.run(spectator_client(game_id))
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print("Usage: python testWebSocket.py [host|spectator [game_id]]")
    else:
        # Run all tests
        asyncio.run(run_tests()) 