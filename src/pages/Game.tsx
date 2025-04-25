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
let audioContext: AudioContext | null = null;

// Function to initialize/resume AudioContext safely
const getAudioContext = (): AudioContext | null => {
  // 1. Initialize if needed
  if (!audioContext) {
    try {
      console.log("Initializing AudioContext...");
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext state after init:", audioContext?.state);
      // Add event listener for state change to handle resume automatically after user interaction
      audioContext.onstatechange = () => {
        console.log("AudioContext state changed:", audioContext?.state);
      };
    } catch (e) {
      console.error("Web Audio API is not supported in this browser", e);
      return null; // Return null if initialization fails
    }
  }

  // 2. Attempt to resume if suspended (often needs user interaction first)
  if (audioContext.state === 'suspended') {
    console.log("AudioContext suspended, attempting resume...");
    // Attempt resume, but don't rely on it immediately
    audioContext.resume().catch(e => console.error("Error resuming AudioContext:", e));
    // Return null for now, as resume is async and might fail. 
    // Subsequent calls might succeed after user interaction.
    return null; 
  }
  
  // 3. Check if running *after* potential initialization/resume attempt
  if (audioContext.state !== 'running') {
     console.warn("AudioContext not running. State:", audioContext.state);
     return null; // Return null if not running
  }
  
  // 4. If running, return the context
  // console.log("AudioContext is running."); // Optional: confirmation log
  return audioContext; 
};

// Simple UI Click Sound
const playClickSound = () => {
  console.log("Attempting to play click sound...");
  const ctx = getAudioContext();

  // Check 1: Is the context available at all?
  if (!ctx) {
    console.warn("playClickSound: AudioContext is null or unsupported. Cannot play sound.");
    return; // Exit function if context cannot be obtained
  }

  // Check 2: Is the context running?
  if (ctx.state !== 'running') {
    console.warn(`playClickSound: AudioContext is not running (state: ${ctx.state}). Attempting resume might be needed via user interaction.`);
    // We don't try to play sound if not running, as it will likely fail.
    // Resume is handled by getAudioContext, but might need a user click first.
    return; // Exit function if context is not running
  }

  // Context is available and running, proceed with sound generation.
  console.log(`playClickSound: Context state is '${ctx.state}'. Proceeding with try block.`);
  try {
    // --- Sound Generation --- 
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    console.log("playClickSound: Starting oscillator...");
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
    console.log("playClickSound: Oscillator scheduled to stop.");
    // --- End Sound Generation --- 

  } catch (error) {
    console.error("playClickSound: Error during audio processing:", error);
  }
};

// Placeholder piece sounds
const playPieceSound = (pieceSymbol: string | null) => {
  console.log(`Playing sound for piece: ${pieceSymbol}`);
  const ctx = getAudioContext();
  if (!ctx) {
    console.warn(`Cannot play piece sound [${pieceSymbol}]: AudioContext not available/running.`);
    return;
  }
  let freq = 440; 
  let waveform: OscillatorType = 'sine';
  let duration = 0.1;
  let vol = 0.2;

  switch (pieceSymbol) {
    case 'P': freq = 660; waveform = 'triangle'; duration=0.08; vol=0.15; break;
    case 'N': freq = 330; waveform = 'sawtooth'; duration=0.12; vol=0.25; break;
    case 'B': freq = 523; waveform = 'sine'; duration=0.15; vol=0.2; break;
    case 'R': freq = 261; waveform = 'square'; duration=0.18; vol=0.3; break;
    case 'Q': freq = 784; waveform = 'sine'; duration=0.25; vol=0.25; break;
    case 'K': freq = 164; waveform = 'square'; duration=0.3; vol=0.35; break;
    default: waveform = 'sine'; freq=110; duration=0.05; vol=0.1; break;
  }
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(vol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) { console.error(`Error playing sound for ${pieceSymbol}:`, e); }
};

// New Game Move Sound 
const playMoveSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'square'; // Different waveform
    oscillator.frequency.setValueAtTime(220, ctx.currentTime); // Lower pitch (A3)
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) { console.error("Error playing move sound:", e); }
};

// New Check Sound
const playCheckSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.setValueAtTime(1300, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.15);
  } catch (e) { console.error("Error playing check sound:", e); }
};

// New Checkmate/Game End Sound
const playCheckmateSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.error("Error playing checkmate sound:", e); }
};

// New Capture Sound ("Explosion")
const playCaptureSound = () => {
  console.log("Playing CAPTURE sound");
  const ctx = getAudioContext();
  if (!ctx) {
    console.warn("Cannot play capture sound: AudioContext not available/running.");
    return;
  }
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Low frequency, sawtooth wave for a rougher sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime); // Start low
    // Quick drop in frequency
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25); 

    // Higher initial volume, quick decay
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime); // Louder than normal move
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); 

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) { console.error("Error playing capture sound:", e); }
};

// Helper function to count pieces on the board
const countPieces = (board: (Piece | null)[][]): number => {
  return board.flat().filter(piece => piece !== null).length;
};

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
  
  // State for new buttons
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const boardContainerRef = useRef<HTMLDivElement>(null); // Keep ref definition
  // Ref to store the piece count of the previous position
  const previousPieceCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameId) {
      toast.error("No game ID provided");
      // Optionally navigate back or show an error page
      return;
    }

    // Establish WebSocket connection
    const socket = io('http://localhost:8765');
    socketRef.current = socket;
    
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
      // Reset piece count on new connection/state fetch
      previousPieceCountRef.current = null; 
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
             // Load the latest position into the chess object
             const loadedGame = new Chess(data.position);
             setGame(loadedGame); 
             setStatusText(getGameStatus(loadedGame));
             // Initialize piece count from game state
             previousPieceCountRef.current = countPieces(loadedGame.board()); 
             console.log("Initial piece count:", previousPieceCountRef.current);
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
        let wasCapture = false; // Flag to track if the move was a capture

        try {
            const updatedGame = new Chess(data.fen);
            
            // --- Capture Detection ---
            const currentPieceCount = countPieces(updatedGame.board());
            console.log("Current piece count:", currentPieceCount, "Previous:", previousPieceCountRef.current);
            if (previousPieceCountRef.current !== null && currentPieceCount < previousPieceCountRef.current) {
                wasCapture = true;
                console.log("Capture detected!");
            }
            // Update the ref for the next move
            previousPieceCountRef.current = currentPieceCount; 
            // --- End Capture Detection ---

            setGame(updatedGame);
            setMoveHistory(prev => [...prev, data]);
            setStatusText(getGameStatus(updatedGame));
            
            // --- Sound Logic ---
            if (!isMuted) {
              if (updatedGame.isCheckmate()) {
                 playCheckmateSound();
              } else if (updatedGame.isCheck()) {
                 playCheckSound();
              } else if (wasCapture) { // Play capture sound if detected
                 playCaptureSound(); 
              } else {
                 // Play regular sound based on the moved piece
                 playPieceSound(data.piece_moved);
              }
            }
            // --- End Sound Logic ---

        } catch (e) {
            console.error("Error loading FEN from position update:", data.fen, e);
            toast.error("Received invalid board position update.");
            // Consider resetting piece count on error?
            // previousPieceCountRef.current = null; 
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
            if (!isMuted) {
                playCheckmateSound(); // Reuse checkmate sound for game end
            }
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // REMOVED isMuted dependency

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
    // Still play UI click sound regardless of game mute state
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
            <h1 className="text-3xl font-bold">{gameTitle}</h1>
        <p className="text-muted-foreground">Game ID: {gameId}</p>
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
          <Card>
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
          </Card>
          
          <div className="mt-6"></div>
        
          {/* Live Insights Card (Placeholder) */}
          <Card>
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
                 {/* Add more dummy insights */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Chessboard + Controls */}
        <div className="md:col-span-3 flex flex-col"> 
          <Card className="flex-grow" ref={boardContainerRef}> 
            <CardContent className="p-2 sm:p-4 flex justify-center items-center h-full"> 
              <div className="max-w-[560px] w-full bg-white"> 
                <Chessboard 
                  position={game.fen()} 
                  boardWidth={560} 
                  areArrowsAllowed={false}
                />
              </div>
            </CardContent>
          </Card>
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
          <Card>
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
          </Card>
          
        </div>
        
      </div>
    </div>
  );
};

export default GamePage; 