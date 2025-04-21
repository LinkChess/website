import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  ArrowDownToLine, 
  ExternalLink,
  PlayCircle, 
  CircleOff
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Connect = () => {
  const [game, setGame] = useState(new Chess());
  const [pgn, setPgn] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLiveGame, setIsLiveGame] = useState(false);
  const [lastMove, setLastMove] = useState("");
  const [gameId, setGameId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const webSocketRef = useRef<WebSocket | null>(null);
  const [dataFlow, setDataFlow] = useState<string[]>([]);
  const [leds, setLeds] = useState({ whitePlayer: false, blackPlayer: false });
  const navigate = useNavigate();

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    toast.info("Attempting to connect to ChessLink server...");
    addLogEntry("Connecting to ChessLink server...");

    try {
      const ws = new WebSocket('ws://localhost:8765');
      
      ws.onopen = () => {
        setIsConnected(true);
        addLogEntry("✅ WebSocket connected");
        toast.success("Connected to ChessLink server");
        webSocketRef.current = ws;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "info") {
            addLogEntry(`ℹ️ ${data.message}`);
          } else if (data.type === "position") {
            processPosition(data.fen);
          } else if (data.type === "error") {
            addLogEntry(`❌ Error: ${data.message}`);
            toast.error(data.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          addLogEntry(`❌ Error parsing message: ${error.message}`);
        }
      };
      
      ws.onerror = () => {
        setIsConnected(false);
        addLogEntry("❌ WebSocket connection error");
        toast.error("Connection error. Is the ChessLink server running?");
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        if (isLiveGame) {
          addLogEntry("❌ Lost connection to ChessLink server");
          toast.error("Lost connection to ChessLink server");
        } else {
          addLogEntry("WebSocket connection closed");
        }
        webSocketRef.current = null;
      };
    } catch (error) {
      addLogEntry(`❌ Failed to connect: ${error.message}`);
      toast.error(`Failed to connect: ${error.message}`);
    }
  };

  // Process a position update from WebSocket
  const processPosition = (fen: string) => {
    if (!fen || typeof fen !== 'string' || !fen.includes('/')) {
      console.error("Invalid FEN received:", fen);
      return;
    }

    try {
      // Create a new Chess instance with the FEN
      const newGame = new Chess(fen);
      
      // Update game state
      setGame(newGame);
      setPgn(newGame.pgn());
      
      // Determine last move by comparing history
      const history = newGame.history();
      if (history.length > 0) {
        setLastMove(history[history.length - 1]);
      }
      
      // Check whose turn it is and update LEDs
      const turnColor = fen.split(' ')[1];
      setLeds({
        whitePlayer: turnColor === 'w',
        blackPlayer: turnColor === 'b'
      });
      
      addLogEntry(`New position received: ${turnColor === 'w' ? 'White' : 'Black'} to move`);
    } catch (error) {
      console.error("Error processing position:", error);
      addLogEntry(`❌ Error processing position: ${error.message}`);
    }
  };

  // Start a live game
  const startLiveGame = () => {
    if (!isConnected) {
      toast.error("Please connect to the ChessLink server first");
      return;
    }

    // Reset game state
    setGame(new Chess());
    setPgn("");
    setLastMove("");
    setIsLiveGame(true);
    
    // Generate a random game ID
    const newGameId = Math.random().toString(36).substring(2, 10);
    setGameId(newGameId);
    
    // Create shareable URL
    const url = `${window.location.origin}/game/${newGameId}`;
    setShareUrl(url);
    
    addLogEntry(`Started new live game with ID: ${newGameId}`);
    toast.success("Live game started!");
    
    // Send start game command to server if needed
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        command: "start_game",
        game_id: newGameId
      }));
    }
  };

  // Stop the live game
  const stopLiveGame = () => {
    setIsLiveGame(false);
    addLogEntry("Live game stopped");
    toast.info("Live game stopped");
    
    // Send stop game command to server if needed
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        command: "stop_game",
        game_id: gameId
      }));
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    
    setIsConnected(false);
    setIsLiveGame(false);
    addLogEntry("Disconnected from ChessLink server");
    toast.info("Disconnected from ChessLink server");
  };

  // Save the current game to the demo library
  const saveToDemoLibrary = () => {
    // Save the PGN to localStorage
    if (pgn) {
      localStorage.setItem("savedPgn", pgn);
      addLogEntry("Game saved to demo library");
      toast.success("Game saved to demo library!");
      
      // Redirect to demo page
      navigate("/demo");
    } else {
      toast.error("No game data to save");
    }
  };

  // Add log entry to data flow
  const addLogEntry = (entry: string) => {
    setDataFlow(prev => [entry, ...prev].slice(0, 10));
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  // Get game status text
  const getGameStatus = () => {
    if (game.isCheckmate()) return "Checkmate";
    if (game.isDraw()) return "Draw";
    if (game.isStalemate()) return "Stalemate";
    if (game.isThreefoldRepetition()) return "Draw by repetition";
    if (game.isInsufficientMaterial()) return "Draw by insufficient material";
    if (game.isCheck()) return "Check";
    return game.turn() === "w" ? "White's turn" : "Black's turn";
  };

  // Open the game in a new tab for viewing
  const openGameView = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ChessLink Live Game Connection</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Chessboard */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Live Game Board</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className={isConnected ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isLiveGame && (
                    <Badge variant="default" className="bg-blue-600">
                      Live
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {isLiveGame ? `Game Status: ${getGameStatus()}` : "Connect to ChessLink server to start a live game"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="aspect-square max-w-md mx-auto">
                <Chessboard 
                  position={game.fen()} 
                  boardWidth={350}
                  areArrowsAllowed={false}
                />
              </div>
              
              {/* Player indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${leds.whitePlayer ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className={`${leds.whitePlayer ? 'font-medium' : ''}`}>
                    White Player {leds.whitePlayer ? '(Active)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${leds.blackPlayer ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className={`${leds.blackPlayer ? 'font-medium' : ''}`}>
                    Black Player {leds.blackPlayer ? '(Active)' : ''}
                  </span>
                </div>
              </div>
              
              {/* Connection controls */}
              <div className="flex flex-wrap gap-2 justify-center">
                {!isConnected ? (
                  <Button onClick={connectWebSocket}>
                    Connect to ChessLink
                  </Button>
                ) : (
                  <>
                    <Button onClick={disconnect} variant="outline">
                      <CircleOff className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                    
                    {!isLiveGame ? (
                      <Button onClick={startLiveGame}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Live Game
                      </Button>
                    ) : (
                      <>
                        <Button onClick={stopLiveGame} variant="outline">
                          Stop Game
                        </Button>
                        <Button onClick={saveToDemoLibrary} variant="secondary">
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Save to Demo
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Live game share options */}
              {isLiveGame && shareUrl && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Share this live game:</h3>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={shareUrl} 
                      readOnly 
                      className="flex-1 p-2 text-sm bg-white border rounded-md" 
                    />
                    <Button size="sm" onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard!");
                    }}>
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={openGameView}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Anyone with this link can watch your game in real-time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Data and Log */}
        <div className="space-y-6">
          {/* PGN Data Card */}
          <Card>
            <CardHeader>
              <CardTitle>Game PGN</CardTitle>
              <CardDescription>
                The live game's PGN notation is updated in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                placeholder="PGN will appear here when a live game is in progress..."
                className="min-h-[150px] font-mono text-sm"
                readOnly={isLiveGame}
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(pgn);
                  toast.success("PGN copied to clipboard");
                }}
                variant="outline"
                className="w-full"
                disabled={!pgn}
              >
                Copy PGN
              </Button>
            </CardFooter>
          </Card>
          
          {/* Data Flow Card */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Log</CardTitle>
              <CardDescription>
                Real-time data flow from the ChessLink hardware
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-3 bg-black text-green-400 font-mono h-[220px] overflow-y-auto space-y-2">
                {dataFlow.length > 0 ? (
                  dataFlow.map((entry, i) => (
                    <div key={i} className="flex">
                      <span className="opacity-60 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      <span>{entry}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center opacity-60 h-full flex items-center justify-center">
                    {isConnected 
                      ? "Connected and waiting for activity..." 
                      : "Connect to see data flow"}
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

export default Connect; 