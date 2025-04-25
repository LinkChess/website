#!/usr/bin/env python3
"""
Chess Position File Reader

Reads chess positions from a moves.txt file and completes partial FENs to full FENs
by making educated guesses about missing components.
"""

import os
import time
import chess
from threading import Lock

class ChessFileReader:
    """Reads chess positions from a file and completes partial FENs."""
    
    def __init__(self, file_path="moves.txt"):
        self.file_path = file_path
        self.is_open = False
        self.lock = Lock()
        self.last_position = None
        self.last_processed_line = 0
        self.last_file_size = 0
        self.board = chess.Board()  # Keep track of board state
        
        # For tracking missing FEN components
        self.active_color = "w"
        self.castling_rights = "KQkq"
        self.en_passant_target = "-"
        self.halfmove_clock = 0
        self.fullmove_number = 1
        
    def open(self):
        """Initialize and open the connection to the file."""
        self.is_open = True
        # Create an empty file if it doesn't exist
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'w', encoding='utf-8') as f:
                f.write("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR\n")
        return True
        
    def close(self):
        """Close the connection."""
        self.is_open = False
        return True
    
    def reset_input_buffer(self):
        """Simulated buffer reset."""
        pass
    
    @property
    def in_waiting(self):
        """Check if there are new lines to read."""
        if not self.is_open or not os.path.exists(self.file_path):
            return 0
            
        try:
            current_size = os.path.getsize(self.file_path)
            
            # File was recreated or overwritten (size decreased)
            if current_size < self.last_file_size:
                print(f"File was overwritten (size decreased from {self.last_file_size} to {current_size})")
                self.last_file_size = current_size
                self.last_processed_line = 0  # Reset the line counter to process from beginning
                return 1
                
            # File has new content
            if current_size > self.last_file_size:
                self.last_file_size = current_size
                return 1  # Indicate there's something to read
                
            return 0
        except Exception as e:
            print(f"Error checking file size: {e}")
            return 0
    
    def readline(self):
        """Read the latest position from the file."""
        if not self.is_open or not os.path.exists(self.file_path):
            return b""
            
        with self.lock:
            try:
                # Use a safe reading approach to avoid conflicts with file being written
                lines = []
                try:
                    with open(self.file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                except Exception as e:
                    print(f"Error reading file: {e}")
                    return b""
                
                if not lines:
                    return b""
                
                # If the file has been recreated, reset line counter
                if self.last_processed_line >= len(lines):
                    print(f"WARNING: Line counter ({self.last_processed_line}) exceeds file length ({len(lines)}). Resetting to 0.")
                    self.last_processed_line = 0
                
                # Get the latest line
                if len(lines) > self.last_processed_line:
                    latest_line = lines[self.last_processed_line].strip()
                    print(f"Processing line {self.last_processed_line}: {latest_line}")
                    self.last_processed_line += 1  # Move to next line for next read
                    
                    # Complete the partial FEN
                    full_fen = self._complete_fen(latest_line)
                    return full_fen.encode('utf-8')
                return b""
            except Exception as e:
                print(f"Error in readline: {e}")
                return b""
    
    def _complete_fen(self, partial_fen):
        """
        Complete a partial FEN (just the board position) into a full FEN string.
        Make educated guesses about the missing components based on the current state.
        
        Returns a full FEN string.
        """
        # Validate the partial FEN (should be just the board position)
        partial_fen = partial_fen.strip()
        
        # Skip if it's the same as the last position
        if partial_fen == self.last_position:
            # Return the current full FEN
            return f"{partial_fen} {self.active_color} {self.castling_rights} {self.en_passant_target} {self.halfmove_clock} {self.fullmove_number}"
        
        # Remember the last position for comparison
        last_position = self.last_position
        self.last_position = partial_fen
        
        # If this is the first position, assume standard starting values
        if not last_position:
            # Return standard initial values for a new game
            return f"{partial_fen} w KQkq - 0 1"
        
        # Analyze the change to determine which side moved
        prev_board = chess.Board(f"{last_position} {self.active_color} {self.castling_rights} {self.en_passant_target} {self.halfmove_clock} {self.fullmove_number}")
        new_position = f"{partial_fen} {self.active_color} {self.castling_rights} {self.en_passant_target} {self.halfmove_clock} {self.fullmove_number}"
        
        try:
            # Toggle active color based on whose turn it was in the previous position
            self.active_color = "b" if self.active_color == "w" else "w"
            
            # Update fullmove number if black just moved
            if self.active_color == "w":  # If active color is now white, black just moved
                self.fullmove_number += 1

            # Analyze castling rights
            new_board = chess.Board(new_position)
            
            # Check for king moves to update castling rights
            # White king should be at e1 (chess.E1) for castling rights
            if 'K' in self.castling_rights or 'Q' in self.castling_rights:
                white_king_square = chess.E1
                if new_board.piece_at(white_king_square) != chess.Piece.from_symbol('K'):
                    # King has moved, remove white castling rights
                    self.castling_rights = self.castling_rights.replace('K', '').replace('Q', '')
            
            # Black king should be at e8 (chess.E8) for castling rights
            if 'k' in self.castling_rights or 'q' in self.castling_rights:
                black_king_square = chess.E8
                if new_board.piece_at(black_king_square) != chess.Piece.from_symbol('k'):
                    # King has moved, remove black castling rights
                    self.castling_rights = self.castling_rights.replace('k', '').replace('q', '')
                
            # Check for rook moves
            if 'Q' in self.castling_rights and not new_board.piece_at(chess.A1) == chess.Piece.from_symbol('R'):
                self.castling_rights = self.castling_rights.replace('Q', '')
            if 'K' in self.castling_rights and not new_board.piece_at(chess.H1) == chess.Piece.from_symbol('R'):
                self.castling_rights = self.castling_rights.replace('K', '')
            if 'q' in self.castling_rights and not new_board.piece_at(chess.A8) == chess.Piece.from_symbol('r'):
                self.castling_rights = self.castling_rights.replace('q', '')
            if 'k' in self.castling_rights and not new_board.piece_at(chess.H8) == chess.Piece.from_symbol('r'):
                self.castling_rights = self.castling_rights.replace('k', '')
                
            if self.castling_rights == "":
                self.castling_rights = "-"
                
            # Detect pawn double moves for en passant
            self.en_passant_target = "-"  # Reset by default
            
            # Preliminary guess at move - look for missing pieces
            for i in range(64):
                square = chess.Square(i)
                piece_before = prev_board.piece_at(square)
                piece_after = new_board.piece_at(square)
                
                # Check if a pawn disappeared from its starting row
                if (piece_before == chess.Piece.from_symbol('P') and 
                    (chess.square_rank(square) == 1) and 
                    piece_after is None):
                    # Look two squares ahead for the pawn
                    two_ahead = chess.square(chess.square_file(square), 3)
                    if new_board.piece_at(two_ahead) == chess.Piece.from_symbol('P'):
                        # Set en passant target to the square in between
                        self.en_passant_target = chess.square_name(
                            chess.square(chess.square_file(square), 2)
                        )
                        break
                        
                if (piece_before == chess.Piece.from_symbol('p') and 
                    (chess.square_rank(square) == 6) and 
                    piece_after is None):
                    # Look two squares ahead for the pawn
                    two_ahead = chess.square(chess.square_file(square), 4)
                    if new_board.piece_at(two_ahead) == chess.Piece.from_symbol('p'):
                        # Set en passant target to the square in between
                        self.en_passant_target = chess.square_name(
                            chess.square(chess.square_file(square), 5)
                        )
                        break
                        
            # Update halfmove clock - reset on pawn moves or captures
            # For simplicity, increment for now and let server logic handle details
            self.halfmove_clock += 1
            
            # Construct the full FEN
            full_fen = f"{partial_fen} {self.active_color} {self.castling_rights} {self.en_passant_target} {self.halfmove_clock} {self.fullmove_number}"
            return full_fen
            
        except Exception as e:
            print(f"Error completing FEN: {e}")
            # Return a safe default if we encounter errors
            return f"{partial_fen} {self.active_color} {self.castling_rights} - {self.halfmove_clock} {self.fullmove_number}"

# Helper function to create a reader instance
def create_reader(file_path="moves.txt"):
    """Create and return a ChessFileReader instance."""
    reader = ChessFileReader(file_path)
    reader.open()
    return reader 