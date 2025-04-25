#!/usr/bin/env python3
"""
WebSocket Client Test Script for ChessLink Server (using python-socketio)

Tests connecting to the ChessLink WebSocket server, sending commands, and receiving updates.
"""

import asyncio
import socketio
import json
import sys
import signal
import time

# Import ChessGame class to interact with DB
from chessClass import ChessGame 
import chess

# Server address (python-socketio uses http/https)
SERVER_URI = "http://localhost:8765"

# Use asyncio events for flow control
host_connected_event = asyncio.Event()
host_received_event = asyncio.Event()
host_last_data = None

spectator_connected_event = asyncio.Event()
spectator_received_event = asyncio.Event()
spectator_last_data = None


# --- Host Client Setup ---
sio_host = socketio.AsyncClient(logger=False, engineio_logger=False)

@sio_host.event
async def connect():
    print("Host client: Connection established")
    host_connected_event.set()

@sio_host.event
async def connect_error(data):
    print(f"Host client: Connection failed: {data}")
    # Signal failure if needed, e.g., raise exception or set a failure event

@sio_host.event
async def disconnect():
    print("Host client: Disconnected from server")

@sio_host.on('*') # Catch all events
async def host_catch_all(event, data):
    global host_last_data
    print(f"<<< Host received event '{event}': {json.dumps(data, indent=2)}")
    host_last_data = {'event': event, 'data': data}
    host_received_event.set() # Signal that an event was received

async def host_wait_for_event(timeout=5):
    """Wait for the next event from the server for the host client."""
    host_received_event.clear() # Reset the event flag
    try:
        await asyncio.wait_for(host_received_event.wait(), timeout=timeout)
        return host_last_data
    except asyncio.TimeoutError:
        print("Host client: Timed out waiting for event.")
        return None

# --- Spectator Client Setup ---
sio_spectator = socketio.AsyncClient(logger=False, engineio_logger=False)

@sio_spectator.event
async def connect():
    print("Spectator client: Connection established")
    spectator_connected_event.set()

@sio_spectator.event
async def connect_error(data):
    print(f"Spectator client: Connection failed: {data}")

@sio_spectator.event
async def disconnect():
    print("Spectator client: Disconnected from server")

@sio_spectator.on('*') # Catch all events
async def spectator_catch_all(event, data):
    global spectator_last_data
    print(f"<<< Spectator received event '{event}': {json.dumps(data, indent=2)}")
    spectator_last_data = {'event': event, 'data': data}
    spectator_received_event.set() # Signal that an event was received

async def spectator_wait_for_event(timeout=5):
    """Wait for the next event from the server for the spectator client."""
    spectator_received_event.clear() # Reset the event flag
    try:
        await asyncio.wait_for(spectator_received_event.wait(), timeout=timeout)
        return spectator_last_data
    except asyncio.TimeoutError:
        print("Spectator client: Timed out waiting for event.")
        return None


# --- Test Logic ---

async def host_client_logic():
    """Simulate a host client connection using python-socketio"""
    sio = sio_host # Use the host client instance
    game_id_to_simulate = "long-sim-game-001" # New game ID
    
    # Define a longer game sequence (Ruy Lopez, Morphy Defense Deferred)
    game_moves_san = [
        "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", # 10 moves
        "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Na5", "Bc2", "c5",  # 20 moves
        "d4", "Qc7", "Nbd2", "cxd4", "cxd4", "Nc6", "Nb3", "a5", "Be3", "a4", # 30 moves
        "Nbd2", "Bd7", "Rc1", "Qb8", "Bb1", "Rc8", "Rxc8+", "Qxc8", "Qd3", "Qa8", # 40 moves
        "Bd1", "h6", "Bb3", "Rc8", "Rc1", "Rxc1+", "Bxc1", "Qa6", "Qxa6", "Bxa6", # 50 moves
        "Ne1", "Bd8", "Nd3", "Bb7", "f3", "Nd7", "Kf2", "f6", "Ke3", "Kf7", # 60 moves
        "g4", "Ke8", "Kd2", "Kd7", "Kc3", "Kc7", "Kb4", "Kb6", "a3", "g5", # 70 moves
        "Bc2", "Bc8", "Bb3", "Bb7", "Nc5", "Bc8", "Nxd7+", "Bxd7", "d5", "e4", # 80 moves
        "fxe4", "Nxe4", "Bxe4", "f5", "gxf5", "Bxf5", "Bxf5", "g4", "Be4", "h5", # 90 moves
        "Bd3", "h4", "Be2", "Bc7", "Bf1", "Bd8", "Bd3", "Bc7", "Kc4", "Kc6", # 100 moves
        "b3", "axb3", "Kxb3", "Kd7", "Kc4", "Ke7", "Kd4", "Kf7", "Ke5", "Kg6", # 110 moves
        "Be2", "Kh5", "Bf1", "Kg5", "Bd3", "Bd8", "a4", "Bc7+", "Ke6", "Bd8", # 120 moves
        "d6", "Kf4", "d7", "g3", "hxg3+", "Kxg3", "Kf5", "h3", "Kg5", "h2", # 130 moves
        "Bf1", "Kg2", "Bxh3+", "Kxh3", "Kf6", "Kg4", "Ke7", "Kf5", "Kxd8", "Ke6", # 140 moves
        "Kc7", "Kd5", "Kb6", "Kc4", "Ka5", "Kc5", "Ka6", "Kc6", "Ka5", "Kc5", # 150 moves
        "Ka6", "Kc6"  # Draw by threefold repetition
    ]
    
    try:
        print("\n--- Starting Host Client Test (LONG move simulation) --- ")
        await sio.connect(SERVER_URI, wait=False) # Corrected waits -> wait
        
        # Wait for connection confirmation
        await asyncio.wait_for(host_connected_event.wait(), timeout=5)
        await host_wait_for_event() # Wait for initial hardware_status event

        # Step 2: Connect to hardware (simulated - use MOCK for testing)
        print("\nHost: Connecting to hardware (MOCK)...")
        await sio.emit("connect_hardware", {"port": "MOCK"})
        await host_wait_for_event() # Wait for hardware_connected/status

        # Step 4: Start a game
        print(f"\nHost: Starting a new game ({game_id_to_simulate})...")
        await sio.emit("start_game", {
            "id": game_id_to_simulate,
            "title": "Ruy Lopez Simulation",
            "white": "SimulatorHost",
            "black": "SimulatorOpponent"
        })
        await host_wait_for_event() # Wait for game_started/new_game

        # Step 6: Simulate sending FEN updates for the moves
        print("\nHost: Simulating game moves...")
        board = chess.Board() # Start with initial position
        print(f"  Move 0 (Initial): {board.fen()}")
        
        for i, move_san in enumerate(game_moves_san):
            try:
                board.push_san(move_san)
                current_fen = board.fen()
                print(f"  Move {i+1} ({move_san}): {current_fen}")
                # Emit the FEN to the server as if it came from hardware
                await sio.emit("simulate_hardware_input", {"gameId": game_id_to_simulate, "fen": current_fen})
                await asyncio.sleep(2.0) # Pause between moves (increased to 2s)
            except ValueError as e:
                print(f"Error playing move '{move_san}': {e}")
                break # Stop simulation on error

        print("\nHost: Move simulation finished.")
        await asyncio.sleep(2) # Pause before ending

        # Step 7: End the game
        print("\nHost: Ending the game...")
        await sio.emit("end_game", {"gameId": game_id_to_simulate})
        await host_wait_for_event() # Wait for game_ended

        # Step 8: Disconnect hardware
        print("\nHost: Disconnecting hardware (MOCK)...")
        await sio.emit("disconnect_hardware")
        await host_wait_for_event() # Wait for hardware_disconnected/status

        print("\n--- Host test completed! --- ")

    except asyncio.TimeoutError:
        print("Host client: Timeout during connection or waiting for event.")
    except socketio.exceptions.ConnectionError as e:
         print(f"Host client connection error: {e}")
    except Exception as e:
        print(f"Host client error: {e}")
    finally:
        if sio.connected:
            await sio.disconnect()


async def spectator_client_logic(game_id="test-game-123"):
    """Simulate a spectator client connection using python-socketio"""
    try:
        print("\n--- Starting Spectator Client Test --- ")
        await sio_spectator.connect(SERVER_URI, wait=False) # Corrected waits -> wait
        
        # Wait for connection confirmation
        await asyncio.wait_for(spectator_connected_event.wait(), timeout=5)
        await spectator_wait_for_event() # Wait for initial hardware_status

        # Step 2: Get list of live games (optional, server might push)
        # print("\nSpectator: Getting list of live games...")
        # await sio_spectator.emit("get_live_games")
        # await spectator_wait_for_event() # Wait for live_games_list

        # Step 3: Get state of specific game
        print(f"\nSpectator: Getting state of game {game_id}...")
        await sio_spectator.emit("get_game_state", {"gameId": game_id})
        await spectator_wait_for_event() # Wait for game_state

        # Step 4: Listen for updates (just sleep, rely on catch_all)
        print("\nSpectator: Waiting for potential updates (10 seconds)...")
        await asyncio.sleep(10)

        print("\n--- Spectator test completed! --- ")

    except asyncio.TimeoutError:
        print("Spectator client: Timeout during connection or waiting for event.")
    except socketio.exceptions.ConnectionError as e:
         print(f"Spectator client connection error: {e}")
    except Exception as e:
        print(f"Spectator client error: {e}")
    finally:
        if sio_spectator.connected:
            await sio_spectator.disconnect()

async def run_all_tests():
    """Run host and spectator tests concurrently"""
    # Start server first if not already running
    # For this test, assume server is running independently
    
    # Run clients concurrently
    await asyncio.gather(
        host_client_logic(),
        spectator_client_logic()
    )

def signal_handler(sig, frame):
    """Handle interrupt signal"""
    print("\nInterrupted, exiting...")
    # Optionally try to disconnect clients gracefully
    # loop = asyncio.get_event_loop()
    # loop.create_task(sio_host.disconnect())
    # loop.create_task(sio_spectator.disconnect())
    sys.exit(0)

async def list_db_games():
    """List games available in the database."""
    print("\n--- Listing Games in DB --- ")
    try:
        games = ChessGame.list_games()
        if not games:
            print("No games found in the database.")
        else:
            print("Available games:")
            for game_id, white, black, date, result in games:
                print(f"  ID: {game_id}, White: {white}, Black: {black}, Date: {date}, Result: {result}")
    except Exception as e:
        print(f"Error listing games from DB: {e}")
    print("---------------------------")

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    
    print("ChessLink WebSocket Client Test (using python-socketio)")
    print(f"Attempting to connect to server at: {SERVER_URI}")
    print("Press Ctrl+C to exit")

    # List games from DB first
    asyncio.run(list_db_games())

    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "host":
            asyncio.run(host_client_logic())
        elif sys.argv[1] == "spectator":
            game_id_arg = sys.argv[2] if len(sys.argv) > 2 else "test-game-123"
            asyncio.run(spectator_client_logic(game_id_arg))
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print("Usage: python testWebSocket.py [host|spectator [game_id]]")
    else:
        # Run all tests
        asyncio.run(run_all_tests()) 