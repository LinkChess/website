import chess
from datetime import datetime
import uuid
import threading
from getMove import determine_move
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, scoped_session

Base = declarative_base()

class ChessMoveModel(Base):
    __tablename__ = 'chess_moves'
    
    id = Column(Integer, primary_key=True)
    move_id = Column(String(36), unique=True, nullable=False)
    game_id = Column(String(36), ForeignKey('chess_games.game_id'), nullable=False)
    fen = Column(String(100), nullable=False)
    player = Column(String(10))
    timestamp = Column(DateTime, nullable=False)
    algebraic = Column(String(10))
    uci = Column(String(10))
    is_legal = Column(Boolean)
    move_index = Column(Integer, nullable=False)
    
    game = relationship("ChessGameModel", back_populates="moves")
    
class ChessGameModel(Base):
    __tablename__ = 'chess_games'
    
    id = Column(Integer, primary_key=True)
    game_id = Column(String(36), unique=True, nullable=False)
    event = Column(String(100))
    site = Column(String(100))
    date = Column(String(20))
    round = Column(String(10))
    white = Column(String(100))
    black = Column(String(100))
    result = Column(String(10))
    created_at = Column(DateTime, nullable=False)
    
    moves = relationship("ChessMoveModel", back_populates="game", order_by="ChessMoveModel.move_index")

# Initialize database connection
engine = create_engine('sqlite:///chess_games.db')
Base.metadata.create_all(engine)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

class ChessMove:
    def __init__(
        self,
        move_id,
        fen,
        player,
        timestamp,
        algebraic=None,
        uci=None,
        move_obj=None,
        is_legal=None,
        piece_moved=None
    ):
        self.move_id = move_id
        self.fen = fen
        self.player = player
        self.timestamp = timestamp

        self.algebraic = algebraic
        self.uci = uci
        self.move_obj = move_obj
        self.is_legal = is_legal
        self.piece_moved = piece_moved

    def __repr__(self):
        legality = "✅" if self.is_legal else "❌" if self.is_legal is not None else "?"
        piece = f"({self.piece_moved})" if self.piece_moved else ""
        if self.algebraic:
            return f"{self.player}: {self.algebraic}{piece} ({self.uci}) [{legality}]"
        return f"{self.player}: [unparsed move]{piece} [{legality}]"

    def to_model(self, game_id, move_index):
        """Convert ChessMove to database model"""
        return ChessMoveModel(
            move_id=self.move_id,
            game_id=game_id,
            fen=self.fen,
            player=self.player,
            timestamp=self.timestamp,
            algebraic=self.algebraic,
            uci=self.uci,
            is_legal=self.is_legal,
            move_index=move_index
        )
    
    @classmethod
    def from_model(cls, model):
        """Create ChessMove from database model"""
        return cls(
            move_id=model.move_id,
            fen=model.fen,
            player=model.player,
            timestamp=model.timestamp,
            algebraic=model.algebraic,
            uci=model.uci,
            is_legal=model.is_legal
        )

class ChessGame:
    def __init__(self, game_id):
        self.game_id = game_id
        self.master_state = []  # list of ChessMove
        self.processing_queue = []  # list of FENs
        self.lock = threading.Lock()

        self.event = "Casual Game"
        self.site = "?"
        self.date = datetime.now().strftime("%Y.%m.%d")
        self.round = "1"
        self.white = "White"
        self.black = "Black"
        self.result = "*"

        initial_board = chess.Board()
        initial_fen = initial_board.fen()

        initial_move = ChessMove(
            move_id=str(uuid.uuid4()),
            fen=initial_fen,
            player=None,  # No player has moved yet
            timestamp=datetime.now(),
            algebraic=None,
            uci=None,
            move_obj=None,
            is_legal=True,
            piece_moved=None
        )

        self.master_state = [initial_move]


    def add_to_queue(self, fen):
        self.processing_queue.append(fen)

    def get_latest_board(self):
        if not self.master_state:
            return chess.Board()  # start from default position
        return chess.Board(self.master_state[-1].fen)

    def process_queue(self):
        while self.processing_queue:
            next_fen = self.processing_queue.pop(0)
            self._process_fen(next_fen)

    def _process_fen(self, next_fen):
        with self.lock:
            board_before = self.get_latest_board()
            try:
                board_after = chess.Board(next_fen)
                board_after_fen_only = board_after.board_fen()
            except ValueError as e:
                print(f"[ERROR] Invalid FEN received in _process_fen: {next_fen} - {e}")
                return

            if self.master_state:
                last_board_fen = chess.Board(self.master_state[-1].fen).board_fen()
                if last_board_fen == board_after_fen_only:
                    return

            move_obj, algebraic = determine_move(board_before, board_after)
            piece_moved_symbol = None

            if move_obj is None:
                print(f"[WARN] Could not determine move for FEN:\n{next_fen}")
                new_move = ChessMove(
                    move_id=str(uuid.uuid4()),
                    fen=next_fen,
                    player="White" if board_before.turn == chess.WHITE else "Black",
                    timestamp=datetime.now(),
                    is_legal=False,
                    piece_moved=None
                )
            else:
                moved_piece = board_before.piece_at(move_obj.from_square)
                if moved_piece:
                    piece_moved_symbol = moved_piece.symbol().upper()
                
                new_move = ChessMove(
                    move_id = str(uuid.uuid4()),
                    fen=next_fen,
                    algebraic=algebraic,
                    uci=move_obj.uci(),
                    player="White" if board_before.turn == chess.WHITE else "Black",
                    timestamp=datetime.now(),
                    move_obj=move_obj,
                    is_legal=move_obj in board_before.legal_moves,
                    piece_moved=piece_moved_symbol
                )

            self.master_state.append(new_move)

    def _create_move_from_fen(self, new_fen, board_before):
        board_after = chess.Board(new_fen)
        move_obj, algebraic = determine_move(board_before, board_after)
        move_id = str(uuid.uuid4())
        player = "White" if board_before.turn == chess.WHITE else "Black"
        timestamp = datetime.now()
        is_legal = move_obj in board_before.legal_moves if move_obj else False
        piece_moved_symbol = None
        if move_obj:
            moved_piece = board_before.piece_at(move_obj.from_square)
            if moved_piece:
                piece_moved_symbol = moved_piece.symbol().upper()

        return ChessMove(
            move_id=move_id,
            fen=new_fen,
            algebraic=algebraic if move_obj else None,
            uci=move_obj.uci() if move_obj else None,
            player=player,
            timestamp=timestamp,
            move_obj=move_obj,
            is_legal=is_legal,
            piece_moved=piece_moved_symbol
        )

    def _replace_move(self, index, new_fen, board_before):
        with self.lock:
            new_move = self._create_move_from_fen(new_fen, board_before)
            self.master_state[index] = new_move

    def _insert_move(self, index, new_fen, board_before):
        with self.lock:
            new_move = self._create_move_from_fen(new_fen, board_before)
            self.master_state.insert(index, new_move)

    def _reprocess_from(self, index):
        with self.lock:
            for i in range(index, len(self.master_state)):
                if i == 0:
                    continue
                prev_board = chess.Board(self.master_state[i - 1].fen)
                new_fen = self.master_state[i].fen
                self._replace_move(i, new_fen, prev_board)

    def manual_edit(self, new_fen, index=None, move_id=None, action="change"):
        if index is None and move_id is None:
            print("[ERROR] Must specify index or move_id.")
            return

        # Resolve target index
        if index is None:
            for i, move in enumerate(self.master_state):
                if move.move_id == move_id:
                    index = i
                    break
            if not index:
                print(f"[ERROR] Move with ID {move_id} not found.")
                return

        if index == 0:
            print("[ERROR] Cannot modify the initial board state.")
            return

        prev_board = chess.Board(self.master_state[index - 1].fen)

        if action == "delete":
            print(f"[INFO] Deleting move at index {index}")
            del self.master_state[index]
            # Reprocess the move at this index (previously the next move)
            if index < len(self.master_state):
                self._reprocess_from(index)
            return

        elif action == "change":
            print(f"[INFO] Changing move at index {index}")
            self._replace_move(index, new_fen, prev_board)
            if index + 1 < len(self.master_state):
                self._reprocess_from(index + 1)
            return

        elif action == "insert":
            print(f"[INFO] Inserting move after index {index}")
            self._insert_move(index + 1, new_fen, prev_board)
            if index + 2 < len(self.master_state):
                self._reprocess_from(index + 2)
            return

        else:
            print(f"[ERROR] Unknown action '{action}'")

    def save_to_db(self):
        """Save the game and all its moves to the database"""
        session = Session()
        try:
            # Check if game already exists
            existing_game = session.query(ChessGameModel).filter_by(game_id=self.game_id).first()
            
            if existing_game:
                # Update existing game record with current values
                print(f"[DEBUG] Updating existing game: {self.game_id}, new result: {self.result}")
                existing_game.event = self.event
                existing_game.site = self.site
                existing_game.date = self.date
                existing_game.round = self.round
                existing_game.white = self.white
                existing_game.black = self.black
                existing_game.result = self.result  # Update the result
                
                # Delete existing moves for the game
                session.query(ChessMoveModel).filter_by(game_id=self.game_id).delete()
            else:
                # Create new game record
                print(f"[DEBUG] Creating new game: {self.game_id}, result: {self.result}")
                game_model = ChessGameModel(
                    game_id=self.game_id,
                    event=self.event,
                    site=self.site,
                    date=self.date,
                    round=self.round,
                    white=self.white,
                    black=self.black,
                    result=self.result,
                    created_at=datetime.now()
                )
                session.add(game_model)
            
            # Save all moves
            for i, move in enumerate(self.master_state):
                move_model = move.to_model(self.game_id, i)
                session.add(move_model)
                
            session.commit()
            print(f"[INFO] Game {self.game_id} saved to database, result: {self.result}")
            return True
        except Exception as e:
            session.rollback()
            print(f"[ERROR] Failed to save game to database: {str(e)}")
            return False
        finally:
            session.close()
    
    @classmethod
    def load_from_db(cls, game_id):
        """Load a game from the database"""
        session = Session()
        try:
            game_model = session.query(ChessGameModel).filter_by(game_id=game_id).first()
            
            if not game_model:
                print(f"[ERROR] Game with ID {game_id} not found in database")
                return None
                
            game = cls(game_id)
            
            # Set game metadata
            game.event = game_model.event
            game.site = game_model.site
            game.date = game_model.date
            game.round = game_model.round
            game.white = game_model.white
            game.black = game_model.black
            game.result = game_model.result
            
            # Load moves
            move_models = session.query(ChessMoveModel).filter_by(game_id=game_id).order_by(ChessMoveModel.move_index).all()
            
            # Clear the default initial move
            game.master_state = []
            
            # Add all moves from database
            for move_model in move_models:
                chess_move = ChessMove.from_model(move_model)
                game.master_state.append(chess_move)
                
            print(f"[INFO] Game {game_id} loaded from database with {len(game.master_state)} moves")
            return game
        except Exception as e:
            print(f"[ERROR] Failed to load game from database: {str(e)}")
            return None
        finally:
            session.close()
            
    @classmethod
    def list_games(cls):
        """List all games in the database"""
        session = Session()
        try:
            games = session.query(ChessGameModel).order_by(ChessGameModel.created_at.desc()).all()
            return [(g.game_id, g.white, g.black, g.date, g.result) for g in games]
        except Exception as e:
            print(f"[ERROR] Failed to list games: {str(e)}")
            return []
        finally:
            session.close()
            
    def delete_from_db(self):
        """Delete the game from the database"""
        session = Session()
        try:
            # Delete all moves
            session.query(ChessMoveModel).filter_by(game_id=self.game_id).delete()
            # Delete game
            session.query(ChessGameModel).filter_by(game_id=self.game_id).delete()
            session.commit()
            print(f"[INFO] Game {self.game_id} deleted from database")
            return True
        except Exception as e:
            session.rollback()
            print(f"[ERROR] Failed to delete game from database: {str(e)}")
            return False
        finally:
            session.close()
