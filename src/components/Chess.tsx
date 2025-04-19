import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Chess as ChessJS } from 'chess.js';
import { AlertCircle, RotateCcw, Send, Info, Settings, Zap, Maximize, Minimize, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { 
  SOUNDS, 
  playSound, 
  preloadSounds,
  speakText,
  getMoveText,
  announceGameState
} from '@/lib/soundUtils';

// Chess piece SVG mappings with fallbacks
const PIECE_IMAGES: Record<string, string> = {
  // Primary URLs (chess.com pieces)
  'p': 'https://www.chess.com/chess-themes/pieces/neo/150/bp.png',
  'n': 'https://www.chess.com/chess-themes/pieces/neo/150/bn.png',
  'b': 'https://www.chess.com/chess-themes/pieces/neo/150/bb.png',
  'r': 'https://www.chess.com/chess-themes/pieces/neo/150/br.png',
  'q': 'https://www.chess.com/chess-themes/pieces/neo/150/bq.png',
  'k': 'https://www.chess.com/chess-themes/pieces/neo/150/bk.png',
  'P': 'https://www.chess.com/chess-themes/pieces/neo/150/wp.png',
  'N': 'https://www.chess.com/chess-themes/pieces/neo/150/wn.png',
  'B': 'https://www.chess.com/chess-themes/pieces/neo/150/wb.png',
  'R': 'https://www.chess.com/chess-themes/pieces/neo/150/wr.png',
  'Q': 'https://www.chess.com/chess-themes/pieces/neo/150/wq.png',
  'K': 'https://www.chess.com/chess-themes/pieces/neo/150/wk.png',
  
  // Fallback URLs (wikimedia commons pieces)
  'p_fallback': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'n_fallback': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'b_fallback': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'r_fallback': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'q_fallback': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  'k_fallback': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  'P_fallback': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'N_fallback': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'B_fallback': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'R_fallback': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'Q_fallback': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  'K_fallback': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
};

// Unicode fallbacks as a last resort
const UNICODE_PIECES: Record<string, string> = {
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
};

// Add a component for piece display with fallbacks
const ChessPiece: React.FC<{ piece: string; isAnimated?: boolean }> = ({ piece, isAnimated = false }) => {
  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Get appropriate alt text
  const getPieceAlt = () => {
    const color = piece === piece.toUpperCase() ? 'White' : 'Black';
    const type = 
      piece.toLowerCase() === 'p' ? 'Pawn' : 
      piece.toLowerCase() === 'r' ? 'Rook' : 
      piece.toLowerCase() === 'n' ? 'Knight' : 
      piece.toLowerCase() === 'b' ? 'Bishop' : 
      piece.toLowerCase() === 'q' ? 'Queen' : 'King';
    return `${color} ${type}`;
  };

  if (fallbackError) {
    // Use Unicode as final fallback
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className={`${isAnimated ? 'text-4xl' : 'text-5xl'} font-chess`}>
          {UNICODE_PIECES[piece]}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {!imgError ? (
        <img 
          src={PIECE_IMAGES[piece]} 
          alt={getPieceAlt()}
          className="w-full h-full object-contain p-1 max-w-full max-h-full"
          draggable={false}
          style={{ display: 'block' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <img 
          src={PIECE_IMAGES[`${piece}_fallback`]} 
          alt={getPieceAlt()}
          className="w-full h-full object-contain p-1 max-w-full max-h-full"
          draggable={false}
          style={{ display: 'block' }}
          onError={() => setFallbackError(true)}
        />
      )}
    </div>
  );
};

// Difficulty levels for the computer player
const DIFFICULTY_LEVELS = {
  easy: 1,
  medium: 2,
  hard: 3
};

// Type definitions
type Square = string;
type Piece = { type: string; color: 'w' | 'b' };
type Move = { from: Square; to: Square; promotion?: string };

// Add sound settings type
interface SoundSettings {
  effects: boolean;
  speech: boolean;
  volume: number;
}

interface ChessProps {
  className?: string;
}

const Chess: React.FC<ChessProps> = ({ className }) => {
  // Reference to track component mount state
  const isMounted = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Game state - Initialize with a callback to ensure it's only created once
  const [game, setGame] = useState<ChessJS>(() => {
    console.log("Creating initial chess game instance");
    try {
      return new ChessJS();
    } catch (e) {
      console.error("Error creating chess game:", e);
      // In case of error, we need to return something
      return new ChessJS();
    }
  });
  const [board, setBoard] = useState<Array<Array<Piece | null>>>(() => {
    // Initialize with an empty board
    return Array(8).fill(null).map(() => Array(8).fill(null));
  });
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [gameMode, setGameMode] = useState<'human' | 'computer'>('human');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isThinking, setIsThinking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatedPiece, setAnimatedPiece] = useState<{
    piece: string;
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null>(null);

  // Add sound settings state
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    effects: true,
    speech: true,
    volume: 0.5
  });

  // Initialize the game and board
  useEffect(() => {
    console.log("Component mounted, initializing chess game...");
    isMounted.current = true;
    
    try {
      // Initialize the game
      const initialGame = new ChessJS();
      console.log("Initial game FEN:", initialGame.fen());
      setGame(initialGame);
      
      // Initialize the board from the game
      const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = getRankFileNotation(row, col);
          const piece = initialGame.get(square as any);
          initialBoard[row][col] = piece || null;
        }
      }
      setBoard(initialBoard);
    } catch (e) {
      console.error("Error initializing chess game:", e);
    }
    
    // Preload all audio files
    preloadSounds();
    
    return () => {
      console.log("Component unmounting...");
      isMounted.current = false;
    };
  }, []);

  // Update the board state when the game changes
  useEffect(() => {
    if (!isMounted.current) return;
    
    console.log("Game state updated:", game.fen());
    updateBoardState();
    checkGameStatus();
    setCurrentPlayer(game.turn());
  }, [game]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset the game to initial state
  const resetGame = useCallback(() => {
    console.log("Resetting game...");
    try {
      const newGame = new ChessJS();
      console.log("New game FEN:", newGame.fen());
      setGame(newGame);
      setSelectedSquare(null);
      setLegalMoves([]);
      setMoveHistory([]);
      setGameStatus('');
      setLastMove(null);
      setAnimatedPiece(null);
      
      // Ensure the board is updated immediately
      setTimeout(() => {
        updateBoardState();
      }, 0);
    } catch (e) {
      console.error("Error resetting game:", e);
    }
  }, []);

  // Update the board representation from the game state
  const updateBoardState = useCallback(() => {
    console.log("Updating board state from:", game.fen());
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = getRankFileNotation(row, col);
        const piece = game.get(square as any);
        newBoard[row][col] = piece || null;
      }
    }
    
    setBoard(newBoard);
  }, [game]);

  // Check if the game has ended and update the status
  const checkGameStatus = useCallback(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate! ${winner} wins.`);
      playSound('victory');
    } else if (game.isDraw()) {
      let reason = "Draw";
      if (game.isStalemate()) reason = "Stalemate";
      else if (game.isThreefoldRepetition()) reason = "Threefold Repetition";
      else if (game.isInsufficientMaterial()) reason = "Insufficient Material";
      setGameStatus(`Game over: ${reason}`);
      playSound('draw');
    } else if (game.isCheck()) {
      setGameStatus(`Check! ${game.turn() === 'w' ? 'White' : 'Black'} to move.`);
      playSound('check');
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  }, [game]);

  // Convert row and column to chess notation (e.g., e4)
  const getRankFileNotation = (row: number, col: number): Square => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}` as Square;
  };

  // Convert chess notation to row and column
  const getRowColFromNotation = (square: Square): [number, number] => {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return [rank, file];
  };

  // Play sound effect if enabled
  const playSoundEffect = (soundName: keyof typeof SOUNDS) => {
    if (soundSettings.effects) {
      playSound(soundName, soundSettings.volume);
    }
  };

  // Speak move announcement if enabled
  const announceMoveWithSpeech = (moveResult: any) => {
    if (soundSettings.speech) {
      const announcement = getMoveText(moveResult);
      speakText(announcement);
    }
  };

  // Toggle sound effects
  const toggleSoundEffects = () => {
    setSoundSettings(prev => ({
      ...prev,
      effects: !prev.effects
    }));
  };

  // Toggle speech
  const toggleSpeech = () => {
    setSoundSettings(prev => ({
      ...prev,
      speech: !prev.speech
    }));
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!boardRef.current) return;
    
    if (!document.fullscreenElement) {
      boardRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Animate a piece movement
  const animatePieceMovement = (fromSquare: Square, toSquare: Square, piece: Piece) => {
    const [fromRow, fromCol] = getRowColFromNotation(fromSquare);
    const [toRow, toCol] = getRowColFromNotation(toSquare);
    
    setAnimatedPiece({
      piece: `${piece.color === 'b' ? piece.type.toLowerCase() : piece.type.toUpperCase()}`,
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    });
    
    // Clear animation after it completes
    setTimeout(() => {
      setAnimatedPiece(null);
    }, 500);
  };

  // Handle square selection and move making
  const handleSquareClick = (row: number, col: number) => {
    console.log(`Square clicked: ${row}, ${col}`);
    
    // Prevent moves if computer is thinking or if it's computer's turn in computer mode
    if (isThinking || (gameMode === 'computer' && currentPlayer === 'b')) {
      console.log("Cannot move: computer is thinking or it's computer's turn");
      playSoundEffect('illegal');
      return;
    }
    
    const square = getRankFileNotation(row, col);
    console.log(`Square notation: ${square}`);
    
    // If a square is already selected, try to move there
    if (selectedSquare) {
      console.log(`Attempting to move from ${selectedSquare} to ${square}`);
      
      // Don't allow moving to the same square
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      
      const move: Move = { from: selectedSquare, to: square };
      
      // Check if this is a pawn promotion move
      if (needsPromotion(selectedSquare, square)) {
        console.log("Pawn promotion detected");
        move.promotion = 'q'; // Default to queen promotion
      }
      
      // Get the piece that's moving
      const movingPiece = game.get(selectedSquare as any);
      
      // Try to make the move
      try {
        // Create a new instance of the game to avoid mutation issues
        const gameCopy = new ChessJS(game.fen());
        const moveResult = gameCopy.move(move);
        
        if (moveResult) {
          console.log("Move successful:", moveResult);
          
          // Check if this was a capture or special move for sound effects
          if (moveResult.captured) {
            playSoundEffect('capture');
          } else if (moveResult.san.includes('O-O')) {
            playSoundEffect('castle');
          } else if (moveResult.flags.includes('e')) { // en passant
            playSoundEffect('enPassant');
          } else if (moveResult.promotion) {
            playSoundEffect('promotion');
          } else {
            playSoundEffect('move');
          }
          
          // Announce the move with speech
          announceMoveWithSpeech(moveResult);
          
          // Animate the piece movement
          if (movingPiece) {
            animatePieceMovement(selectedSquare, square, movingPiece);
          }
          
          // Move was legal, update the game state
          setGame(gameCopy);
          setLastMove(move);
          setMoveHistory(prevHistory => [...prevHistory, moveResult.san]);
          
          // Check for check, checkmate, or draw after a short delay
          setTimeout(() => {
            if (gameCopy.isCheck() || gameCopy.isCheckmate() || gameCopy.isDraw()) {
              announceGameState(gameCopy);
            }
          }, 700);
          
          // If playing against computer, make computer move after animation completes
          if (gameMode === 'computer' && gameCopy.turn() === 'b') {
            console.log("Computer's turn next");
            setTimeout(() => {
              makeComputerMove();
            }, 600); // Wait for animation to finish
          }
        } else {
          console.log("Move failed, no result returned");
          playSoundEffect('illegal');
        }
      } catch (e) {
        console.error("Invalid move:", e);
        playSoundEffect('illegal');
      }
      
      // Reset selection
      setSelectedSquare(null);
      setLegalMoves([]);
    } else {
      // Select the square if it has a piece of the current player's color
      const piece = game.get(square as any);
      console.log("Piece at square:", piece);
      
      if (piece && piece.color === currentPlayer) {
        console.log(`Selecting piece: ${piece.type} (${piece.color})`);
        setSelectedSquare(square);
        
        // Get legal moves for this piece
        const moves = game.moves({ square: square as any, verbose: true });
        console.log("Legal moves:", moves);
        const legalDestinations = moves.map((move: any) => move.to);
        setLegalMoves(legalDestinations);
      } else {
        console.log("No suitable piece to select");
        if (piece) {
          // If a piece was clicked but it's not the current player's, play illegal sound
          playSoundEffect('illegal');
        }
      }
    }
  };

  // Check if a move requires pawn promotion
  const needsPromotion = (from: Square, to: Square): boolean => {
    const piece = game.get(from as any);
    if (!piece || piece.type !== 'p') return false;
    
    const [fromRow] = getRowColFromNotation(from);
    const [toRow] = getRowColFromNotation(to);
    
    return (piece.color === 'w' && toRow === 0) || (piece.color === 'b' && toRow === 7);
  };

  // Make a move for the computer player
  const makeComputerMove = async () => {
    if (!isMounted.current) return;
    
    console.log("=== COMPUTER MOVE START ===");
    console.log("Current game state:", game.fen());
    console.log("Current player:", game.turn());
    
    // Only proceed if we're in computer mode and it's black's turn
    if (gameMode !== 'computer' || game.turn() !== 'b') {
      console.log("Not computer's turn to move or not in computer mode");
      return;
    }
    
    setIsThinking(true);
    
    try {
      // Add a small delay to simulate "thinking"
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isMounted.current) {
        console.log("Component unmounted during thinking");
        setIsThinking(false);
        return;
      }
      
      // Important: create a fresh game from the current state
      const currentFen = game.fen();
      console.log("Using FEN:", currentFen);
      
      // Get all legal moves for the current position
      const legalMoves = game.moves({ verbose: true });
      console.log("Legal moves for computer:", legalMoves);
      
      if (!legalMoves || legalMoves.length === 0) {
        console.log("No legal moves available for computer");
        setIsThinking(false);
        return;
      }
      
      // Select a move based on difficulty
      let selectedMove: any;
      
      if (difficulty === 'easy') {
        // Random move selection for easy difficulty
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        selectedMove = legalMoves[randomIndex];
        console.log("Easy difficulty: Random move selected:", selectedMove);
      } else {
        // Simple evaluation for medium and hard difficulties
        const evaluatedMoves = legalMoves.map((move: any) => {
          let score = 0;
          
          // Material value if capturing
          if (move.captured) {
            const pieceValues: Record<string, number> = {
              'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
            };
            score += pieceValues[move.captured] || 0;
          }
          
          // Clone game and make move to evaluate position
          try {
            const tempGame = new ChessJS(currentFen);
            const result = tempGame.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion || undefined
            });
            
            if (result) {
              // Bonus for check and checkmate
              if (tempGame.isCheck()) score += 0.5;
              if (tempGame.isCheckmate()) score += 100;
            }
          } catch (error) {
            console.error("Error evaluating move:", move, error);
          }
          
          return { move, score };
        });
        
        // Sort by score
        evaluatedMoves.sort((a, b) => b.score - a.score);
        console.log("Evaluated moves:", evaluatedMoves);
        
        if (difficulty === 'medium' && Math.random() < 0.3 && evaluatedMoves.length > 1) {
          // Sometimes pick sub-optimal move for medium difficulty
          const randomIndex = Math.floor(Math.random() * Math.min(3, evaluatedMoves.length));
          selectedMove = evaluatedMoves[randomIndex].move;
          console.log("Medium difficulty: Sub-optimal move selected:", selectedMove);
        } else {
          // Best move for hard difficulty
          selectedMove = evaluatedMoves[0].move;
          console.log("Hard/Medium difficulty: Best move selected:", selectedMove);
        }
      }
      
      if (!selectedMove) {
        console.error("Failed to select a move");
        setIsThinking(false);
        return;
      }
      
      console.log("Computer will play move:", selectedMove);
      
      // Prepare move object
      const moveObj = {
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: selectedMove.promotion || undefined
      };
      
      // IMPORTANT: Create a new chess instance to ensure we don't have stale state
      const newGame = new ChessJS(currentFen);
      console.log("New game created with FEN:", newGame.fen());
      
      // Try to make the move
      try {
        const result = newGame.move(moveObj);
        console.log("Move result:", result);
        
        if (!result) {
          console.error("Move failed:", moveObj);
          setIsThinking(false);
          return;
        }
        
        // Get the piece that was moved
        const movedPiece = {
          type: selectedMove.piece,
          color: 'b' as 'b' | 'w'
        };
        
        // Animate piece movement and play sound
        animatePieceMovement(selectedMove.from, selectedMove.to, movedPiece);
        
        if (selectedMove.captured) {
          playSoundEffect('capture');
        } else if (selectedMove.san && selectedMove.san.includes('O-O')) {
          playSoundEffect('castle');
        } else {
          playSoundEffect('move');
        }
        
        // Update game state after animation completes
        setTimeout(() => {
          if (!isMounted.current) return;
          
          // Update game with the new state
          setGame(newGame);
          console.log("Game state updated after computer move");
          
          // Update last move for highlighting
          setLastMove({
            from: selectedMove.from,
            to: selectedMove.to,
            promotion: selectedMove.promotion
          });
          
          // Add move to history
          setMoveHistory(prevHistory => [...prevHistory, selectedMove.san]);
          
          // Clear thinking state
          setIsThinking(false);
          console.log("=== COMPUTER MOVE COMPLETE ===");
        }, 500);
      } catch (error) {
        console.error("Error making move:", moveObj, error);
        setIsThinking(false);
      }
    } catch (error) {
      console.error("Error in computer move process:", error);
      setIsThinking(false);
    }
  };

  // Render the chessboard
  return (
    <div className={`${className} flex flex-col md:flex-row gap-6 ${isFullscreen ? 'fullscreen-mode fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Left column with chessboard */}
      <div className={`${isFullscreen ? 'w-full h-full flex flex-col' : 'flex-1'}`}>
        <Card className={`shadow-xl ${isFullscreen ? 'h-full flex flex-col' : ''}`} ref={boardRef}>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle>
                ChessLink Gameplay
                {isThinking && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    Computer thinking...
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  className="p-2"
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSound}
                  className="p-2"
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSpeech}
                  className="mr-2"
                  title={soundSettings.speech ? "Turn off move announcements" : "Turn on move announcements"}
                >
                  {soundSettings.speech ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                
                <Select
                  value={gameMode}
                  onValueChange={(value) => {
                    setGameMode(value as 'human' | 'computer');
                    resetGame();
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Game Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human vs Human</SelectItem>
                    <SelectItem value="computer">Human vs Computer</SelectItem>
                  </SelectContent>
                </Select>
                
                {gameMode === 'computer' && (
                  <Select
                    value={difficulty}
                    onValueChange={(value) => {
                      setDifficulty(value as 'easy' | 'medium' | 'hard');
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <CardDescription>
              {gameStatus || "Game ready to start"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className={`p-6 ${isFullscreen ? 'flex-grow flex items-center justify-center' : ''}`}>
            <div className={`relative ${isFullscreen ? 'max-h-full' : ''}`} style={{ width: isFullscreen ? '80vh' : '100%' }}>
              {/* Files (A-H) labels at the top */}
              <div className="grid grid-cols-8 pl-6 pr-6 mb-1">
                {Array(8).fill(0).map((_, i) => (
                  <div key={`file-top-${i}`} className="flex justify-center items-center h-6 text-sm font-medium text-gray-500">
                    {String.fromCharCode(97 + i)}
                  </div>
                ))}
              </div>
            
              <div className="flex">
                {/* Ranks (1-8) labels on the left */}
                <div className="flex flex-col justify-around pr-2">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={`rank-left-${i}`} className="flex justify-center items-center w-4 h-full text-sm font-medium text-gray-500">
                      {8 - i}
                    </div>
                  ))}
                </div>
                
                {/* Main chessboard */}
                <div className={`aspect-square w-full border-2 border-gray-700 rounded-sm shadow-lg relative ${isFullscreen ? 'max-h-[80vh]' : ''}`}>
                  <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                    {Array(8).fill(0).map((_, row) => 
                      Array(8).fill(0).map((_, col) => {
                        const index = row * 8 + col;
                        const isBlackSquare = (row + col) % 2 === 1;
                        const squareNotation = getRankFileNotation(row, col);
                        
                        // Get piece at this square
                        const piece = board[row]?.[col];
                        
                        // Check if this square is selected
                        const isSelected = selectedSquare === squareNotation;
                        
                        // Check if this is a legal move destination
                        const isLegalMove = legalMoves.includes(squareNotation);
                        
                        // Check if this square was part of the last move
                        const isLastMoveFrom = lastMove && lastMove.from === squareNotation;
                        const isLastMoveTo = lastMove && lastMove.to === squareNotation;
                        
                        return (
                          <div 
                            key={index}
                            className={`
                              relative flex items-center justify-center
                              ${isBlackSquare ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'}
                              ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''}
                              ${isLegalMove ? 'ring-4 ring-green-400 ring-opacity-50 ring-inset' : ''}
                              ${isLastMoveFrom ? 'bg-blue-200' : ''}
                              ${isLastMoveTo ? 'bg-blue-300' : ''}
                              cursor-pointer
                              transition-all duration-150 hover:brightness-110
                            `}
                            onClick={() => handleSquareClick(row, col)}
                            style={{ height: '100%', width: '100%' }}
                          >
                            {/* Regular piece (not animating) */}
                            {piece && !(
                              animatedPiece && 
                              row === animatedPiece.from.row && 
                              col === animatedPiece.from.col
                            ) && (
                              <ChessPiece piece={`${piece.color === 'b' ? piece.type.toLowerCase() : piece.type.toUpperCase()}`} />
                            )}
                            
                            {/* Legal move indicators */}
                            {isLegalMove && !piece && (
                              <div className="w-3 h-3 bg-green-500 rounded-full opacity-60"></div>
                            )}
                            
                            {/* Legal capture indicators */}
                            {isLegalMove && piece && (
                              <div className="absolute inset-0 ring-4 ring-red-500 ring-opacity-60 rounded-full"></div>
                            )}
                            
                            {/* Square coordinates in corner */}
                            <div className="absolute bottom-0.5 right-0.5 text-[8px] opacity-50">
                              {squareNotation}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Animated piece layer */}
                  {animatedPiece && (
                    <div 
                      className="absolute pointer-events-none transition-all duration-500 ease-in-out z-10"
                      style={{
                        width: `12.5%`,
                        height: `12.5%`,
                        left: `${animatedPiece.from.col * 12.5}%`,
                        top: `${animatedPiece.from.row * 12.5}%`,
                        transform: `translate(${(animatedPiece.to.col - animatedPiece.from.col) * 100}%, ${(animatedPiece.to.row - animatedPiece.from.row) * 100}%)`,
                      }}
                    >
                      <ChessPiece piece={animatedPiece.piece} isAnimated={true} />
                    </div>
                  )}
                </div>
                
                {/* Ranks (1-8) labels on the right */}
                <div className="flex flex-col justify-around pl-2">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={`rank-right-${i}`} className="flex justify-center items-center w-4 h-full text-sm font-medium text-gray-500">
                      {8 - i}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Files (A-H) labels at the bottom */}
              <div className="grid grid-cols-8 pl-6 pr-6 mt-1">
                {Array(8).fill(0).map((_, i) => (
                  <div key={`file-bottom-${i}`} className="flex justify-center items-center h-6 text-sm font-medium text-gray-500">
                    {String.fromCharCode(97 + i)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`mt-6 flex justify-center space-x-4 ${isFullscreen ? 'absolute bottom-4 left-0 right-0' : ''}`}>
              <Button
                variant="outline"
                onClick={resetGame}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                New Game
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Info size={16} />
                    Game Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Game Information</DialogTitle>
                    <DialogDescription>
                      Current game state and settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <h4 className="font-medium mb-2">Game Status</h4>
                    <p className="text-sm mb-4">{gameStatus || "Game in progress"}</p>
                    
                    <h4 className="font-medium mb-2">FEN Notation</h4>
                    <code className="block text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {game.fen()}
                    </code>
                    
                    <h4 className="font-medium mt-4 mb-2">Game Settings</h4>
                    <p className="text-sm">Mode: {gameMode === 'human' ? 'Human vs Human' : 'Human vs Computer'}</p>
                    {gameMode === 'computer' && (
                      <p className="text-sm">Difficulty: {difficulty}</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right column with move history - hide in fullscreen mode */}
      {!isFullscreen && (
        <div className="w-full md:w-64">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle>Move History</CardTitle>
              <CardDescription>
                {gameMode === 'human' ? 'Human vs Human' : `Human vs Computer (${difficulty})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {moveHistory.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">White</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Black</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="py-2 px-4 text-sm font-medium">
                            {moveHistory[i * 2]}
                          </td>
                          <td className="py-2 px-4 text-sm font-medium">
                            {moveHistory[i * 2 + 1] || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  No moves played yet
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t p-4 text-sm text-gray-500">
              <div className="flex items-center w-full justify-between">
                <span>Total moves: {moveHistory.length}</span>
                {currentPlayer === 'w' ? (
                  <Badge variant="outline">White to move</Badge>
                ) : (
                  <Badge variant="outline">Black to move</Badge>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Add CSS for fullscreen mode */}
      <style>{`
         .fullscreen-mode {
           background-color: rgba(255, 255, 255, 0.95);
           overflow: hidden;
         }
         
         @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
         }
         
         .fullscreen-mode .card {
           animation: fadeIn 0.3s ease-in-out;
         }
       `}</style>
    </div>
  );
};

export default Chess; 