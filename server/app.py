from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import serial
import serial.tools.list_ports
import re
import threading
import time
import uuid
import json
import sqlite3
from chessClass import ChessGame
from chessFileReader import ChessFileReader, create_reader

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")  # Initialize SocketIO with CORS

# Global state
serial_connection = None
serial_thread = None
active_game = None
stop_thread = False
connected_clients = {}  # Store connected WebSocket clients
current_game_id = None  # Store the current game ID being broadcast

# FEN regex pattern (basic validation)
FEN_PATTERN = re.compile(r"^[1-8pnbrqkPNBRQK/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$")

def read_serial_data():
    global serial_connection, active_game, stop_thread, current_game_id
    
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
                print(f"Decoding and validating {len(raw_lines_read)} lines read from {'file' if isinstance(serial_connection, ChessFileReader) else 'serial'}.")
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
                
                # Store the initial state
                initial_state_len = len(active_game.master_state)
                
                # Process the queued positions
                active_game.process_queue()
                
                # Check if new moves were added and emit them via WebSocket
                if len(active_game.master_state) > initial_state_len and current_game_id is not None:
                    # Ensure we only iterate over newly added moves
                    start_index = initial_state_len
                    if start_index == 0 and len(active_game.master_state) > 0: 
                        # If it's the very first position (index 0), don't emit it as a move
                        start_index = 1
                        
                    for i in range(start_index, len(active_game.master_state)):
                        move = active_game.master_state[i]
                        # Emit the position update to connected clients
                        emit_data = {
                            'type': 'position',
                            'gameId': current_game_id,
                            'fen': move.fen,
                            'moveNumber': i,
                            'player': move.player,
                            'algebraic': move.algebraic,
                            'isLegal': move.is_legal,
                            'piece_moved': move.piece_moved, # Already added
                            'from_square': move.from_square if hasattr(move, 'from_square') else None, # Add from_square if available
                            'to_square': move.to_square if hasattr(move, 'to_square') else None     # Add to_square if available
                        }
                        socketio.emit('position', emit_data)
                        print(f"[POSITION EVENT] Emitted position update from read_serial_data for move {i}: {move.algebraic or 'unknown move'} | FEN: {move.fen[:15]}...")

            # --- Phase 5: Small sleep --- 
            time.sleep(0.1) # Prevent CPU hogging
            
        except serial.SerialException as outer_ser_e:
            print(f"Serial connection error: {outer_ser_e}. Stopping thread.")
            serial_connection = None # Assume connection is lost
            stop_thread = True # Signal thread stop
            last_malformed_line_logged = None
            # Emit a disconnect event to clients
            socketio.emit('hardware_status', {'status': 'disconnected', 'message': str(outer_ser_e)})
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
                     # Emit a disconnect event to clients
                     socketio.emit('hardware_status', {'status': 'error', 'message': str(e)})
            except:
                 stop_thread = True # Stop if recovery fails
            time.sleep(1)  # Wait a bit longer before trying again
    
    print("Serial reading thread stopped")
    socketio.emit('hardware_status', {'status': 'disconnected', 'message': 'Serial connection closed'})

# SocketIO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    connected_clients[request.sid] = {'connected': True}
    # Send current status to the newly connected client
    emit('hardware_status', {
        'status': 'connected' if (serial_connection is True) or (serial_connection and serial_connection.is_open) else 'disconnected',
        'current_game': current_game_id
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    if request.sid in connected_clients:
        del connected_clients[request.sid]

@socketio.on('start_game')
def handle_start_game(data):
    """Start a new game broadcast"""
    global current_game_id, serial_connection, serial_thread, active_game, stop_thread
    
    try:
        # Check if connected to hardware
        if not serial_connection:
            emit('error', {'message': 'Not connected to hardware. Please connect first.'})
            return
        
        # For normal serial connection, check if it's open
        if not isinstance(serial_connection, bool) and not serial_connection.is_open:
            emit('error', {'message': 'Not connected to hardware. Please connect first.'})
            return
            
        # Extract game details from the data
        game_id = data.get('id', str(uuid.uuid4()))
        current_game_id = game_id
        
        # Setup the game in the ChessGame system
        if active_game and active_game.game_id != game_id:
            # If we're switching games, save the current one
            if active_game:
                active_game.save_to_db()
                
        # Load or create the game
        game = ChessGame.load_from_db(game_id)
        if not game:
            game = ChessGame(game_id)
            # Set game metadata from the request
            if 'title' in data:
                game.event = data['title']
            if 'white' in data:
                game.white = data['white']
            if 'black' in data:
                game.black = data['black']
            game.save_to_db()
            
        active_game = game
        
        # Let the client know the game has started
        emit('game_started', {
            'gameId': game_id,
            'initialPosition': active_game.master_state[0].fen,
            'message': 'Game broadcast started'
        })
        
        # Broadcast to all clients that a new game has started
        socketio.emit('new_game', {
            'type': 'new_game',
            'game': {
                'id': game_id,
                'title': active_game.event,
                'players': {
                    'white': active_game.white,
                    'black': active_game.black
                },
                'status': 'active',
                'lastUpdate': time.time() * 1000,  # milliseconds since epoch
                'currentPosition': active_game.master_state[0].fen,
                'moveCount': 0,
                'viewerCount': len(connected_clients)
            }
        })
        
        print(f"Started new game broadcast: {game_id}")
        
    except Exception as e:
        print(f"Error starting game: {str(e)}")
        emit('error', {'message': f'Failed to start game: {str(e)}'})

@socketio.on('end_game')
def handle_end_game(data):
    """End a game broadcast"""
    global current_game_id, active_game
    
    try:
        game_id = data.get('gameId', current_game_id)
        
        if not game_id:
            emit('error', {'message': 'No active game to end'})
            return
            
        if active_game and active_game.game_id == game_id:
            # Save the game state
            active_game.save_to_db()
            print(f"Game {game_id} saved to database")
            
            # Broadcast that the game has ended
            socketio.emit('game_ended', {
                'type': 'game_ended',
                'gameId': game_id
            })
            
            current_game_id = None
            emit('game_ended', {'message': f'Game {game_id} broadcast ended'})
        else:
            emit('error', {'message': f'Game {game_id} is not active'})
            
    except Exception as e:
        print(f"Error ending game: {str(e)}")
        emit('error', {'message': f'Failed to end game: {str(e)}'})

@socketio.on('connect_hardware')
def handle_connect_hardware(data):
    """Connect to hardware via serial port or moves.txt file"""
    global serial_connection, serial_thread, active_game, stop_thread
    
    try:
        if not data or 'port' not in data:
            emit('error', {'message': 'Port is required'})
            return

        port = data['port']
        baud_rate = data.get('baudRate', 115200)
        
        # Check if already connected
        if serial_connection and serial_connection.is_open:
            emit('error', {'message': f'Already connected to {getattr(serial_connection, "port", "file")}. Disconnect first.'})
            return
        
        # Special case for mock connections (used in testing)
        if port == 'MOCK':
            print("Using mock serial connection for testing")
            serial_connection = True  # Not a real connection but mark as connected
            
            # Emit connection successful event
            emit('hardware_connected', {
                'status': 'connected',
                'port': port,
                'message': f'Connected to {port} (mock)'
            })
            
            # Also broadcast to all clients
            socketio.emit('hardware_status', {
                'status': 'connected',
                'port': port
            })
            return
        
        # Special case for file-based connection
        if port == 'FILE' or port.endswith('.txt'):
            file_path = data.get('file_path', 'moves.txt')
            if port != 'FILE':
                file_path = port  # Use the port as file path
                
            print(f"Using file-based connection from {file_path}")
            serial_connection = create_reader(file_path)
            
            # Start reading thread
            stop_thread = False
            serial_thread = threading.Thread(target=read_serial_data)
            serial_thread.daemon = True
            serial_thread.start()
            
            # Emit connection successful event
            emit('hardware_connected', {
                'status': 'connected',
                'port': f'FILE:{file_path}',
                'message': f'Connected to file {file_path}'
            })
            
            # Also broadcast to all clients
            socketio.emit('hardware_status', {
                'status': 'connected',
                'port': f'FILE:{file_path}'
            })
            
            print(f"Connected to file at {file_path}")
            return
            
        # Connect to serial port
        serial_connection = serial.Serial(port, baud_rate, timeout=1)
        
        # Start reading thread
        stop_thread = False
        serial_thread = threading.Thread(target=read_serial_data)
        serial_thread.daemon = True
        serial_thread.start()
        
        emit('hardware_connected', {
            'status': 'connected',
            'port': port,
            'message': f'Connected to {port}'
        })
        
        # Also broadcast to all clients
        socketio.emit('hardware_status', {
            'status': 'connected',
            'port': port
        })
        
        print(f"Connected to hardware on port {port}")
        
    except serial.SerialException as e:
        emit('error', {'message': f'Failed to connect to port: {str(e)}'})
    except Exception as e:
        emit('error', {'message': f'Error: {str(e)}'})

@socketio.on('disconnect_hardware')
def handle_disconnect_hardware():
    """Disconnect from hardware"""
    global serial_connection, serial_thread, active_game, stop_thread
    
    try:
        if not serial_connection:
            emit('error', {'message': 'Not connected to any hardware'})
            return
        
        # Handle mock connection
        if serial_connection is True:  # Special case for mock connections
            serial_connection = None
            
            # Process remaining items in the queue and save
            if active_game:
                active_game.process_queue()
                active_game.save_to_db()
                
            emit('hardware_disconnected', {
                'status': 'disconnected',
                'message': 'Disconnected from MOCK connection'
            })
            
            # Also broadcast to all clients
            socketio.emit('hardware_status', {
                'status': 'disconnected',
                'port': 'MOCK'
            })
            
            print("Disconnected from mock hardware")
            return
            
        if not serial_connection.is_open:
            emit('error', {'message': 'Not connected to any hardware'})
            return
            
        # Stop the reading thread
        stop_thread = True
        if serial_thread and serial_thread.is_alive():
            serial_thread.join(2.0)  # Wait up to 2 seconds
            
        # Get port or file info for messaging
        connection_info = getattr(serial_connection, 'port', 'file')
        if isinstance(serial_connection, ChessFileReader):
            connection_info = f"FILE:{serial_connection.file_path}"
            
        # Close the connection
        serial_connection.close()
        serial_connection = None
        
        # Process remaining items in the queue and save
        if active_game:
            active_game.process_queue()
            active_game.save_to_db()
            
        emit('hardware_disconnected', {
            'status': 'disconnected',
            'message': f'Disconnected from {connection_info}'
        })
        
        # Also broadcast to all clients
        socketio.emit('hardware_status', {
            'status': 'disconnected',
            'port': connection_info
        })
        
        print(f"Disconnected from {connection_info}")
        
    except Exception as e:
        emit('error', {'message': f'Error: {str(e)}'})

@socketio.on('get_live_games')
def handle_get_live_games():
    """Get list of live games"""
    try:
        if current_game_id and active_game:
            # We only support one active game at a time in this implementation
            live_games = [{
                'id': current_game_id,
                'title': active_game.event,
                'players': {
                    'white': active_game.white,
                    'black': active_game.black
                },
                'status': 'active',
                'lastUpdate': time.time() * 1000,  # milliseconds since epoch
                'currentPosition': active_game.master_state[-1].fen,
                'moveCount': len(active_game.master_state) - 1,  # Subtract 1 for initial state
                'viewerCount': len(connected_clients)
            }]
        else:
            live_games = []
            
        emit('live_games_list', {
            'type': 'live_games_list',
            'games': live_games
        })
        
    except Exception as e:
        emit('error', {'message': f'Error: {str(e)}'})

@socketio.on('get_game_state')
def handle_get_game_state(data):
    """Get current state of a specific game"""
    try:
        game_id = data.get('gameId')
        
        if not game_id:
            emit('error', {'message': 'Game ID is required'})
            return
            
        # Check if it's the active game
        if active_game and active_game.game_id == game_id:
            game = active_game
        else:
            # Load from database
            game = ChessGame.load_from_db(game_id)
            
        if not game:
            emit('error', {'message': f'Game {game_id} not found'})
            return
            
        # Get the latest position
        latest_position = game.master_state[-1].fen if game.master_state else None
        
        emit('game_state', {
            'gameId': game_id,
            'title': game.event,
            'players': {
                'white': game.white,
                'black': game.black
            },
            'status': 'active' if game_id == current_game_id else 'ended',
            'position': latest_position,
            'moveCount': len(game.master_state) - 1,  # Subtract 1 for initial state
            'viewerCount': len(connected_clients)
        })
        
    except Exception as e:
        emit('error', {'message': f'Error: {str(e)}'})

@socketio.on('simulate_hardware_input')
def handle_simulate_hardware_input(data):
    """Simulate hardware input by handling a FEN string directly from a client FOR A SPECIFIC GAME"""
    global active_game, current_game_id
    try:
        if 'fen' not in data or 'gameId' not in data:
            emit('error', {'message': 'FEN string and gameId are required'})
            return
            
        fen = data['fen']
        game_id = data['gameId']
        
        # Load the specific game instance based on the provided gameId
        target_game = ChessGame.load_from_db(game_id)
        
        if not target_game:
            # Maybe check the global active_game as a fallback?
            if game_id == current_game_id and active_game:
                target_game = active_game
            else:
                 emit('error', {'message': f'Game with ID {game_id} not found or not active.'})
                 return
                 
        # Update current_game_id if not set - this ensures the game shows up in live games list
        if current_game_id is None:
            current_game_id = game_id
            # Broadcast new game event if this is a newly active game
            socketio.emit('new_game', {
                'type': 'new_game',
                'game': {
                    'id': game_id,
                    'title': target_game.event,
                    'players': {
                        'white': target_game.white,
                        'black': target_game.black
                    },
                    'status': 'active',
                    'lastUpdate': time.time() * 1000,  # milliseconds since epoch
                    'currentPosition': target_game.master_state[0].fen,
                    'moveCount': len(target_game.master_state) - 1,  # Subtract 1 for initial state
                    'viewerCount': len(connected_clients)
                }
            })
            # Set as active game if not already
            if target_game != active_game:
                active_game = target_game
            
        print(f"Simulated hardware input for game {game_id}: {fen}")
        
        # Store initial state length before processing
        initial_state_len = len(target_game.master_state)
        
        # Process the FEN position for the target game
        target_game.add_to_queue(fen)
        target_game.process_queue()
        
        # Check if new moves were added and emit them via WebSocket
        if len(target_game.master_state) > initial_state_len:
            move = target_game.master_state[-1] # Get the latest ChessMove object
            move_index = len(target_game.master_state) - 1
            
            socketio.emit('position', {
                'type': 'position',
                'gameId': game_id,
                'fen': move.fen,
                'moveNumber': move_index,
                'player': move.player,
                'algebraic': move.algebraic,
                'isLegal': move.is_legal,
                'piece_moved': move.piece_moved # ADD piece_moved field
            })
            print(f"[POSITION EVENT] Emitted simulated position update from simulate_hardware_input for game {game_id}: {move.algebraic or 'unknown move'} ({move.piece_moved}) | FEN: {move.fen[:15]}...")
            
            # Persist the change for the loaded game if it wasn't the global active one
            if target_game != active_game:
                 target_game.save_to_db()
                 
    except Exception as e:
        print(f"Error processing simulated input: {str(e)}")
        emit('error', {'message': f'Error: {str(e)}'})

@socketio.on('get_raw_board_state')
def handle_get_raw_board_state():
    """Read the last FEN from input file and return only the board state portion"""
    try:
        # Default file path, could be made configurable
        file_path = 'moves.txt'
        
        # Read the last line from the file
        last_fen = ""
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()
                if lines:
                    last_fen = lines[-1].strip()
        except Exception as e:
            print(f"Error reading file: {str(e)}")
            emit('raw_board_state', {'status': 'error', 'message': f'Error reading file: {str(e)}'})
            return
        
        # Extract only the board state part (before the first space)
        board_state = last_fen.split(' ')[0] if last_fen else ""
        
        # Send the board state to the client
        emit('raw_board_state', {
            'status': 'success',
            'boardState': board_state
        })
        print(f"Sent raw board state: {board_state}")
        
    except Exception as e:
        print(f"Error getting raw board state: {str(e)}")
        emit('raw_board_state', {'status': 'error', 'message': str(e)})

# REST API routes (keeping these for compatibility)
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
        # serial_thread.start() # TEMPORARILY COMMENTED OUT
        print(f"--- Serial reading thread NOT started (Commented out in handle_connect_hardware) ---") # Added log
        
        emit('hardware_connected', {
            'status': 'connected',
            'port': port,
            'message': f'Connected to {port} for game {game_id}',
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

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    try:
        # Get email from request
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        email = data['email']
        
        # Basic email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        # Connect to database
        conn = sqlite3.connect('chess_games.db')
        cursor = conn.cursor()
        
        # Insert email into subscribers table
        try:
            cursor.execute('INSERT INTO subscribers (email) VALUES (?)', (email,))
            conn.commit()
            return jsonify({'success': True, 'message': 'Subscription successful!'}), 201
        except sqlite3.IntegrityError:
            # Email already exists
            return jsonify({'success': True, 'message': 'You are already subscribed!'}), 200
        finally:
            conn.close()
            
    except Exception as e:
        print(f"[ERROR] Subscription error: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred. Please try again later.'}), 500

@app.route('/api/subscribers', methods=['GET'])
def get_subscribers():
    try:
        # Check for admin access (you can implement more secure authentication)
        if 'admin_key' not in request.args or request.args['admin_key'] != 'your_admin_key_here':
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 401
        
        # Connect to database
        conn = sqlite3.connect('chess_games.db')
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        # Get all subscribers
        cursor.execute('SELECT email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC')
        subscribers = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'count': len(subscribers),
            'subscribers': subscribers
        })
            
    except Exception as e:
        print(f"[ERROR] Error fetching subscribers: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while fetching subscribers'}), 500

if __name__ == '__main__':
    print("Starting ChessLink WebSocket Server on port 8765...")
    socketio.run(app, host='127.0.0.1', port=8765, debug=True, allow_unsafe_werkzeug=True)