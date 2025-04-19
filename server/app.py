from flask import Flask, jsonify, request
from flask_cors import CORS
import serial
import serial.tools.list_ports
import re
import threading
import time
import uuid
import json
from chessClass import ChessGame

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global state for serial port connection
serial_connection = None
serial_thread = None
active_game = None
stop_thread = False

# FEN regex pattern (basic validation)
FEN_PATTERN = re.compile(r"^[1-8pnbrqkPNBRQK/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$")

def read_serial_data():
    global serial_connection, active_game, stop_thread
    
    last_malformed_line_logged = None  # Keep track of the last logged malformed line (as string)
    
    while not stop_thread and serial_connection and serial_connection.is_open:
        raw_lines_read = [] # Store raw bytes read
        data_to_process = [] # Store valid FEN strings
        read_limit_hit = False
        
        try:
            # --- Phase 1: Read all available lines as raw bytes --- 
            if serial_connection.in_waiting > 0:
                read_count = 0

                while serial_connection.in_waiting > 0:
                    try:
                        # Read raw bytes, keep newline
                        raw_line = serial_connection.readline()
                        if not raw_line: # Break if readline returns empty (e.g., timeout)
                            break 
                        raw_lines_read.append(raw_line)
                        read_count += 1
                    except serial.SerialException as ser_e:
                        print(f"Serial error during read: {ser_e}")
                        # Attempt to clear buffer on serial error
                        try: serial_connection.reset_input_buffer() 
                        except: pass
                        last_malformed_line_logged = None
                        raw_lines_read = [] # Discard potentially corrupted data
                        break # Exit inner read loop
                    except Exception as read_e:
                        print(f"Unexpected error during readline: {read_e}")
                        break # Exit inner read loop

            # --- Phase 2: Decode and Validate collected raw lines --- 
            processed_any_line = False # Did we attempt to process anything?
            if raw_lines_read:
                print(f"Decoding and validating {len(raw_lines_read)} lines read from serial.")
                for raw_line in raw_lines_read:
                    processed_any_line = True
                    try:
                        line = raw_line.decode('utf-8', errors='replace').strip()
                        
                        if line:  # Skip empty lines after stripping
                            # More thorough FEN validation
                            if FEN_PATTERN.match(line):
                                position_part = line.split(' ')[0]
                                rows = position_part.split('/')
                                
                                if len(rows) == 8:
                                    data_to_process.append(line)
                                    last_malformed_line_logged = None # Valid data resets the error logging
                                else:
                                    # Log only if it's a NEW malformed line
                                    if line != last_malformed_line_logged:
                                        print(f"Malformed FEN (wrong number of rows): {line}")
                                        last_malformed_line_logged = line
                            else:
                                # Log only if it's a NEW invalid line
                                if line != last_malformed_line_logged:
                                    print(f"Invalid FEN format: {line}")
                                    last_malformed_line_logged = line
                        else:
                             last_malformed_line_logged = None # Treat empty lines as resetting error state
                             
                    except UnicodeDecodeError as decode_e:
                         # Log only if it's a NEW decode error
                         err_repr = repr(raw_line) # Get representation of failing bytes
                         if err_repr != last_malformed_line_logged:
                            print(f"Error decoding serial data: {decode_e} - Bytes: {err_repr}")
                            last_malformed_line_logged = err_repr
                    except Exception as proc_e:
                        print(f"Unexpected error processing line: {proc_e}")
                        last_malformed_line_logged = None # Reset on unexpected error
            
            # Reset error tracking if we processed lines and didn't end on an error
            if processed_any_line and data_to_process and data_to_process[-1] == line:
                 last_malformed_line_logged = None
                 
            # --- Phase 3: Flush buffer if read limit was hit --- 
            if read_limit_hit:
                print("Flushing input buffer after hitting read limit.")
                try: 
                    # Clear any remaining data
                    serial_connection.reset_input_buffer() 
                except: pass
                last_malformed_line_logged = None # Reset after flush
                
            # --- Phase 4: Process valid data --- 
            if data_to_process and active_game:
                print(f"Processing {len(data_to_process)} valid FEN positions")
                for fen in data_to_process:
                    active_game.add_to_queue(fen)
                active_game.process_queue() # Process the whole batch at once

            # --- Phase 5: Small sleep --- 
            time.sleep(0.1) # Prevent CPU hogging
            
        except serial.SerialException as outer_ser_e:
            print(f"Serial connection error: {outer_ser_e}. Stopping thread.")
            serial_connection = None # Assume connection is lost
            stop_thread = True # Signal thread stop
            last_malformed_line_logged = None
        except Exception as e:
            print(f"Error in serial reading loop: {e}")
            # Attempt recovery
            try:
                if serial_connection and serial_connection.is_open:
                    serial_connection.reset_input_buffer()
                    last_malformed_line_logged = None # Reset after error
                else:
                     # If connection closed unexpectedly, stop thread
                     stop_thread = True
            except:
                 stop_thread = True # Stop if recovery fails
            time.sleep(1)  # Wait a bit longer before trying again
    
    print("Serial reading thread stopped")

@app.route('/games', methods=['POST'])
def create_game():
    """Create a new chess game and save it to the database"""
    try:
        # Generate a unique game ID if not provided
        data = request.json or {}
        game_id = data.get('game_id', str(uuid.uuid4()))
        
        # Create new game
        game = ChessGame(game_id)
        
        # Set optional metadata if provided
        if 'event' in data:
            game.event = data['event']
        if 'site' in data:
            game.site = data['site']
        if 'white' in data:
            game.white = data['white']
        if 'black' in data:
            game.black = data['black']
        
        # Save to database
        success = game.save_to_db()
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Game created successfully',
                'game_id': game_id
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to save game to database'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/games/<game_id>', methods=['GET'])
def get_game(game_id):
    """Get a game from database by ID"""
    try:
        game = ChessGame.load_from_db(game_id)
        
        if not game:
            return jsonify({
                'status': 'error',
                'message': f'Game with ID {game_id} not found'
            }), 404
            
        # Format game data for response
        moves = []
        for move in game.master_state:
            moves.append({
                'move_id': move.move_id,
                'fen': move.fen,
                'player': move.player,
                'timestamp': move.timestamp.isoformat() if move.timestamp else None,
                'algebraic': move.algebraic,
                'uci': move.uci,
                'is_legal': move.is_legal
            })
            
        return jsonify({
            'status': 'success',
            'game': {
                'game_id': game.game_id,
                'event': game.event,
                'site': game.site,
                'date': game.date,
                'round': game.round,
                'white': game.white,
                'black': game.black,
                'result': game.result,
                'moves': moves
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/games', methods=['GET'])
def list_games():
    """List all games in the database"""
    try:
        games = ChessGame.list_games()
        
        # Format the response
        game_list = []
        for game in games:
            game_list.append({
                'game_id': game[0],
                'white': game[1],
                'black': game[2],
                'date': game[3],
                'result': game[4]
            })
            
        return jsonify({
            'status': 'success',
            'games': game_list
        }), 200
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/serial/ports', methods=['GET'])
def list_ports():
    """List available serial ports"""
    try:
        ports = []
        for port in serial.tools.list_ports.comports():
            ports.append({
                'device': port.device,
                'description': port.description,
                'manufacturer': port.manufacturer if hasattr(port, 'manufacturer') else None
            })
            
        return jsonify({
            'status': 'success',
            'ports': ports
        }), 200
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/serial/connect', methods=['POST'])
def connect_serial():
    """Connect to a serial port"""
    global serial_connection, serial_thread, active_game, stop_thread
    
    try:
        data = request.json
        if not data or 'port' not in data or 'game_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Port and game_id are required'
            }), 400
            
        port = data['port']
        game_id = data['game_id']
        baud_rate = data.get('baud_rate', 115200)
        
        # Check if already connected
        if serial_connection and serial_connection.is_open:
            return jsonify({
                'status': 'error',
                'message': f'Already connected to {serial_connection.port}. Disconnect first.'
            }), 400
            
        # Load or create game
        game = ChessGame.load_from_db(game_id)
        if not game:
            # Create new game if not found
            game = ChessGame(game_id)
            game.save_to_db()
        
        # Check if game is already completed
        if game.result != '*':
            return jsonify({
                'status': 'error',
                'message': f'Cannot connect to a completed game with result {game.result}. Only in-progress games can be connected to.'
            }), 400
            
        # Set as active game
        active_game = game
        
        # Connect to serial port
        serial_connection = serial.Serial(port, baud_rate, timeout=1)
        
        # Start reading thread
        stop_thread = False
        serial_thread = threading.Thread(target=read_serial_data)
        serial_thread.daemon = True
        serial_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': f'Connected to {port} for game {game_id}',
            'port': port,
            'game_id': game_id
        }), 200
            
    except serial.SerialException as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to connect to port: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/serial/disconnect', methods=['POST'])
def disconnect_serial():
    """Disconnect from serial port"""
    global serial_connection, serial_thread, active_game, stop_thread
    
    try:
        if not serial_connection or not serial_connection.is_open:
            return jsonify({
                'status': 'error',
                'message': 'Not connected to any serial port'
            }), 400
            
        # Stop the reading thread
        stop_thread = True
        if serial_thread and serial_thread.is_alive():
            serial_thread.join(2.0)  # Wait up to 2 seconds
            
        # Close the connection
        port = serial_connection.port
        serial_connection.close()
        serial_connection = None
        
        # Process remaining items in the queue
        if active_game:
            game_id = active_game.game_id
            active_game.process_queue()
            
            # Save to database
            active_game.save_to_db()
            active_game = None
            
            return jsonify({
                'status': 'success',
                'message': f'Disconnected from {port} and saved game {game_id}'
            }), 200
        else:
            return jsonify({
                'status': 'success',
                'message': f'Disconnected from {port}'
            }), 200
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/games/<game_id>/state', methods=['GET'])
def get_game_state(game_id):
    """Get the current state of an active game"""
    global active_game, serial_connection
    
    try:
        if not active_game or active_game.game_id != game_id:
            return jsonify({
                'status': 'error',
                'message': f'Game {game_id} is not active'
            }), 400
            
        # Format game data for response
        moves = []
        for move in active_game.master_state:
            moves.append({
                'move_id': move.move_id,
                'fen': move.fen,
                'player': move.player,
                'timestamp': move.timestamp.isoformat() if move.timestamp else None,
                'algebraic': move.algebraic,
                'uci': move.uci,
                'is_legal': move.is_legal
            })
            
        return jsonify({
            'status': 'success',
            'game': {
                'game_id': active_game.game_id,
                'event': active_game.event,
                'site': active_game.site,
                'date': active_game.date,
                'round': active_game.round,
                'white': active_game.white,
                'black': active_game.black,
                'result': active_game.result,
                'moves': moves
            },
            'connection': {
                'connected': serial_connection is not None and serial_connection.is_open,
                'port': serial_connection.port if serial_connection and serial_connection.is_open else None
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/games/<game_id>/update-result', methods=['POST'])
def update_game_result(game_id):
    """Update the result of a game"""
    try:
        print(f"[DEBUG] Received request to update result for game {game_id}")
        data = request.json
        print(f"[DEBUG] Request data: {data}")
        
        if not data or 'result' not in data:
            print("[ERROR] Missing 'result' in request data")
            return jsonify({
                'status': 'error',
                'message': 'Result is required'
            }), 400
            
        result = data['result']
        print(f"[DEBUG] Updating game {game_id} result to: {result}")
        
        # Load the game
        game = ChessGame.load_from_db(game_id)
        if not game:
            print(f"[ERROR] Game with ID {game_id} not found")
            return jsonify({
                'status': 'error',
                'message': f'Game with ID {game_id} not found'
            }), 404
            
        # Update the result
        print(f"[DEBUG] Current result: {game.result}, New result: {result}")
        game.result = result
        
        # Save to database
        success = game.save_to_db()
        
        if success:
            print(f"[INFO] Successfully updated game {game_id} result to {result}")
            return jsonify({
                'status': 'success',
                'message': f'Game result updated to {result}',
                'game_id': game_id
            }), 200
        else:
            print(f"[ERROR] Failed to save game {game_id} with new result {result}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to update game result'
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Exception in update_game_result: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000) 