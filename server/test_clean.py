import socketio
import time
import uuid
import chess
import random

class ChessLinkTester:
    def __init__(self):
        # Initialize the SocketIO client
        self.sio = socketio.Client(logger=False)
        self.connected = False
        self.is_game_started = False
        self.game_id = None
        self.position_updates = []
        
        # Setup event handlers
        self.setup_event_handlers()
    
    def setup_event_handlers(self):
        @self.sio.event
        def connect():
            self.connected = True
            print("Connected to ChessLink server!")

        @self.sio.event
        def disconnect():
            self.connected = False
            self.is_game_started = False
            print("Disconnected from ChessLink server")

        @self.sio.event
        def hardware_connected(data):
            print(f"Hardware connected: {data}")

        @self.sio.event
        def hardware_disconnected(data):
            print(f"Hardware disconnected: {data}")

        @self.sio.event
        def error(data):
            print(f"⚠️ ERROR: {data['message']}")

        @self.sio.event
        def game_started(data):
            self.game_id = data.get('gameId')
            self.is_game_started = True
            print(f"✅ Game started: {self.game_id}")
            print(f"Initial position: {data.get('initialPosition')}")

        @self.sio.event
        def position(data):
            self.position_updates.append(data)
            move_number = data.get('moveNumber', len(self.position_updates))
            print(f"📢 Position update #{move_number}: {data.get('algebraic', 'unknown move')} | {data.get('fen', '')[:15]}...")

        @self.sio.event
        def hardware_status(data):
            print(f"Hardware status: {data}")

    def connect_to_hardware(self):
        """Connect to mock hardware"""
        print("\n=== Connecting to mock hardware ===")
        self.sio.emit('connect_hardware', {'port': 'MOCK'})
        time.sleep(1)  # Give time for response

    def disconnect_hardware(self):
        """Disconnect hardware"""
        print("\n=== Disconnecting hardware ===")
        self.sio.emit('disconnect_hardware')
        time.sleep(1)  # Give time for response

    def start_new_game(self):
        """Start a new game broadcast"""
        print("\n=== Starting new game ===")
        new_game_id = str(uuid.uuid4())
        self.sio.emit('start_game', {
            'id': new_game_id,
            'title': 'Clean Test Game',
            'white': 'Clean Test White',
            'black': 'Clean Test Black'
        })
        
        # Wait for game to start
        for _ in range(5):
            time.sleep(1)
            if self.is_game_started:
                return True
        
        print("⚠️ Timed out waiting for game to start")
        return False

    def simulate_move(self, fen=None):
        """Simulate a move from hardware"""
        # If no FEN provided, generate a random legal move
        if not fen and self.game_id:
            # Get the latest position
            current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"  # Default starting position
            if self.position_updates:
                current_fen = self.position_updates[-1].get('fen', current_fen)
            
            # Generate a random legal move
            board = chess.Board(current_fen)
            legal_moves = list(board.legal_moves)
            if legal_moves:
                random_move = random.choice(legal_moves)
                board.push(random_move)
                fen = board.fen()
            else:
                print("No legal moves available in current position")
                return False
        
        print(f"\n=== Simulating move: {fen} ===")
        start_count = len(self.position_updates)
        
        # Send the move
        self.sio.emit('simulate_hardware_input', {
            'fen': fen,
            'gameId': self.game_id
        })
        
        # Wait for position update
        for _ in range(5):
            time.sleep(1)
            if len(self.position_updates) > start_count:
                print("✅ Move processed and position updated")
                return True
        
        print("⚠️ Timed out waiting for position update")
        return False

    def run_clean_test(self):
        """Run a clean test sequence with clear separation between steps"""
        self.position_updates.clear()  # Reset position updates
        test_result = False
        
        # Step 1: Connect to the server
        print("\n==== STEP 1: CONNECT TO SERVER ====")
        try:
            print("Connecting to server at http://localhost:8765...")
            # Use connect with no namespace for Flask-SocketIO compatibility
            self.sio.connect('http://localhost:8765', transports=['websocket'])
            time.sleep(2)  # Give time for connection setup
            
            if not self.connected:
                print("⚠️ Failed to connect to server")
            else:
                self._execute_test_steps()
                test_result = True
            
        except (socketio.exceptions.ConnectionError, socketio.exceptions.TimeoutError) as e:
            print(f"❌ Socket connection error: {str(e)}")
        except TimeoutError as e:
            print(f"❌ Timeout error: {str(e)}")
        except RuntimeError as e:
            print(f"❌ Runtime error: {str(e)}")
        finally:
            # Always try to disconnect cleanly
            if self.connected:
                print("Disconnecting from server...")
                self.sio.disconnect()
            print("\n==== TEST COMPLETE ====")
            
        return test_result
        
    def _execute_test_steps(self):
        """Execute the test steps to reduce nesting"""
        # Step 2: Connect to hardware
        print("\n==== STEP 2: CONNECT TO HARDWARE ====")
        self.connect_to_hardware()
        
        # Step 3: Start a new game
        print("\n==== STEP 3: START NEW GAME ====")
        if self.start_new_game():
            # Step 4: Make a series of moves with clear feedback
            print("\n==== STEP 4: MAKE MOVES ====")
            for i in range(3):
                print(f"\n--- Move {i+1} ---")
                if not self.simulate_move():
                    break
                time.sleep(3)  # Give more time between moves
            
            # Step 5: Clean up
            print("\n==== STEP 5: CLEAN UP ====")
            self.disconnect_hardware()


if __name__ == "__main__":
    print("=================================================")
    print("CLEAN CHESSLINK TEST - ISOLATED TESTING PROCEDURE")
    print("=================================================")
    
    tester = ChessLinkTester()
    success = tester.run_clean_test()
    
    if success:
        print("\n✅ Clean test completed successfully")
    else:
        print("\n❌ Clean test failed") 