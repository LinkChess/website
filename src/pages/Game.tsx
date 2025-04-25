import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess, Move, Piece } from "chess.js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Expand, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

// Safe Chessboard wrapper component to handle invalid FENs
const SafeChessboard: React.FC<{
  position: string;
  boardWidth: number;
  areArrowsAllowed: boolean;
  rawBoardState?: string | null;
}> = ({ position, boardWidth, areArrowsAllowed, rawBoardState }) => {
  const [safePosition, setSafePosition] = useState("start");
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  // When position prop changes, try to update safely
  useEffect(() => {
    try {
      // Validate FEN by attempting to create a Chess instance
      new Chess(position);
      setSafePosition(position);
      setIsUsingFallback(false);
    } catch (e) {
      console.warn("SafeChessboard: Invalid FEN position", position, e);
      // If we have a raw board state, use it directly
      if (rawBoardState) {
        setIsUsingFallback(true);
      } else {
        // Otherwise keep using previous valid position (or default "start")
        setIsUsingFallback(false);
      }
    }
  }, [position, rawBoardState]);
  
  // Parse raw board state for fallback display
  const renderRawBoard = () => {
    if (!rawBoardState) return null;
    
    // Split the FEN board representation into ranks
    const ranks = rawBoardState.split('/');
    if (ranks.length !== 8) {
      console.warn("Invalid raw board state format, expected 8 ranks:", rawBoardState);
    }
    
    return (
      <div className="chess-board" style={{width: boardWidth, height: boardWidth}}>
        {ranks.map((rank, rankIndex) => {
          const squares = [];
          let fileIndex = 0;
          
          // Process each character in the rank
          for (let i = 0; i < rank.length; i++) {
            const char = rank[i];
            
            // If it's a number, add that many empty squares
            if (/\d/.test(char)) {
              const emptyCount = parseInt(char, 10);
              for (let j = 0; j < emptyCount; j++) {
                squares.push({
                  key: `${rankIndex}-${fileIndex}`,
                  piece: null,
                  isLight: (rankIndex + fileIndex) % 2 === 0,
                  position: fileIndex
                });
                fileIndex++;
              }
            } else {
              // Add a piece square
              squares.push({
                key: `${rankIndex}-${fileIndex}`,
                piece: char,
                isLight: (rankIndex + fileIndex) % 2 === 0,
                position: fileIndex
              });
              fileIndex++;
            }
          }
          
          return (
            <div key={rankIndex} className="rank" style={{
              display: 'flex', 
              height: `${boardWidth/8}px`
            }}>
              {squares.map(square => (
                <div key={square.key} style={{
                  width: `${boardWidth/8}px`,
                  height: `${boardWidth/8}px`,
                  backgroundColor: square.isLight ? '#f0d9b5' : '#b58863',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${boardWidth/16}px`
                }}>
                  {square.piece && (
                    <span style={{color: /[A-Z]/.test(square.piece) ? 'white' : 'black'}}>
                      {mapPieceToUnicode(square.piece)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Map chess piece character to Unicode chess symbol
  const mapPieceToUnicode = (piece: string) => {
    const map: Record<string, string> = {
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
      'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
    };
    return map[piece] || piece;
  };
  
  return isUsingFallback && rawBoardState ? renderRawBoard() : (
    <Chessboard
      position={safePosition}
      boardWidth={boardWidth}
      areArrowsAllowed={areArrowsAllowed}
    />
  );
};

// Interface for move data from backend
interface MoveData {
  move_id: string;
  fen: string;
  player: string;
  timestamp: string;
  algebraic: string | null;
  uci: string | null;
  is_legal: boolean | null;
  piece_moved: string | null;
  from_square: string | null;
  to_square: string | null;
}

// Interface for game state data from backend
interface GameStateData {
  gameId: string;
  title: string;
  players: { white: string; black: string };
  status: string;
  position: string | null; // Last known FEN
  moveCount: number;
  viewerCount: number;
  // Assuming the backend might send the full history on request
  moves?: MoveData[]; 
}

// --- Web Audio API Sounds --- 
// /* // Temporarily commented out for debugging syntax errors
let audioContext: AudioContext | null = null;

const isAudioContextReady = (functionName: string): AudioContext | null => {
  const ctx = getAudioContext(); 
  if (!ctx) { 
    console.warn(`${functionName}: getAudioContext() returned null. Cannot play sound.`);
    return null;
  }
  return ctx; 
};

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      console.log("Attempting AudioContext Initialization...");
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("Context Initialized. State:", audioContext.state);
      audioContext.onstatechange = () => console.log("AudioContext state changed:", audioContext?.state);
    } catch (e) {
      console.error("Web Audio API is not supported", e);
      return null;
    }
  }

  if (audioContext.state === 'suspended') {
    console.log("getAudioContext: Context is suspended. Attempting resume...");
    audioContext.resume().catch(e => console.error("Error resuming AudioContext:", e));
    return null;
  }

  if (audioContext.state === 'running') {
    return audioContext;
  }

  console.warn(`getAudioContext: Context is not running (state: ${audioContext.state}).`);
  return null;
};

const playClickSound = () => {
  const functionName = "playClickSound";
  const ctx = isAudioContextReady(functionName);
  if (!ctx) return;

  console.log(`${functionName}: Context ready, attempting sound generation...`);
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.03);
    console.log(`${functionName}: Sound scheduled.`);
  } catch (error) {
    console.error(`${functionName}: Error during audio processing:`, error);
  }
};

// /* // Keep the rest commented // <-- REMOVE THIS START COMMENT
const calculateDistance = (fromSq: string | null, toSq: string | null): number | null => {
  if (!fromSq || !toSq || fromSq.length !== 2 || toSq.length !== 2) {
    return null;
  }
  try {
    const fileMap: { [key: string]: number } = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
    const rankMap: { [key: string]: number } = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 };
    const fromFile = fileMap[fromSq[0]];
    const fromRank = rankMap[fromSq[1]];
    const toFile = fileMap[toSq[0]];
    const toRank = rankMap[toSq[1]];
    if (fromFile === undefined || fromRank === undefined || toFile === undefined || toRank === undefined) {
      console.warn(`calculateDistance: Invalid square notation - from: ${fromSq}, to: ${toSq}`);
      return null;
    }
    const dx = toFile - fromFile;
    const dy = toRank - fromRank;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance;
  } catch (e) {
    console.error(`Error calculating distance between ${fromSq} and ${toSq}:`, e);
    return null;
  }
};

const playPieceSound = (pieceSymbol: string | null, distance: number | null = null) => {
  const functionName = "playPieceSound";
  const ctx = isAudioContextReady(functionName);
  if (!ctx) return;
  let baseFreq = 440, baseDuration = 0.1, baseVol = 0.2;
  let waveform: OscillatorType = 'sine';
  switch (pieceSymbol) {
    case 'P': baseFreq = 760; waveform = 'triangle'; baseDuration=0.07; baseVol=0.12; break;
    case 'N': baseFreq = 300; waveform = 'sawtooth'; baseDuration=0.15; baseVol=0.20; break;
    case 'B': baseFreq = 587; waveform = 'sine'; baseDuration=0.14; baseVol=0.18; break;
    case 'R': baseFreq = 240; waveform = 'square'; baseDuration=0.18; baseVol=0.25; break;
    case 'Q': baseFreq = 880; waveform = 'sine'; baseDuration=0.22; baseVol=0.22; break;
    case 'K': baseFreq = 150; waveform = 'square'; baseDuration=0.30; baseVol=0.30; break;
    default: waveform = 'sine'; baseFreq=110; baseDuration=0.05; baseVol=0.1; break;
  }
  let finalVol = baseVol;
  let finalDuration = baseDuration;
  if (distance !== null && distance > 0) {
      finalVol = Math.min(0.5, baseVol * (1 + distance * 0.05)); 
      finalDuration = Math.min(0.5, baseDuration + distance * 0.015);
      console.log(`${functionName}: Adjusted for distance ${distance.toFixed(2)} -> Vol: ${finalVol.toFixed(2)}, Duration: ${finalDuration.toFixed(2)}`);
  }
  console.log(`${functionName}: Playing sound for piece: ${pieceSymbol}`);
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    gainNode.gain.setValueAtTime(finalVol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + finalDuration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + finalDuration);
    console.log(`${functionName}: Sound scheduled for ${pieceSymbol}.`);
  } catch (error) { 
    console.error(`${functionName}: Error playing sound for ${pieceSymbol}:`, error);
  }
};

const playCheckSound = () => {
  const functionName = "playCheckSound";
  const ctx = isAudioContextReady(functionName);
  if (!ctx) return;
  console.log(`${functionName}: Playing check sound...`);
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1300, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
    console.log(`${functionName}: Check sound scheduled.`);
  } catch (error) {
    console.error(`${functionName}: Error during audio processing:`, error);
  }
};

const playCheckmateSound = () => {
  const functionName = "playCheckmateSound";
  const ctx = isAudioContextReady(functionName);
  if (!ctx) return;
  console.log(`${functionName}: Playing checkmate/game end sound...`);
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    console.log(`${functionName}: Checkmate sound scheduled.`);
  } catch (error) {
    console.error(`${functionName}: Error during audio processing:`, error);
  }
};

const playCaptureSound = (distance: number | null = null) => {
  const functionName = "playCaptureSound";
  const ctx = isAudioContextReady(functionName);
  if (!ctx) return;
  let baseVol = 0.4;
  let finalVol = baseVol;
  let baseDuration = 0.15;
  let finalDuration = baseDuration;
  if (distance !== null && distance > 0) {
      finalVol = Math.min(0.7, baseVol * (1 + distance * 0.08)); 
      finalDuration = Math.min(0.4, baseDuration + distance * 0.02);
      console.log(`${functionName}: Adjusted for distance ${distance.toFixed(2)} -> Vol: ${finalVol.toFixed(2)}, Duration: ${finalDuration.toFixed(2)}`);
  }
  console.log(`${functionName}: Playing capture sound...`);
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime); 
    gainNode.gain.setValueAtTime(finalVol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + finalDuration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + finalDuration);
    console.log(`${functionName}: Capture sound scheduled.`);
  } catch (error) {
    console.error(`${functionName}: Error during audio processing:`, error);
  }
};

const countPieces = (board: (Piece | null)[][]): number => {
  return board.flat().filter(piece => piece !== null).length;
};
// */ // <-- Re-add closing comment tag
// --- End Sounds ---

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [gameTitle, setGameTitle] = useState("Loading Game...");
  const [playerWhite, setPlayerWhite] = useState("-");
  const [playerBlack, setPlayerBlack] = useState("-");
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(1);
  const [moveHistory, setMoveHistory] = useState<MoveData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [statusText, setStatusText] = useState("Connecting...");
  
  // Add new state for raw board FEN
  const [rawBoardState, setRawBoardState] = useState<string | null>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for new buttons
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const boardContainerRef = useRef<HTMLDivElement>(null); // Keep ref definition
  // Ref to store the piece count of the previous position
  const previousPieceCountRef = useRef<number | null>(null);

  // Function to fetch raw board state
  const fetchRawBoardState = () => {
    if (socketRef.current && isConnected) {
      console.log("Requesting raw board state");
      socketRef.current.emit('get_raw_board_state');
    }
  };

  useEffect(() => {
    if (!gameId) {
      toast.error("No game ID provided");
      // Optionally navigate back or show an error page
      return;
    }

    // --- Modified WebSocket Connection ---
    // Use environment variable for URL, fallback for local dev
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8765';
    console.log(`Connecting WebSocket to: ${SOCKET_URL}`); // Log the URL being used

    // Establish WebSocket connection
    const socket = io(SOCKET_URL, {
        transports: ['websocket'] // Explicitly use websockets
    });
    socketRef.current = socket;
    // --- End Modified WebSocket Connection ---
    
    console.log(`Attempting to connect for game: ${gameId}`);
    toast.info(`Connecting to game ${gameId}...`);
    setStatusText("Connecting...");

    socket.on('connect', () => {
      console.log('Connected to WebSocket server.');
      setIsConnected(true);
      setStatusText("Fetching game state...");
      toast.success("Connected! Requesting game state...");
      // Request the specific game state
      socket.emit('get_game_state', { gameId });
      // Initial fetch of raw board state
      fetchRawBoardState();
      // Reset piece count on new connection/state fetch
      previousPieceCountRef.current = null; 
    });

    // Add handler for raw board state response
    socket.on('raw_board_state', (data: { status: string, boardState?: string, message?: string }) => {
      console.log('Received raw_board_state:', data);
      if (data.status === 'success' && data.boardState) {
        setRawBoardState(data.boardState);
      } else if (data.status === 'error') {
        console.error('Error fetching raw board state:', data.message);
        // Don't show toast for this error to avoid spam
      }
    });

    socket.on('game_state', (data: GameStateData) => {
      console.log('Received game_state:', data);
      if (data.gameId === gameId) {
        setGameTitle(data.title || 'Live Game');
        setPlayerWhite(data.players?.white || 'White');
        setPlayerBlack(data.players?.black || 'Black');
        setIsLive(data.status === 'active');
        setViewerCount(data.viewerCount || 1);
        
        if (data.position) {
          try {
             const loadedGame = new Chess(data.position);
             setGame(loadedGame); 
             setStatusText(getGameStatus(loadedGame));
             // Initialize piece count from game state
             // previousPieceCountRef.current = countPieces(loadedGame.board()); // Commented out as countPieces is also commented
             console.log("Initial piece count logic commented out."); // Added log for clarity
          } catch (e) {
              console.error("Error loading FEN from game_state:", data.position, e);
              toast.error("Received invalid board position from server.");
              setStatusText("Error loading position");
              previousPieceCountRef.current = null; // Reset on error
          }
        } else {
           previousPieceCountRef.current = null; // No position, no count
        }
        // Assuming backend might send full history with game_state
        if (data.moves && data.moves.length > 0) {
          setMoveHistory(data.moves);
        } else {
           setMoveHistory([]); // Reset history if none provided
        }
        toast.success("Game state loaded!");
      } else {
         console.warn('Received game_state for wrong gameId', data.gameId);
      }
    });

    socket.on('position', (data: MoveData & { gameId: string }) => {
      if (data.gameId === gameId) {
        console.log('Received position update:', data);
        // let wasCapture = false; // Declared inside the commented block now
        // let distance: number | null = null;

        try {
            const updatedGame = new Chess(data.fen);
            
            // --- Capture Detection --- 
            /* // Ensure countPieces call is also commented // <-- Remove comment tag // <-- REMOVE THIS COMMENT BLOCK */
            let wasCapture = false; // Define here if needed outside sound logic
            const currentPieceCount = countPieces(updatedGame.board()); // This line is commented out // <-- Keep uncommented
            console.log("Current piece count:", currentPieceCount, "Previous:", previousPieceCountRef.current);
            if (previousPieceCountRef.current !== null && currentPieceCount < previousPieceCountRef.current) {
                wasCapture = true;
                console.log("Capture detected!");
      }
            previousPieceCountRef.current = currentPieceCount; 
            /* // <-- Remove comment tag // <-- REMOVE THIS COMMENT BLOCK */
            // --- End Capture Detection ---

            // --- Calculate Distance --- 
            /* // calculateDistance call is also commented out // <-- Remove comment tag // <-- REMOVE THIS COMMENT BLOCK */
            let distance: number | null = null;
            distance = calculateDistance(data.from_square, data.to_square);
            /* // <-- Remove comment tag // <-- REMOVE THIS COMMENT BLOCK */
            // --- End Distance Calculation ---

            setGame(updatedGame);
            setMoveHistory(prev => [...prev, data]);
            setStatusText(getGameStatus(updatedGame));
            
            // --- Sound Logic --- 
            /* // All sound logic commented out // <-- Remove comment tag // <-- Remove this tag again? // <-- Remove this tag again? */ // <-- Keep this start comment
            if (!isMuted) {
              if (updatedGame.isCheckmate()) {
                 playCheckmateSound(); // <-- Keep uncommented
              } else if (updatedGame.isCheck()) {
                 playCheckSound(); // <-- Keep uncommented
              } else if (wasCapture) { 
                 playCaptureSound(distance); // <-- Keep uncommented
              } else {
                 playPieceSound(data.piece_moved, distance); // <-- Keep this uncommented
              }
            }
            /* // <-- Remove comment tag // <-- Remove this tag again? // <-- Remove this tag again? */ // <-- Keep this end comment
            // --- End Sound Logic ---

        } catch (e) {
            console.error("Error loading FEN from position update:", data.fen, e);
            toast.error("Received invalid board position update.");
        }
      } else { /* ignore */ }
    });
    
    socket.on('game_ended', (data: { gameId: string }) => {
        if (data.gameId === gameId) {
            console.log('Received game_ended event');
            setIsLive(false);
            setStatusText("Game Ended");
            toast.info("Game has ended");
            // Play end sound if not muted
            /* // Commented out as playCheckmateSound is also commented // <-- Remove comment tag */ // <-- Remove this start comment
            if (!isMuted) {
                playCheckmateSound(); // Reuse checkmate sound for game end // <-- Keep uncommented
            }
            /* // <-- Remove comment tag */ // <-- Remove this end comment
            previousPieceCountRef.current = null; // Reset on game end
        }
    });
    
    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Connection Error:', err);
      setIsConnected(false);
      setStatusText("Connection Failed");
      toast.error("Connection failed. Is the server running?");
      socketRef.current = null;
      previousPieceCountRef.current = null; // Reset count
    });
          
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
      setIsConnected(false);
      setStatusText("Disconnected");
      toast.error("Disconnected from live game server");
      socketRef.current = null;
      previousPieceCountRef.current = null; // Reset count
    });
    
    // Handle general errors from server
    socket.on('error', (data: { message: string }) => {
        console.error('Server Error:', data.message);
        toast.error(`Server error: ${data.message}`);
    });
    
    // Cleanup on component unmount
    return () => {
      console.log('Disconnecting socket...');
      socket.disconnect();
      socketRef.current = null;
      toast.info("Left game view");
      previousPieceCountRef.current = null; // Reset count
      
      // Clear the fetch interval
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // REMOVED isMuted dependency

  // Set up periodic fetching of raw board state
  useEffect(() => {
    if (isConnected) {
      // Initial fetch
      fetchRawBoardState();
      
      // Set up interval for periodic fetching (every 2 seconds)
      fetchIntervalRef.current = setInterval(fetchRawBoardState, 2000);
      
      return () => {
        if (fetchIntervalRef.current) {
          clearInterval(fetchIntervalRef.current);
          fetchIntervalRef.current = null;
        }
      };
    }
  }, [isConnected]);

  // Function to create a valid FEN from the raw board state
  const createFenFromRawBoard = (rawBoard: string): string => {
    // Add missing parts of FEN to make it valid for chess.js
    // Default to white's turn, no castling rights, no en passant
    return `${rawBoard} w - - 0 1`;
  };

  // Function to get the board position to display
  const getBoardPosition = (): string => {
    if (rawBoardState) {
      try {
        // Convert raw board state to valid FEN - will be used only for display
        const validFen = createFenFromRawBoard(rawBoardState);
        // Try to validate with chess.js
        new Chess(validFen);
        return validFen;
      } catch (e) {
        console.warn("Invalid board state FEN:", rawBoardState, e);
        // For invalid FENs, still return it for display purposes
        // Add valid FEN parts to make react-chessboard happy
        return createFenFromRawBoard(rawBoardState);
      }
    }
    // Fall back to the game's FEN if no raw board state
    return game.fen();
  };

  // Function to get game status text from a Chess instance
  const getGameStatus = (board: Chess) => {
    if (!isLive) return "Game Ended";
    if (board.isCheckmate()) return "Checkmate";
    if (board.isDraw()) return "Draw";
    if (board.isStalemate()) return "Stalemate";
    if (board.isThreefoldRepetition()) return "Draw by repetition";
    if (board.isInsufficientMaterial()) return "Draw by insufficient material";
    if (board.isCheck()) return "Check";
    return board.turn() === "w" ? "White to move" : "Black to move";
  };

  // --- Button Handlers ---
  const handleExpandClick = () => {
    console.log("Expand button clicked");
    playClickSound();
    if (boardContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        boardContainerRef.current.requestFullscreen().catch(err => {
          toast.error(`Fullscreen error: ${err.message}`);
        });
      }
    } else {
       toast.warning("Board container element not found for fullscreen.");
    }
  };

  const handleSoundToggle = () => {
    console.log("Sound toggle clicked");
    playClickSound();
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Game Sounds ON 🔊" : "Game Sounds OFF 🔇");
  };

  const handleMicToggle = () => {
    console.log("Mic toggle clicked");
    playClickSound();
    setIsMicOn(!isMicOn);
    toast.info(isMicOn ? "Mic OFF 🎤" : "Mic ON (Placeholder) 🎙️");
  };
  // --- End Button Handlers ---

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/live")} className="mb-4">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Live Games
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Live Game</h1>
        {/* <p className="text-muted-foreground">Game ID: {gameId}</p> */}
            <div className="mt-2 flex justify-center items-center gap-2 flex-wrap">
              <Badge variant={isLive ? "default" : "outline"} className={isLive ? "bg-green-600" : "bg-gray-500"}>
                {isLive ? "Live" : "Ended"}
              </Badge>
          <Badge variant="outline">{viewerCount} watching</Badge>
              <Badge variant={isConnected ? "secondary" : "destructive"}>
                 {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
        </div>
      </div>
      
      {/* Main Content Grid (Now 5 Columns) */}
      <div className="grid md:grid-cols-5 gap-6"> 
        
        {/* Left Column: Game Info */}
        <div className="md:col-span-1">
          {/* <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm mb-1">Players</h3>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <div className="w-2.5 h-2.5 bg-white border border-black rounded-full flex-shrink-0"></div>
                    <span className="truncate">{playerWhite}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 bg-black rounded-full flex-shrink-0"></div>
                    <span className="truncate">{playerBlack}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-sm mb-1">Status</h3>
                  <p className="text-sm">{statusText}</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
          
          <div className="mt-6"></div>
        
          {/* Live Insights Card (Placeholder) */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Live Insights</CardTitle>
              <CardDescription>AI-powered analysis (coming soon!)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground h-[190px]">
                 <p>✨ White has a slight advantage after Nf3.</p>
                 <p>💡 Consider developing the queenside knight.</p>
                 <p>🤔 Black's last move (a6) creates space but weakens b6.</p>
                 <p>⚡ Tempo is currently with White.</p>
                 <p>📊 Material balance looks even</p>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Center Column: Chessboard + Controls */}
        <div className="md:col-span-3 flex flex-col"> 
          <Card className="flex-grow" ref={boardContainerRef}> 
            <CardContent className="p-2 sm:p-4 flex justify-center items-center h-full"> 
              <div className="max-w-[560px] w-full bg-white"> 
                <SafeChessboard 
                  position={getBoardPosition()} 
                  boardWidth={560} 
                  areArrowsAllowed={false}
                  rawBoardState={rawBoardState}
                />
              </div>
            </CardContent>
          </Card>
          {/* Raw Board State Display */}
          {rawBoardState && (
            <div className="mt-2 p-2 text-xs text-center bg-gray-100 rounded">
              <span className="font-mono">Raw Board: {rawBoardState}</span>
            </div>
          )}
          {/* Control Buttons Below Board */}
          <div className="flex justify-center items-center gap-3 mt-4 p-2 bg-gray-100 rounded-md">
             <Button variant="outline" size="icon" onClick={handleExpandClick} title="Toggle Fullscreen">
                 <Expand className="h-5 w-5" />
             </Button>
             <button 
                onClick={handleSoundToggle} 
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
             >
                 {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
             </button>
             <button 
                onClick={handleMicToggle} 
                title={isMicOn ? "Turn Mic Off" : "Turn Mic On"}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
             >
                 {isMicOn ? <Mic className="h-5 w-5 text-red-600" /> : <MicOff className="h-5 w-5" />}
             </button>
          </div>
        </div>
        
        {/* Right Column: Move History + Insights (Spans 1 Column) */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Move history Card */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Move History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[495px] overflow-y-auto pr-2">
                {moveHistory.length > 1 ? (
                  <ol className="list-none space-y-1">
                    {Array.from({ length: Math.ceil((moveHistory.length -1) / 2) }).map((_, pairIndex) => {
                      const whiteMoveIndex = pairIndex * 2 + 1;
                      const blackMoveIndex = whiteMoveIndex + 1;
                      const whiteMove = moveHistory[whiteMoveIndex]; 
                      const blackMove = moveHistory[blackMoveIndex]; 
                      
                      if (!whiteMove) return null; 
                      
                      return (
                        <li key={pairIndex} className="flex items-baseline text-xs sm:text-sm">
                          <span className="w-6 text-right mr-2 text-muted-foreground font-mono">{pairIndex + 1}.</span>
                          <span className="flex-1 font-mono font-medium mr-2 truncate">{whiteMove?.algebraic || '...'}</span>
                          {blackMove && (
                            <span className="flex-1 font-mono text-gray-700 truncate">{blackMove.algebraic}</span>
                          )}
                          {!blackMove && <span className="flex-1"></span>}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {isConnected ? "Waiting for moves..." : "Not connected"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card> */}
          
        </div>
        
      </div>
    </div>
  );
};

export default GamePage; 