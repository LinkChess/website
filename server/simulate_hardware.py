#!/usr/bin/env python3
"""
Chess Hardware Simulator

This script simulates the behavior of the ChessLink hardware by writing
partial FENs (just the board position) to the moves.txt file.
"""

import time
import os
import chess
import sys
import random

# File to write positions to
MOVES_FILE = "moves.txt"

# Sample game (Ruy Lopez opening)
SAMPLE_MOVES = [
    "e4", "e5", 
    "Nf3", "Nc6", 
    "Bb5", "a6", 
    "Ba4", "Nf6", 
    "O-O", "Be7", 
    "Re1", "b5", 
    "Bb3", "d6",
    "c3", "O-O"
]

# Long game for continuous simulation
LONG_GAME = [
    "e4", "e5", 
    "Nf3", "Nc6", 
    "Bb5", "a6", 
    "Ba4", "Nf6", 
    "O-O", "Be7", 
    "Re1", "b5", 
    "Bb3", "d6",
    "c3", "O-O",
    "h3", "Na5",
    "Bc2", "c5",
    "d4", "Qc7",
    "Nbd2", "cxd4",
    "cxd4", "Nc6",
    "Nb3", "a5",
    "Be3", "a4",
    "Nbd2", "Bd7",
    "Rc1", "Qb8"
]

def write_position(fen_position, append=True):
    """Write a position to the moves file."""
    mode = 'a' if append else 'w'
    try:
        with open(MOVES_FILE, mode, encoding='utf-8') as f:
            f.write(fen_position + "\n")
        print(f"Wrote position: {fen_position}")
        return True
    except IOError as e:
        print(f"Error writing to file: {e}")
        return False

def get_partial_fen(board):
    """Extract just the piece placement part of the FEN."""
    full_fen = board.fen()
    return full_fen.split(' ')[0]

def simulate_game(delay=2.0, reset_file=True):
    """Simulate a chess game by writing positions to the moves file."""
    # Create a new board with the starting position
    board = chess.Board()
    
    # Write initial position
    initial_position = get_partial_fen(board)
    write_position(initial_position, append=not reset_file)  # Start with a clean file if reset_file is True
    time.sleep(delay)
    
    # Play through the sample moves
    for i, move_san in enumerate(SAMPLE_MOVES):
        try:
            # Apply the move
            move = board.parse_san(move_san)
            board.push(move)
            
            # Get the updated position and write it to the file
            position = get_partial_fen(board)
            write_position(position, append=True)
            
            # Display info
            side = "White" if i % 2 == 0 else "Black"
            print(f"Move {i+1}: {side} played {move_san}")
            
            # Wait before the next move
            time.sleep(delay)
            
        except ValueError as e:
            print(f"Error playing move {move_san}: {e}")
            break
    
    print("Simulation complete.")

def simulate_continuous(delay=2.0, reset_file=True, forever=False):
    """Continuously monitor the board and write positions when pieces move."""
    print("Starting continuous simulation. Press Ctrl+C to stop.")
    print("This mode simulates a real hardware setup where positions are")
    print("captured whenever the board state changes.")
    
    board = chess.Board()
    initial_position = get_partial_fen(board)
    write_position(initial_position, append=not reset_file)
    
    moves_played = 0
    moves_list = LONG_GAME if forever else SAMPLE_MOVES
    
    while True:
        try:
            # If we've reached the end of our moves list and forever is True, reset
            if moves_played >= len(moves_list):
                if not forever:
                    break
                
                print("\n--- Resetting board for continuous simulation ---")
                board = chess.Board()
                position = get_partial_fen(board)
                write_position(position, append=True)
                
                # Add some randomization to make it more interesting
                moves_played = 0
                time.sleep(delay * 2)  # Longer pause between games
                continue
            
            # Apply the next move
            move_san = moves_list[moves_played]
            move = board.parse_san(move_san)
            board.push(move)
            
            # Get position and write it
            position = get_partial_fen(board)
            write_position(position, append=True)
            
            # Display info
            side = "White" if moves_played % 2 == 0 else "Black"
            print(f"Move {moves_played+1}: {side} played {move_san}")
            
            moves_played += 1
            
            # Add some randomness to the delay to simulate natural pauses
            actual_delay = delay * (0.8 + 0.4 * random.random())
            time.sleep(actual_delay)
            
        except ValueError as e:
            print(f"Error playing move {moves_list[moves_played]}: {e}")
            break
        except KeyboardInterrupt:
            print("\nSimulation stopped by user.")
            break
    
    print("Continuous simulation complete.")

def reset_file():
    """Reset the moves file to empty."""
    try:
        with open(MOVES_FILE, 'w', encoding='utf-8') as f:
            pass
        print(f"Reset {MOVES_FILE} to empty")
        return True
    except IOError as e:
        print(f"Error resetting file: {e}")
        return False

def main():
    """Main function to run the simulation."""
    print("ChessLink Hardware Simulator")
    print(f"Writing positions to: {MOVES_FILE}")
    
    # Determine simulation mode
    mode = "game"
    delay = 2.0  # default delay between moves
    reset_file_flag = True
    forever = False
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "continuous":
            mode = "continuous"
        elif sys.argv[1] == "forever":
            mode = "continuous"
            forever = True
        elif sys.argv[1] == "reset":
            reset_file()
            return
        elif sys.argv[1] == "append":
            reset_file_flag = False
            if len(sys.argv) > 2 and sys.argv[2] == "continuous":
                mode = "continuous"
        elif sys.argv[1].isdigit() or (sys.argv[1].replace('.', '', 1).isdigit() and sys.argv[1].count('.') <= 1):
            delay = float(sys.argv[1])
    
    if len(sys.argv) > 2:
        if sys.argv[2] == "continuous":
            mode = "continuous"
        elif sys.argv[2] == "forever":
            mode = "continuous"
            forever = True
        elif sys.argv[2] == "append":
            reset_file_flag = False
        elif sys.argv[2].isdigit() or (sys.argv[2].replace('.', '', 1).isdigit() and sys.argv[2].count('.') <= 1):
            delay = float(sys.argv[2])
    
    # Check if the moves file exists and warn the user if we're resetting
    if os.path.exists(MOVES_FILE) and reset_file_flag:
        print(f"Warning: {MOVES_FILE} already exists. It will be overwritten.")
    
    print(f"Simulation mode: {mode}")
    print(f"Delay between moves: {delay} seconds")
    print(f"Reset file: {reset_file_flag}")
    print(f"Run forever: {forever}")
    
    # Run the appropriate simulation
    if mode == "continuous":
        simulate_continuous(delay, reset_file_flag, forever)
    else:
        simulate_game(delay, reset_file_flag)

if __name__ == "__main__":
    try:
        # Initialize random seed
        random.seed()
        
        main()
    except KeyboardInterrupt:
        print("\nSimulation stopped by user.")
    print("Done!") 