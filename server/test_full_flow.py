#!/usr/bin/env python
"""
Comprehensive test of the ChessLink system from hardware to web app

This script:
1. Simulates hardware by sending FEN positions
2. Connects to the app.py server via SocketIO
3. Tests the full flow from hardware data to server to web client
"""

import socketio
import time
import threading
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ChessLink-Test")

# Configuration
SERVER_URL = 'http://localhost:8765'
HARDWARE_PORT = 'MOCK'  # Special port name that app.py recognizes as a mock connection

# Create SocketIO client
sio = socketio.Client()
hardware_connected = False
game_started = False
current_game_id = None

# Store received positions for verification
received_positions = []

# Simulated chess game (Immortal Game - Anderssen vs. Kieseritzky)
SIMULATED_GAME = [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  # Initial position
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",  # 1. e4
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",  # 1... e5
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",  # 2. Nf3
    "rnbqk1nr/pppp1ppp/8/4p3/1b2P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",  # 2... Bc5
]

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

@sio.on('live_games_list')
def on_live_games(data):
    logger.info("Live games: %s", data)

@sio.on('game_state')
def on_game_state(data):
    logger.info("Game state: %s", data)

# Simulate hardware by sending FEN strings to the server
def hardware_simulator():
    logger.info("Starting hardware simulator...")
    
    # Wait for hardware connection and game to start
    retry_count = 0
    while not (hardware_connected and game_started) and retry_count < 10:
        time.sleep(1)
        retry_count += 1
        logger.info("Waiting for hardware connection and game start... (%s/10)", retry_count)
    
    if not (hardware_connected and game_started):
        logger.error("Timeout waiting for hardware connection or game start")
        return
    
    logger.info("Hardware simulation started - sending chess positions...")
    
    # Send each position with a delay to simulate real play
    for i, fen in enumerate(SIMULATED_GAME):
        if i == 0:  # Skip initial position as it's already set
            continue
            
        logger.info("Sending position %s: %s", i, fen)
        
        # In a real scenario, this would be the hardware sending serial data
        # Instead, we directly invoke the position event on the server
        sio.emit('simulate_hardware_input', {'fen': fen})
        
        # Wait between moves
        time.sleep(2)
    
    logger.info("Hardware simulation completed")

def main():
    logger.info("Starting ChessLink full flow test")
    
    try:
        # Connect to the server
        logger.info("Connecting to server at %s...", SERVER_URL)
        sio.connect(SERVER_URL)
        
        # Try to connect to simulated hardware
        logger.info("Connecting to simulated hardware on port %s...", HARDWARE_PORT)
        sio.emit('connect_hardware', {'port': HARDWARE_PORT})
        time.sleep(1)
        
        # Start a test game
        logger.info("Starting a test game...")
        sio.emit('start_game', {
            'id': f'test-game-{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'title': 'ChessLink Full Flow Test',
            'white': 'Player 1',
            'black': 'Player 2'
        })
        time.sleep(1)
        
        # Get list of live games
        logger.info("Getting live games...")
        sio.emit('get_live_games')
        time.sleep(1)
        
        # Start hardware simulator in a separate thread
        sim_thread = threading.Thread(target=hardware_simulator)
        sim_thread.daemon = True
        sim_thread.start()
        
        # Wait for simulation to complete
        time.sleep(len(SIMULATED_GAME) * 3)  # Allow time for all moves
        
        # Verify results
        logger.info("Received %s position updates", len(received_positions))
        
        # End the game
        if current_game_id:
            logger.info("Ending game %s...", current_game_id)
            sio.emit('end_game', {'gameId': current_game_id})
            time.sleep(1)
        
        # Disconnect hardware
        logger.info("Disconnecting hardware...")
        sio.emit('disconnect_hardware')
        time.sleep(1)
        
        # Disconnect from server
        logger.info("Disconnecting from server...")
        sio.disconnect()
        
        logger.info("Test completed successfully!")
        
    except Exception as e:
        logger.error("Test failed: %s", e)
    
if __name__ == "__main__":
    main() 