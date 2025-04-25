import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";
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

// --- Web Audio API Click Sound --- 
let audioContext: AudioContext | null = null;
const playClickSound = () => {
  console.log("playClickSound called"); // Log entry
  try {
    // Ensure AudioContext is initialized (usually best after first user gesture)
    if (!audioContext) {
      console.log("Initializing AudioContext...");
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext state after init:", audioContext?.state);
    }
    
    // If context exists but is suspended, try resuming it
    if (audioContext && audioContext.state === 'suspended') {
      console.log("AudioContext suspended, attempting resume...");
      audioContext.resume().then(() => {
        console.log("AudioContext resumed successfully.");
        // Optionally try playing sound again *after* resume, but for a simple click, 
        // resuming might be enough for the *next* click.
      }).catch(e => console.error("Error resuming AudioContext:", e));
      // Don't try to play sound immediately after resume, might not work yet.
      return; 
    }

    if (!audioContext || audioContext.state !== 'running') {
       console.warn("AudioContext not running or not available. State:", audioContext?.state);
       return;
    }

    console.log("AudioContext is running, creating sound nodes...");
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Higher pitch A5
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Slightly lower volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    console.log("Starting sound playback...");
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
    console.log("Sound playback finished scheduling.");

  } catch (e) {
      console.error("Error in playClickSound:", e);
      // Reset context if error occurred?
      // audioContext = null;
  }
};
// --- End Sound --- 

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
          } catch (e) {
              console.error("Error loading FEN from game_state:", data.position, e);
              toast.error("Received invalid board position from server.");
              // Keep the default board
              setStatusText("Error loading position");
          }
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
      // Check if the position update is for THIS game
      if (data.gameId === gameId) {
        console.log('Received position update:', data);
        try {
            const updatedGame = new Chess(data.fen); // Load new FEN
            setGame(updatedGame);
            setMoveHistory(prev => [...prev, data]); // Add new move to history
            setStatusText(getGameStatus(updatedGame));
            // Maybe update viewer count if included?
        } catch (e) {
            console.error("Error loading FEN from position update:", data.fen, e);
            toast.error("Received invalid board position update.");
        }
      } else {
         // console.log('Ignoring position update for other game', data.gameId);
      }
    });
    
    socket.on('game_ended', (data: { gameId: string }) => {
        if (data.gameId === gameId) {
            console.log('Received game_ended event');
            setIsLive(false);
            setStatusText("Game Ended");
            toast.info("Game has ended");
        }
    });
    
    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Connection Error:', err);
      setIsConnected(false);
      setStatusText("Connection Failed");
      toast.error("Connection failed. Is the server running?");
      socketRef.current = null;
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
      setIsConnected(false);
      setStatusText("Disconnected");
      toast.error("Disconnected from live game server");
      socketRef.current = null;
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // Re-run effect only if gameId changes

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
    toast.info(isMuted ? "Sound ON 🔊" : "Sound OFF 🔇");
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