#!/usr/bin/env python
"""
Interactive ChessLink hardware simulator

This script:
1. Connects to the ChessLink server
2. Simulates a hardware connection
3. Allows you to send custom chess positions
4. Displays position updates in real-time

Usage:
1. Start app.py in one terminal
2. Run this script in another terminal
3. Follow the interactive prompts
"""

import socketio
import time
import logging
import chess
import sys
import threading
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ChessLink-Interactive")

# Configuration
SERVER_URL = 'http://localhost:8765'
HARDWARE_PORT = 'MOCK'  # Special port name for mock connections

# Create SocketIO client
sio = socketio.Client()
hardware_connected = False
game_started = False # This script's game status, not the server's active game
current_game_id = None # ID of game started BY THIS SCRIPT
target_game_id = None  # << NEW: ID of the game to send moves TO

# Store received positions for display
received_positions = []

# SocketIO event handlers
@sio.event
def connect():
    logger.info("Connected to ChessLink server!")

@sio.event
def disconnect():
    logger.info("Disconnected from ChessLink server!")

@sio.on('hardware_status')
def on_hardware_status(data):
    logger.info("Hardware status: %s", data)

@sio.on('hardware_connected')
def on_hardware_connected(data):
    global hardware_connected
    logger.info("Hardware connected: %s", data)
    hardware_connected = True

@sio.on('error')
def on_error(data):
    logger.error("Error: %s", data)

@sio.on('game_started')
def on_game_started(data):
    global game_started, current_game_id
    logger.info("Game started: %s", data)
    game_started = True
    current_game_id = data.get('gameId')

@sio.on('position')
def on_position(data):
    logger.info("Position update: %s", data)
    received_positions.append(data)
    # Display the move
    if 'algebraic' in data and data['algebraic']:
        player = data.get('player', '?')
        move = data.get('algebraic', '?')
        logger.info("Move played: %s %s", player, move)

@sio.on('live_games_list')
def on_live_games(data):
    logger.info("Live games: %s", data)

@sio.on('game_state')
def on_game_state(data):
    logger.info("Game state: %s", data)

def wait_for_connection_and_game():
    """Wait for hardware connection and game to start"""
    global hardware_connected, game_started
    
    retry_count = 0
    while not (hardware_connected and game_started) and retry_count < 10:
        time.sleep(1)
        retry_count += 1
        logger.info("Waiting for hardware connection and game start... (%s/10)", retry_count)
    
    if not (hardware_connected and game_started):
        logger.error("Timeout waiting for hardware connection or game start")
        return False
    
    return True

def send_position(fen):
    """Send a position to the server FOR THE TARGET GAME"""
    global target_game_id # << Use target ID
    if not target_game_id:
        logger.error("No target game ID set. Use 'target [game_id]' command first.")
        return False
    try:
        # Try to validate the FEN
        chess.Board(fen)
        logger.info("Sending position for game %s: %s", target_game_id, fen)
        sio.emit('simulate_hardware_input', {
            'fen': fen,
            'gameId': target_game_id # << Send target ID
        })
        return True
    except ValueError as e:
        logger.error("Invalid FEN string: %s", e)
        return False

def show_commands():
    """Display available commands"""
    print("\nAvailable commands:")
    print("  connect         - Connect to server and hardware")
    print("  start           - Start a new game (hosted by this script)")
    print("  target [gameId] - Set the target game ID for sending moves") # << NEW
    print("  fen [FEN]       - Send a custom FEN position to the target game")
    print("  move [SAN]      - Make a move in algebraic notation for the target game")
    print("  status          - Show connection status and target game ID")
    print("  end             - End the game started BY THIS SCRIPT")
    print("  disconnect      - Disconnect hardware")
    print("  exit            - Exit the program")
    print("  help            - Show this help message")

def interactive_loop():
    """Main interactive loop"""
    global hardware_connected, game_started, current_game_id, target_game_id # << Add target_game_id
    
    # Current board state (local to this script for move generation)
    board = chess.Board()
    
    print("ChessLink Interactive Simulator")
    print("Type 'help' for a list of commands")
    
    while True:
        try:
            command = input("\n> ").strip()
            
            if command == "":
                continue
                
            parts = command.split(maxsplit=1)
            cmd = parts[0].lower()
            
            if cmd == "help":
                show_commands()
                
            elif cmd == "exit":
                if hardware_connected:
                    sio.emit('disconnect_hardware')
                if sio.connected:
                    sio.disconnect()
                print("Exiting...")
                break
                
            elif cmd == "connect":
                if not sio.connected:
                    logger.info("Connecting to server at %s...", SERVER_URL)
                    sio.connect(SERVER_URL)
                
                if not hardware_connected:
                    logger.info("Connecting to mock hardware...")
                    sio.emit('connect_hardware', {'port': HARDWARE_PORT})
                else:
                    print("Already connected to hardware")
                    
            elif cmd == "start":
                if not hardware_connected:
                    print("Connect to hardware first")
                    continue
                
                if game_started:
                    print("Game already started")
                    continue
                
                logger.info("Starting a new game (hosted by this script)...")
                game_id_for_script = f'interactive-{datetime.now().strftime("%Y%m%d%H%M%S")}'
                sio.emit('start_game', {
                    'id': game_id_for_script,
                    'title': 'Interactive Script Game',
                    'white': 'Script White',
                    'black': 'Script Black'
                })
                # Note: current_game_id is set by the on_game_started handler
                # Reset board
                board = chess.Board()
                
            elif cmd == "target": # << NEW COMMAND
                if len(parts) < 2:
                    print("Please provide a game ID")
                    continue
                target_game_id = parts[1]
                print(f"Target game ID set to: {target_game_id}")

            elif cmd == "fen":
                if len(parts) < 2:
                    print("Please provide a FEN string")
                    continue
                
                # Check connection and TARGET ID
                if not hardware_connected:
                    print("Connect to hardware first (use 'connect' command)")
                    continue
                if not target_game_id:
                    print("Set target game ID first (use 'target [game_id]')")
                    continue
                
                fen = parts[1]
                send_position(fen) # Sends to target_game_id
                # We don't update the local board when sending raw FEN
                
            elif cmd == "move":
                if len(parts) < 2:
                    print("Please provide a move in algebraic notation (e.g., 'e4' or 'Nf3')")
                    continue
                
                # Check connection and TARGET ID
                if not hardware_connected:
                    print("Connect to hardware first (use 'connect' command)")
                    continue
                if not target_game_id:
                    print("Set target game ID first (use 'target [game_id]')")
                    continue
                
                move_san = parts[1]
                try:
                    # Try to parse the move based on local board state
                    move = board.parse_san(move_san)
                    
                    # Make the move on our local board to keep track
                    board.push(move)
                    
                    # Send the updated position FEN to the target game
                    send_position(board.fen())
                    
                except ValueError as e:
                    print(f"Invalid move: {e}")
                
            elif cmd == "status":
                print(f"Server connected: {sio.connected}")
                print(f"Hardware connected: {hardware_connected}")
                print(f"Game started (by script): {game_started} (ID: {current_game_id or 'N/A'})")
                print(f"Target game ID for moves: {target_game_id or 'Not Set'}") # << Show target ID
                print(f"Received positions: {len(received_positions)}")
                if board is not None:
                    print("\nLocal script board state:")
                    print(board)
                
            elif cmd == "end": # Ends the game started BY THIS SCRIPT
                if not game_started or not current_game_id:
                    print("No active game started by this script")
                    continue
                
                logger.info(f"Ending script's game {current_game_id}...")
                sio.emit('end_game', {'gameId': current_game_id})
                game_started = False
                current_game_id = None
                
            elif cmd == "disconnect":
                if not hardware_connected:
                    print("Not connected to hardware")
                    continue
                
                logger.info("Disconnecting hardware...")
                sio.emit('disconnect_hardware')
                hardware_connected = False
                
            else:
                print(f"Unknown command: {cmd}")
                print("Type 'help' for a list of commands")
                
        except Exception as e:
            print(f"Error: {e}")

def main():
    try:
        interactive_loop()
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        logger.error("Error: %s", e)
    finally:
        if sio.connected:
            sio.disconnect()

if __name__ == "__main__":
    main() 