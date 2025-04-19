import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';

// Mock FEN positions for demo
const DEMO_POSITIONS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", // After 1. e4
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", // After 1... e5
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", // After 2. Nf3
];

// Chess piece SVG mappings 
const PIECE_IMAGES: Record<string, string> = {
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
};

// Create game-specific position data matching the options from the server
const GAME_POSITIONS = {
  "immortal": [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  // Starting position
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",  // 1. e4
    "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",  // 1... d5
    "rnbqkbnr/ppp1pppp/8/3p4/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2",  // 2. d4
    "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",  // 2... e6
    "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3",  // 3. Nc3
  ],
  "brilliancy": [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  // Starting position
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",  // 1. d4
    "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2",  // 1... Nf6
    "rnbqkb1r/pppppppp/5n2/8/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq - 2 2",  // 2. Nf3
    "rnbqkb1r/pppp1ppp/5n2/4p3/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq e6 0 3",  // 2... e5
    "rnbqkb1r/pppp1ppp/5n2/4P3/8/5N2/PPP1PPPP/RNBQKB1R b KQkq - 0 3",  // 3. dxe5
  ],
  "opera": [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  // Starting position
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",  // 1. e4
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",  // 1... e5
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",  // 2. Nf3
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",  // 2... Nc6
    "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",  // 3. Bc4
  ],
  "miniatures": [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  // Starting position
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",  // 1. e4
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",  // 1... e5
    "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2",  // 2. Bc4
    "rnbqkbnr/ppp2ppp/8/3pp3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq d6 0 3",  // 2... d5
    "rnbqkbnr/ppp2ppp/8/3Pp3/2B5/8/PPPP1PPP/RNBQK1NR b KQkq - 0 3",  // 3. exd5
  ]
};

// Define the Game interface for PGN games
interface Game {
  id: string;
  name: string;
  white: string;
  black: string;
  result: string;
  moves_count: number;
}

const Demo: React.FC = () => {
  const [currentFen, setCurrentFen] = useState(DEMO_POSITIONS[0]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSensors, setActiveSensors] = useState<number[]>([]);
  const [boardState, setBoardState] = useState<string[][]>(Array(8).fill(Array(8).fill('')));
  const [dataFlow, setDataFlow] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pieceTheme, setPieceTheme] = useState<'neo' | 'cburnett' | 'classic'>('neo');
  const [serialPort, setSerialPort] = useState<any>(null);
  const [portInfo, setPortInfo] = useState<string>("");
  const [selectedGame, setSelectedGame] = useState<string>("immortal");
  const [statusMessage, setStatusMessage] = useState<string>("Not connected");
  const [leds, setLeds] = useState({ whitePlayer: false, blackPlayer: false });
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [explicitSimulationRequested, setExplicitSimulationRequested] = useState(false);
  const [connectionType, setConnectionType] = useState<'none' | 'websocket' | 'hardware' | 'simulation'>('none');
  const [connectionAttemptCount, setConnectionAttemptCount] = useState(0);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [currentGameInfo, setCurrentGameInfo] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [whiteActive, setWhiteActive] = useState(false);
  const [blackActive, setBlackActive] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Add game options
  const gameOptions = [
    { value: "immortal", label: "Anderssen's Immortal Game (1851)" },
    { value: "brilliancy", label: "Kasparov vs Topalov (1999)" },
    { value: "opera", label: "Morphy's Opera Game (1858)" },
    { value: "miniatures", label: "Scholar's Mate Miniature" },
  ];

  // Parse FEN string to board state
  useEffect(() => {
    const parseFen = (fen: string) => {
      const board = Array(8).fill(0).map(() => Array(8).fill(''));
      const fenParts = fen.split(' ');
      const rows = fenParts[0].split('/');
      
      rows.forEach((row, rowIndex) => {
        let colIndex = 0;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (/\d/.test(char)) {
            colIndex += parseInt(char, 10);
          } else {
            board[rowIndex][colIndex] = char;
            colIndex += 1;
          }
        }
      });
      
      setBoardState(board);
    };
    
    parseFen(currentFen);
  }, [currentFen]);

  // Simulate sensor activation
  const simulateSensorActivation = (row: number, col: number) => {
    setActiveSensors(prev => [...prev, row * 8 + col]);
    
    // Clear sensor activation after 1 second
    setTimeout(() => {
      setActiveSensors(prev => prev.filter(sensor => sensor !== row * 8 + col));
    }, 1000);
  };

  // Add log entry to data flow
  const addLogEntry = (entry: string) => {
    setDataFlow(prev => [entry, ...prev].slice(0, 10));
  };
  
  // Add raw data entry function for processing FEN strings
  const addRawDataEntry = (data: string) => {
    addLogEntry(`Received FEN: ${data}`);
    // Process the FEN string
    processReceivedFen(data);
  };
  
  // Process received FEN string from serial port or WebSocket
  const processReceivedFen = (fen: string) => {
    if (!fen || typeof fen !== 'string' || !fen.includes('/')) {
      console.error("Invalid FEN string received:", fen);
      addLogEntry(`ERROR: Invalid FEN format: ${fen}`);
      return;
    }
    
    try {
      // Update the board state with the new FEN
      setCurrentFen(fen);
      
      // Check for which player's turn it is based on the FEN
      const playerTurn = fen.split(' ')[1]; // 'w' or 'b'
      const turnText = playerTurn === 'w' ? "White's turn" : "Black's turn";
      addLogEntry(turnText);
      
      // Set the LED indicators based on whose turn it is
      if (playerTurn === 'w') {
        setWhiteActive(true);
        setBlackActive(false);
      } else {
        setWhiteActive(false);
        setBlackActive(true);
      }
      
      console.log("Processed FEN:", fen);
    } catch (error) {
      console.error("Error processing FEN:", error);
      addLogEntry(`ERROR: Could not process FEN: ${error.message}`);
    }
  };
  
  // Clean up serial port on unmount
  useEffect(() => {
    return () => {
      if (serialPort) {
        try {
          const closeResult = serialPort.close();
          // Only call .catch() if closeResult is a Promise
          if (closeResult && typeof closeResult.catch === 'function') {
            closeResult.catch(console.error);
          }
        } catch (error) {
          console.error("Error closing serial port:", error);
        }
      }
    };
  }, [serialPort]);
  
  // Toggle connection state for both hardware and WebSocket
  const toggleConnection = () => {
    if (isConnected) {
      if (serialPort) {
        try {
          // If using serial port, call close but don't immediately set to null
          const closeResult = serialPort.close();
          // Only process as Promise if it is one
          if (closeResult && typeof closeResult.then === 'function') {
            closeResult.then(() => {
              setSerialPort(null);
            }).catch(error => {
              console.error("Error closing serial port:", error);
              setSerialPort(null);
            });
          } else {
            // If not a Promise, set to null immediately
            setSerialPort(null);
          }
        } catch (error) {
          console.error("Error closing serial port:", error);
          setSerialPort(null);
        }
      }
      
      if (webSocket) {
        // If using WebSocket
        try {
          webSocket.close();
        } catch (error) {
          console.error("Error closing WebSocket:", error);
        }
        setWebSocket(null);
      }
      
      setIsConnected(false);
      setConnectionType(null);
      setStatusMessage("Not connected");
      setPortInfo("");
      addLogEntry("Disconnected from device");
      
      // Reset LED indicators
      setWhiteActive(false);
      setBlackActive(false);
    } else {
      // Connect using the WebSocket method
      connectWebSocket();
    }
  };

  // Simulate a move
  const simulateMove = () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    
    const nextIndex = (moveIndex + 1) % DEMO_POSITIONS.length;
    
    // Simulate physical move based on FEN changes
    const currentFenParts = DEMO_POSITIONS[moveIndex].split(' ');
    const nextFenParts = DEMO_POSITIONS[nextIndex].split(' ');
    
    // Log sensor detection
    addLogEntry("Sensor detecting piece movement...");
    
    // For demo, just highlight a random square as the source and target
    const sourceRow = Math.floor(Math.random() * 8);
    const sourceCol = Math.floor(Math.random() * 8);
    simulateSensorActivation(sourceRow, sourceCol);
    
    setTimeout(() => {
      addLogEntry("Processing sensor data...");
      
      setTimeout(() => {
        const targetRow = Math.floor(Math.random() * 8);
        const targetCol = Math.floor(Math.random() * 8);
        simulateSensorActivation(targetRow, targetCol);
        
        addLogEntry("Board state change detected");
        
        setTimeout(() => {
          addLogEntry("Converting to FEN notation");
          
          setTimeout(() => {
            addLogEntry(`Move validated: ${currentFenParts[1] === 'w' ? 'White' : 'Black'} moved`);
            setCurrentFen(DEMO_POSITIONS[nextIndex]);
            setMoveIndex(nextIndex);
            
            setTimeout(() => {
              addLogEntry("Updated state sent to software application");
              setIsSimulating(false);
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  // Connect to hardware using Web Serial API
  const connectToHardware = async () => {
    try {
      if (!isConnected) {
        // Check if Web Serial API is supported
        if (!('serial' in navigator)) {
          toast.error("Web Serial API not supported in this browser!");
          addLogEntry("ERROR: Web Serial API not supported");
          return;
        }
        
        addLogEntry("Requesting serial port access...");
        
        // Request a serial port with explicit filters to force selection dialog
        const port = await (navigator as any).serial.requestPort();
        // No filters needed - this will show all available ports
        
        // Try to get port information if available
        let portInfoText = "Port: ";
        try {
          const portInfo = (port as any).getInfo ? await (port as any).getInfo() : {};
          portInfoText += JSON.stringify(portInfo);
          setPortInfo(portInfoText);
        } catch (e) {
          portInfoText += "Unknown";
          setPortInfo(portInfoText);
        }
        
        addLogEntry(`Selected ${portInfoText}`);
        
        // Open the port
        await port.open({ baudRate: 115200 });
        setSerialPort(port);
        
        // Setup reader for incoming data
        const reader = port.readable.getReader();
        let receivedData = "";
        
        // Read data in a loop
        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              
              // Convert the received bytes to a string
              const textDecoder = new TextDecoder();
              const chunk = textDecoder.decode(value);
              console.log("RAW DATA RECEIVED:", chunk, "Bytes:", value);
              addLogEntry(`RAW DATA: ${chunk}`);
              receivedData += chunk;
              
              // Check for complete FEN strings (separated by newlines)
              if (receivedData.includes('\n')) {
                const lines = receivedData.split('\n');
                // Keep the last incomplete line (if any)
                receivedData = lines.pop() || "";
                
                // Process complete lines
                for (const line of lines) {
                  if (line.trim()) {
                    console.log("COMPLETE FEN:", line.trim());
                    addLogEntry(`PARSED: ${line.trim()}`);
                    processReceivedFen(line.trim());
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error reading from serial port:", error);
            addLogEntry(`ERROR: ${error.toString()}`);
            disconnectHardware();
          } finally {
            reader.releaseLock();
          }
        };
        
        // Start reading from the serial port
        readLoop();
        
        setIsConnected(true);
        setConnectionType('hardware');
        setStatusMessage("Connected to hardware");
        addLogEntry("Connected to ChessLink hardware");
        toast.success("Connected to ChessLink hardware!");
      } else {
        await disconnectHardware();
      }
    } catch (error) {
      console.error("Error connecting to serial port:", error);
      addLogEntry("ERROR: Failed to connect");
      toast.error("Failed to connect to ChessLink hardware!");
    }
  };
  
  // Disconnect from serial port
  const disconnectHardware = async () => {
    if (serialPort) {
      try {
        // Handle both Promise-based and synchronous close methods
        const closeResult = serialPort.close();
        if (closeResult && typeof closeResult.then === 'function') {
          await closeResult;
        }
        addLogEntry("Disconnected from hardware");
        toast.info("Disconnected from ChessLink hardware");
      } catch (error) {
        console.error("Error closing serial port:", error);
        addLogEntry("ERROR: Problem disconnecting");
      }
      setSerialPort(null);
    }
    setIsConnected(false);
    setConnectionType('none');
    setPortInfo("");
  };

  // Reset demo
  const resetDemo = () => {
    setCurrentFen(DEMO_POSITIONS[0]);
    setMoveIndex(0);
    setActiveSensors([]);
    setDataFlow([]);
    addLogEntry("Demo reset to initial state");
  };

  // Toggle board expansion
  const toggleBoardExpansion = () => {
    setIsExpanded(!isExpanded);
    addLogEntry(isExpanded ? "Board view collapsed" : "Board view expanded");
  };

  // Get rank and file labels
  const getRankLabel = (rank: number) => 8 - rank;
  const getFileLabel = (file: number) => String.fromCharCode(97 + file);

  // Update WebSocket URL to include game selection
  const getWebSocketUrl = () => {
    return `ws://localhost:8765?game=${selectedGame}`;
  };

  // Update the checkWebSocketAvailability function to set server status
  const checkWebSocketAvailability = async (): Promise<boolean> => {
    setServerStatus('unknown');
    return new Promise((resolve) => {
      try {
        // Try to connect to the WebSocket server with a short timeout
        const ws = new WebSocket(getWebSocketUrl());
        
        // Set a short timeout to check if connection can be established
        const timeout = setTimeout(() => {
          ws.close();
          setServerStatus('offline');
          resolve(false);
        }, 1000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          setServerStatus('online');
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          setServerStatus('offline');
          resolve(false);
        };
      } catch (error) {
        setServerStatus('offline');
        resolve(false);
      }
    });
  };

  // Add a function to check server status periodically when not connected
  useEffect(() => {
    // Only check server status when not connected
    if (!isConnected && !isSimulating) {
      const checkInterval = setInterval(() => {
        checkWebSocketAvailability();
      }, 5000);
      
      // Initial check
      checkWebSocketAvailability();
      
      return () => clearInterval(checkInterval);
    }
  }, [isConnected, isSimulating]);

  // Update connectWebSocket to handle PGN-based WebSocket server
  const connectWebSocket = useCallback(async () => {
    if (webSocket) {
      webSocket.close();
    }

    setIsConnecting(true);
    setIsCheckingConnection(true);
    
    try {
      // Add the selected game to the URL
      const ws = new WebSocket(`ws://localhost:8765?game=${selectedGame}`);
      
      let connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          setIsConnecting(false);
          setServerAvailable(false);
          addLogEntry("❌ WebSocket connection timed out");
          toast.error("WebSocket server connection timed out. Is the server running?");
        }
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        setServerAvailable(true);
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionType("websocket");
        setIsCheckingConnection(false);
        addLogEntry("✅ WebSocket connected");
        toast.success("Connected to WebSocket server");
        
        // Store the WebSocket instance
        setWebSocket(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "info") {
            addLogEntry(`ℹ️ ${data.message}`);
            
            // Store available games if provided
            if (data.available_games) {
              setAvailableGames(data.available_games);
            }
            
            // Store current game headers if provided
            if (data.headers) {
              setCurrentGameInfo(data.headers);
            }
          } else if (data.type === "position") {
            addRawDataEntry(data.fen);
          } else if (data.type === "error") {
            addLogEntry(`❌ Error: ${data.message}`);
            toast.error(data.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          addLogEntry(`❌ Error parsing message: ${error.message}`);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        setServerAvailable(false);
        setIsConnecting(false);
        setIsCheckingConnection(false);
        console.error("WebSocket error:", error);
        addLogEntry(`❌ WebSocket error`);
        toast.error("WebSocket connection error. Please check if the server is running.");
      };
      
      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        setIsConnecting(false);
        setIsCheckingConnection(false);
        addLogEntry(`WebSocket connection closed (code: ${event.code})`);
        
        // Only show toast if it was previously connected
        if (connectionType === "websocket") {
          toast.info("WebSocket connection closed");
          setConnectionType(null);
        }
      };
    } catch (error) {
      setIsConnecting(false);
      setIsCheckingConnection(false);
      setServerAvailable(false);
      console.error("WebSocket connection error:", error);
      addLogEntry(`❌ Failed to connect to WebSocket: ${error.message}`);
      toast.error(`Failed to connect: ${error.message}`);
    }
  }, [addLogEntry, connectionType, selectedGame]);

  // Update the simulateFallbackConnection to set the connection type
  const simulateFallbackConnection = (autoStart = false) => {
    // Only allow simulation to start if explicitly requested or autoStart is true
    if (!autoStart && !explicitSimulationRequested) {
      console.log("Simulation prevented - not explicitly requested");
      return;
    }
    
    // If already connected, don't start the simulation
    if (isConnected) {
      console.log("Already connected - simulation not needed");
      return;
    }
    
    // Get the positions for the selected game
    const positionData = GAME_POSITIONS[selectedGame] || GAME_POSITIONS.immortal;
    
    let index = 0;
    setIsConnected(true);
    setConnectionType('simulation');
    setStatusMessage("Connected via Simulation");
    setPortInfo(`Simulating: ${gameOptions.find(game => game.value === selectedGame)?.label || selectedGame}`);
    addLogEntry(`Using simulation for ${selectedGame} game`);
    toast.success(`Starting ${selectedGame} game simulation!`);
    
    // Process the first position
    processReceivedFen(positionData[0]);
    
    // Setup interval to process remaining positions
    const interval = setInterval(() => {
      index = (index + 1) % positionData.length;
      
      addLogEntry(`SIMULATION: Position ${index + 1}/${positionData.length}`);
      processReceivedFen(positionData[index]);
      
      // Set player indicators based on FEN
      const playerTurn = positionData[index].split(' ')[1]; // 'w' or 'b'
      setLeds({
        whitePlayer: playerTurn === 'w',
        blackPlayer: playerTurn === 'b'
      });
      
    }, 3000);
    
    // Store cleanup in serialPort
    setSerialPort({
      close: () => {
        clearInterval(interval);
        setIsConnected(false);
        setConnectionType('none');
        setPortInfo("");
        setStatusMessage("Not connected");
        addLogEntry("Simulation stopped");
        setExplicitSimulationRequested(false);
        toast.info("Simulation stopped");
      }
    });
  };

  return (
    <section id="demo" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Interactive ChessLink Demo</h2>
        
        <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
          {/* Left column with chess board visualization */}
          <div className={`${isExpanded ? 'max-w-4xl mx-auto w-full' : 'lg:col-span-7'}`}>
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center justify-between">
                  ChessLink Board
                  <div className="flex items-center space-x-2">
                    <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-600" : ""}>
                      {isConnected ? "Connected" : "Disconnected"}
                      {isConnected && (
                        <span className="w-2 h-2 bg-white rounded-full ml-2 animate-pulse"></span>
                      )}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleBoardExpansion}
                      className="ml-2"
                    >
                      {isExpanded ? "Collapse" : "Expand"} Board
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Interactive visualization of the smart chess board
                  <div className="flex items-center mt-1">
                    {isConnected && (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        <span className="text-xs text-green-600">{portInfo}</span>
                      </>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Add game information display */}
                <div className="p-4 bg-gray-100 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {gameOptions.find(game => game.value === selectedGame)?.label || "Chess Game"}
                      </h3>
                      {!isConnected && (
                        <div className="text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            serverStatus === 'online' ? 'bg-green-500' : 
                            serverStatus === 'offline' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <span className={`${
                            serverStatus === 'online' ? 'text-green-700' : 
                            serverStatus === 'offline' ? 'text-red-700' : 'text-gray-500'
                          }`}>
                            Server {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                      connectionType === 'websocket' ? 'bg-blue-100 text-blue-700' : 
                      connectionType === 'hardware' ? 'bg-green-100 text-green-700' : 
                      connectionType === 'simulation' ? 'bg-amber-100 text-amber-700' : 
                      'text-gray-600'
                    }`}>
                      {statusMessage}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <div className="flex gap-2 items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        leds.whitePlayer 
                          ? connectionType === 'websocket' ? 'bg-blue-500 animate-pulse' :
                            connectionType === 'simulation' ? 'bg-amber-500 animate-pulse' : 
                            'bg-green-500 animate-pulse' 
                          : 'bg-gray-300'
                      }`}></div>
                      <span className={leds.whitePlayer ? 'font-medium' : ''}>White Player{leds.whitePlayer ? ' (Active)' : ''}</span>
                    </div>
                    <div className="flex gap-2 items-center mt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        leds.blackPlayer 
                          ? connectionType === 'websocket' ? 'bg-blue-500 animate-pulse' :
                            connectionType === 'simulation' ? 'bg-amber-500 animate-pulse' : 
                            'bg-green-500 animate-pulse' 
                          : 'bg-gray-300'
                      }`}></div>
                      <span className={leds.blackPlayer ? 'font-medium' : ''}>Black Player{leds.blackPlayer ? ' (Active)' : ''}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`relative ${isExpanded ? 'max-w-3xl mx-auto' : ''}`}>
                  {/* Files (A-H) labels at the top */}
                  <div className="grid grid-cols-8 pl-6 pr-6 mb-1">
                    {Array(8).fill(0).map((_, i) => (
                      <div key={`file-top-${i}`} className="flex justify-center items-center h-6 text-sm font-medium text-gray-500">
                        {getFileLabel(i)}
                      </div>
                    ))}
                  </div>
                
                  <div className="flex">
                    {/* Ranks (1-8) labels on the left */}
                    <div className="flex flex-col justify-around pr-2">
                      {Array(8).fill(0).map((_, i) => (
                        <div key={`rank-left-${i}`} className="flex justify-center items-center w-4 h-full text-sm font-medium text-gray-500">
                          {getRankLabel(i)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Main chessboard */}
                    <div className={`aspect-square w-full border-2 border-gray-700 rounded-sm shadow-lg ${isExpanded ? 'max-h-[70vh]' : ''}`}>
                      <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                        {boardState.flat().map((piece, index) => {
                          const row = Math.floor(index / 8);
                          const col = index % 8;
                          const isBlackSquare = (row + col) % 2 === 1;
                          const isActiveSensor = activeSensors.includes(index);
                          const squareNotation = `${getFileLabel(col)}${getRankLabel(row)}`;
                          
                          return (
                            <div 
                              key={index}
                              className={`
                                relative flex items-center justify-center
                                ${isBlackSquare ? 'bg-[#b58863]' : 'bg-[#f0d9b5]'}
                                ${isActiveSensor ? 'ring-4 ring-blue-500 ring-inset' : ''}
                                transition-all duration-150 hover:brightness-110
                              `}
                            >
                              {piece && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <img 
                                    src={PIECE_IMAGES[piece]} 
                                    alt={`${piece === piece.toUpperCase() ? 'White' : 'Black'} ${
                                      piece.toLowerCase() === 'p' ? 'Pawn' : 
                                      piece.toLowerCase() === 'r' ? 'Rook' : 
                                      piece.toLowerCase() === 'n' ? 'Knight' : 
                                      piece.toLowerCase() === 'b' ? 'Bishop' : 
                                      piece.toLowerCase() === 'q' ? 'Queen' : 'King'
                                    }`}
                                    className={`w-full h-full object-contain p-1 ${isActiveSensor ? 'brightness-110' : ''}`}
                                    style={{ filter: isActiveSensor ? 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.7))' : 'none' }}
                                  />
                                </div>
                              )}
                              {isActiveSensor && (
                                <div className="absolute inset-0 bg-blue-500 opacity-20 z-10"></div>
                              )}
                              {/* Square coordinates in corner */}
                              <div className="absolute bottom-0.5 right-0.5 text-[8px] opacity-50">
                                {squareNotation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Ranks (1-8) labels on the right */}
                    <div className="flex flex-col justify-around pl-2">
                      {Array(8).fill(0).map((_, i) => (
                        <div key={`rank-right-${i}`} className="flex justify-center items-center w-4 h-full text-sm font-medium text-gray-500">
                          {getRankLabel(i)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Files (A-H) labels at the bottom */}
                  <div className="grid grid-cols-8 pl-6 pr-6 mt-1">
                    {Array(8).fill(0).map((_, i) => (
                      <div key={`file-bottom-${i}`} className="flex justify-center items-center h-6 text-sm font-medium text-gray-500">
                        {getFileLabel(i)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-4 mb-4">
                  <span className="mr-2">FEN:</span>
                  <code className="bg-gray-100 p-1 px-2 rounded text-xs font-mono tracking-tight">{currentFen}</code>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <div className="w-full">
                    <label className="text-sm font-medium mb-1 block">Select Chess Game:</label>
                    <select 
                      className="w-full p-2 border rounded-md bg-white mb-4"
                      value={selectedGame}
                      onChange={(e) => setSelectedGame(e.target.value)}
                      disabled={isConnected}
                    >
                      {availableGames.length > 0 ? (
                        availableGames.map((game) => (
                          <option key={game.id} value={game.id}>
                            {game.name} ({game.white} vs {game.black})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="immortal">Anderssen's Immortal Game</option>
                          <option value="brilliancy">Kasparov vs Topalov (1999)</option>
                          <option value="opera">Morphy's Opera Game</option>
                          <option value="scholars_mate">Scholar's Mate</option>
                        </>
                      )}
                    </select>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button 
                        variant={isConnected ? "destructive" : "default"}
                        onClick={toggleConnection}
                        disabled={isSimulating}
                      >
                        {isConnected ? "Disconnect" : "Connect Hardware"}
                      </Button>
                      
                      <Button 
                        variant={connectionType === 'websocket' ? "default" : "outline"}
                        onClick={connectWebSocket}
                        disabled={isConnected || isSimulating || !serverAvailable}
                        className={`${connectionType === 'websocket' ? "bg-blue-600 hover:bg-blue-700" : ""} relative`}
                      >
                        {isConnecting ? "Connecting..." : isConnected && connectionType === 'websocket' ? "Connected to WebSocket" : "Connect WebSocket"}
                        <span className={`absolute top-0 right-0 -mt-1 -mr-1 w-2 h-2 rounded-full ${
                          serverStatus === 'online' ? 'bg-green-500' : 
                          serverStatus === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                        }`}></span>
                      </Button>
                      
                      <Button 
                        variant={connectionType === 'simulation' ? "default" : "outline"}
                        onClick={() => {
                          setExplicitSimulationRequested(true);
                          simulateFallbackConnection(true);
                        }}
                        disabled={isConnected || isSimulating}
                        className={connectionType === 'simulation' ? "bg-amber-600 hover:bg-amber-700" : ""}
                      >
                        Simulate {selectedGame}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={simulateMove}
                        disabled={!isConnected || isSimulating}
                      >
                        Manual Move
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={resetDemo}
                        disabled={isSimulating}
                      >
                        Reset Board
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column with system info */}
          <div className={`${isExpanded ? 'max-w-4xl mx-auto w-full' : 'lg:col-span-5'}`}>
            <Tabs defaultValue="data-flow" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
                <TabsTrigger value="software">Software</TabsTrigger>
              </TabsList>
              
              {/* Data Flow Tab */}
              <TabsContent value="data-flow">
                <Card>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>System Data Flow</CardTitle>
                    <CardDescription>
                      Visualize how data moves through the ChessLink system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="border rounded-md p-3 bg-black text-green-400 font-mono h-80 overflow-y-auto space-y-2">
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
                            : "Connect the board to see data flow"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Hardware Tab */}
              <TabsContent value="hardware">
                <Card>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>Hardware Components</CardTitle>
                    <CardDescription>
                      The physical components of the ChessLink system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">Sensor Array</h4>
                        <p className="text-sm text-gray-600">64 IR sensors with RGB LEDs arranged in an 8×8 grid</p>
                      </div>
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">ESP32-C3</h4>
                        <p className="text-sm text-gray-600">Central microcontroller running at 160MHz</p>
                      </div>
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">Arduino Nano</h4>
                        <p className="text-sm text-gray-600">Co-processor connected via I2C interface</p>
                      </div>
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">Connectivity</h4>
                        <p className="text-sm text-gray-600">WiFi, Bluetooth 5.0, Serial connection options</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-lg mb-2">System Diagram</h4>
                      <div className="border-2 border-dashed border-gray-300 p-4 rounded bg-gray-50 text-center h-40 flex items-center justify-center">
                        <p className="text-gray-500">Interactive system diagram would be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Software Tab */}
              <TabsContent value="software">
                <Card>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>Software Architecture</CardTitle>
                    <CardDescription>
                      The software components and data processing pipeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">Local Board State Management</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                          <li>Maintains current board state</li>
                          <li>Tracks move history</li>
                          <li>Validates moves based on chess rules</li>
                          <li>Updates FEN notation</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2">Data Processing Pipeline</h4>
                        <div className="flex flex-col space-y-2">
                          {[
                            "1. Sensor data collection",
                            "2. Board state determination",
                            "3. FEN notation conversion",
                            "4. Move validation",
                            "5. User interface updates",
                            "6. Storage and analysis (optional)"
                          ].map((step, i) => (
                            <div key={i} className="flex items-center">
                              <div className={`h-6 w-6 rounded-full mr-2 flex items-center justify-center text-xs ${
                                isConnected ? 'bg-green-500 text-white' : 'bg-gray-300'
                              }`}>
                                {i + 1}
                              </div>
                              <span className="text-sm">{step.split('. ')[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo; 