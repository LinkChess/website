import chess

def determine_move(board_before: chess.Board, board_after: chess.Board):
    changed = [sq for sq in range(64) if board_before.piece_at(sq) != board_after.piece_at(sq)]

    # Disallow ambiguous changes
    if len(changed) < 2 or len(changed) > 4:
        return None, "(ambiguous or unsupported change)"

    # Check legal moves first, including e.p. and castling
    for move in board_before.legal_moves:
        temp_board = board_before.copy()
        temp_board.push(move)
        if temp_board.board_fen() == board_after.board_fen():
            try:
                san = board_before.san(move)
            except:
                san = move.uci()  # fallback, should rarely happen
            return move, san

    # At this point: len(changed) == 2 or it is illegal
    if len(changed) != 2:
        return None, "(unable to infer move)"
    
    # Infer from_sq and to_sq
    from_sq = None
    to_sq = None
    for sq in changed:
        before_piece = board_before.piece_at(sq)
        after_piece = board_after.piece_at(sq)

        if before_piece and not after_piece:
            from_sq = sq
        elif after_piece and (not before_piece or before_piece.color != after_piece.color):
            to_sq = sq

    if from_sq is None or to_sq is None:
        return None, "(unable to infer move)"

    # Promotion check
    promotion = None
    moved_piece = board_before.piece_at(from_sq)
    if moved_piece.piece_type == chess.PAWN and chess.square_rank(to_sq) in [0, 7]:
        promoted_piece = board_after.piece_at(to_sq)
        if promoted_piece:
            promotion = promoted_piece.piece_type

    move = chess.Move(from_sq, to_sq, promotion=promotion)

    # Try to generate algebraic notation
    try:
        san = board_before.san(move)
    except:
        # Manual fallback with full disambiguation
        capture = board_before.piece_at(to_sq) is not None or (
            moved_piece.piece_type == chess.PAWN and chess.square_file(from_sq) != chess.square_file(to_sq)
        )
        piece_letter = '' if moved_piece.piece_type == chess.PAWN else moved_piece.symbol().upper()
        from_square = chess.square_name(from_sq)
        to_square = chess.square_name(to_sq)
        san = f"{piece_letter}{from_square}{'x' if capture else ''}{to_square}"
        if promotion:
            san += f"={chess.PIECE_SYMBOLS[promotion].upper()}"

    # Append check or checkmate if applicable
    board_sim = board_before.copy()
    try:
        board_sim.push(move)
        if board_sim.is_checkmate():
            san += "#"
        elif board_sim.is_check():
            san += "+"
    except:
        # Don't crash if it's invalid
        pass

    return move, san


if __name__ == "__main__":
    board_before = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    print(board_before)
    print("--------------------------------")
    board_after = chess.Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BKR b kq - 0 1")
    print(board_after)
    move, san = determine_move(board_before, board_after)
    print(move, san)
