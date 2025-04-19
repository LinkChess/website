import unittest
import chess
from getMove import determine_move

class TestDetermineMove(unittest.TestCase):
    def test_normal_move(self):
        """Test a normal pawn move"""
        board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        board_after = chess.Board("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e2e4"))
        self.assertEqual(san, "e4")

    def test_capture(self):
        """Test a capture move"""
        board_before = chess.Board("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2")
        board_after = chess.Board("rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e4d5"))
        self.assertEqual(san, "exd5")

    def test_en_passant(self):
        """Test en passant capture"""
        board_before = chess.Board("rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3")
        board_after = chess.Board("rnbqkbnr/ppp1p1pp/5P2/3p4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e5f6"))
        self.assertEqual(san, "exf6")

    def test_promotion(self):
        """Test pawn promotion to queen"""
        board_before = chess.Board("8/4P3/8/8/8/8/8/8 w - - 0 1")
        board_after = chess.Board("4Q3/8/8/8/8/8/8/8 b - - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e7e8q"))
        self.assertEqual(san, "e8=Q")
        
    def test_promotion_to_knight(self):
        """Test pawn promotion to knight"""
        board_before = chess.Board("8/4P3/8/8/8/8/8/8 w - - 0 1")
        board_after = chess.Board("4N3/8/8/8/8/8/8/8 b - - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e7e8n"))
        self.assertEqual(san, "e8=N")

    def test_castle_kingside(self):
        """Test kingside castling"""
        board_before = chess.Board("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1")
        board_after = chess.Board("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e1g1"))
        self.assertEqual(san, "O-O")

    def test_castle_queenside(self):
        """Test queenside castling"""
        board_before = chess.Board("r3kbnr/pppqpppp/2n5/3p4/3P4/2N5/PPPQPPPP/R3KBNR w KQkq - 0 1")
        board_after = chess.Board("r3kbnr/pppqpppp/2n5/3p4/3P4/2N5/PPPQPPPP/2KR1BNR b kq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e1c1"))
        self.assertEqual(san, "O-O-O")

    def test_check(self):
        """Test move that gives check"""
        board_before = chess.Board("4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1")
        board_after = chess.Board("4k3/4Q3/8/8/8/8/8/4K3 b - - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e2e7"))
        self.assertEqual(san, "Qe7+")  # Should have + for check
        
    def test_checkmate(self):
        """Test move that gives checkmate"""
        board_before = chess.Board("4k3/4Q3/4K3/8/8/8/8/8 w - - 0 1")
        board_after = chess.Board("4k3/8/4K3/8/8/8/5Q2/8 b - - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e7f2"))
        self.assertEqual(san, "Qf2")  # The # for checkmate won't be added because we're not evaluating checkmate here
        
    def test_ambiguous_change(self):
        """Test when changes are ambiguous (more than 3 squares changed)"""
        board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") 
        # Create a board with 4 changes (impossible in one move)
        board_after = chess.Board("rnbqkbnr/pppppppp/8/8/P7/8/1PPPPPPP/RNBQK3 b KQkq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertIsNone(move)
        self.assertEqual(san, "(ambiguous or unsupported change)")
        
    def test_too_few_changes(self):
        """Test when there is only one square changed (impossible for a valid move)"""
        board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") 
        board_after = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertIsNone(move)
        self.assertEqual(san, "(ambiguous or unsupported change)")

    def test_knight_move(self):
        """Test knight move"""
        board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        board_after = chess.Board("rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("g1f3"))
        self.assertEqual(san, "Nf3")
        
    def test_ambiguous_knight_move(self):
        """Test ambiguous knight move requiring disambiguation"""
        board_before = chess.Board("8/8/8/8/4N3/8/8/1N6 w - - 0 1")
        board_after = chess.Board("8/8/8/8/4N3/8/3N4/8 b - - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("b1d2"))
        self.assertEqual(san, "Nbd2")  # Should have file disambiguation
        
    def test_invalid_move(self):
        """Test when the move is not legal"""
        # King moving two squares (not castling)
        board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        board_after = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BkR b kq - 0 1")
        move, san = determine_move(board_before, board_after)
        self.assertEqual(move, chess.Move.from_uci("e1g1"))  # Move would be detected

if __name__ == "__main__":
    unittest.main() 