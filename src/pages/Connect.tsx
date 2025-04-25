import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  CircleOff,
  Wifi,
  WifiOff,
  HardDrive,
  RadioTower
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { io, Socket } from 'socket.io-client';

interface PortInfo {
  device: string;
  description: string;
  manufacturer: string;
}

const Connect = () => {
  const [game, setGame] = useState(new Chess());
  const [pgn, setPgn] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLiveGame, setIsLiveGame] = useState(false);
  const [lastMove, setLastMove] = useState("");
  const [gameId, setGameId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [dataFlow, setDataFlow] = useState<string[]>([]);
  const [leds, setLeds] = useState({ whitePlayer: false, blackPlayer: false });
  const [dataLog, setDataLog] = useState<string[]>([]);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const navigate = useNavigate();

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    if (socketRef.current && socketRef.current.connected) {
      return; // Already connected
    }

    toast.info("Attempting to connect to ChessLink server...");
    addLogEntry("Connecting to ChessLink server...");

    try {
      // Disconnect previous socket if exists
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io('http://localhost:8765'); // Initialize Socket.IO client
      socketRef.current = socket; // Store the reference

      socket.on('connect', () => {
        setIsConnected(true);
        addLogEntry("✅ Socket.IO connected");
        toast.success("Connected to ChessLink server");
        // Optionally request initial status or data
        socket.emit('get_hardware_status'); // Example event
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        addLogEntry("Socket.IO disconnected");
        if (isLiveGame) {
          toast.error("Lost connection during live game");
        }
        socketRef.current = null; // Clear ref on disconnect
      });

      socket.on('connect_error', (err) => {
        setIsConnected(false);
        addLogEntry(`❌ Socket.IO Connection Error: ${err.message}`);
        toast.error("Connection failed. Is server running?");
        socketRef.current = null;
      });

      // Example: Listen for hardware status updates
      socket.on('hardware_status', (data) => {
        addLogEntry(`Hardware Status: ${JSON.stringify(data)}`);
        // Update UI based on status
      });

    } catch (error) {
      console.error("Connection setup error:", error);
      addLogEntry(`❌ Setup Error: ${error.message}`);
      toast.error("Failed to set up connection");
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
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start_game', { game_id: newGameId });
    }
  };

  // Stop the live game
  const stopLiveGame = () => {
    setIsLiveGame(false);
    addLogEntry("Live game stopped");
    toast.info("Live game stopped");
    
    // Send stop game command to server if needed
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_game', { game_id: gameId });
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
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
      if (socketRef.current) {
        socketRef.current.disconnect();
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

  // Fetch available serial ports
  const fetchPorts = async () => {
    try {
      const response = await fetch('http://localhost:8765/serial/ports');
      const data = await response.json();
      if (data.status === 'success') {
        setPorts(data.ports || []);
      } else {
        addLogEntry(`❌ Error fetching ports: ${data.message}`);
      }
    } catch (error) {
      addLogEntry(`❌ Network error fetching ports: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  // Placeholder for connecting to hardware (using Socket.IO events)
  const connectHardware = () => {
    if (!selectedPort) {
      toast.error("Please select a serial port first.");
      return;
    }
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Not connected to the server. Connect WebSocket first.");
      return;
    }
    addLogEntry(`Attempting hardware connection on port ${selectedPort}...`);
    socketRef.current.emit('connect_hardware', { port: selectedPort });
  };

  // Placeholder for disconnecting hardware
  const disconnectHardware = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      toast.info("Not connected to server.");
      return;
    }
    addLogEntry("Disconnecting hardware...");
    socketRef.current.emit('disconnect_hardware');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3">Connect Hardware</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect your ChessLink hardware to the server to enable live game broadcasting.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>ChessLink Connection</CardTitle>
                  <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-600" : ""}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <CardDescription>
                  Manage the connection between the server and your hardware.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Data Flow Log */}
                <div className="border rounded-md bg-black text-green-400 font-mono h-[200px] overflow-y-auto p-2 text-sm">
                  {dataLog.length > 0 ? (
                    dataLog.map((entry, i) => (
                      <div key={i} className="flex">
                        <span className="opacity-60 mr-2">[{new Date().toLocaleTimeString('en-US', {hour12: false})}]</span>
                        <span>{entry}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-60">
                      {isConnected 
                        ? "Connected. Waiting for hardware activity..." 
                        : "Connect to see data flow"}
                    </div>
                  )}
                </div>
                
                {/* Connection Controls */}
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">Available Serial Ports</label>
                    <Select 
                      onValueChange={setSelectedPort} 
                      value={selectedPort} 
                      disabled={ports.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={ports.length > 0 ? "Select a port..." : "No ports found"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ports.map((port) => (
                          <SelectItem key={port.device} value={port.device}>
                            {port.device} {port.description ? `(${port.description})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ports.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No serial ports detected. Ensure hardware is connected and drivers are installed.</p>
                    )}
                  </div>
                  <Button onClick={fetchPorts} variant="outline" size="sm">Refresh Ports</Button>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  {!isConnected ? (
                    <Button onClick={connectWebSocket} className="flex-1">
                      <RadioTower className="mr-2 h-4 w-4" />
                      Connect to Server
                    </Button>
                  ) : (
                    <Button onClick={() => socketRef.current?.disconnect()} variant="outline" className="flex-1">
                      <WifiOff className="mr-2 h-4 w-4" />
                      Disconnect Server
                    </Button>
                  )}
                  
                  <Button onClick={connectHardware} disabled={!isConnected || !selectedPort} className="flex-1">
                    <HardDrive className="mr-2 h-4 w-4" />
                    Connect Hardware
                  </Button>
                  <Button onClick={disconnectHardware} disabled={!isConnected} variant="outline" className="flex-1">
                    Disconnect Hardware
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Connect; 