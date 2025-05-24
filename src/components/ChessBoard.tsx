import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Zap, MessageSquare, Maximize2, Minimize2, X } from 'lucide-react';
import { useInView } from '@/lib/animations';
import { toast } from 'sonner';

// Chess piece Unicode characters
const PIECES = {
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  ' ': ''
};

// FEN string for the initial position
const INITIAL_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

// Demo moves to simulate real-time board updates
const DEMO_MOVES = [
  { from: 'e2', to: 'e4', notation: 'e4', comment: 'King\'s Pawn Opening' },
  { from: 'e7', to: 'e5', notation: 'e5', comment: 'Symmetric response' },
  { from: 'g1', to: 'f3', notation: 'Nf3', comment: 'Developing the knight' },
  { from: 'b8', to: 'c6', notation: 'Nc6', comment: 'Knight development' },
  { from: 'f1', to: 'c4', notation: 'Bc4', comment: 'Italian Game setup' },
];

// Convert FEN string to board representation
const fenToBoard = (fen: string): string[][] => {
  const board: string[][] = Array(8).fill('').map(() => Array(8).fill(' '));
  const rows = fen.split('/');

  for (let i = 0; i < rows.length; i++) {
    let col = 0;
    for (let j = 0; j < rows[i].length; j++) {
      const char = rows[i][j];
      if (/\d/.test(char)) {
        col += parseInt(char, 10);
      } else {
        board[i][col] = char;
        col++;
      }
    }
  }
  
  return board;
};

// Convert algebraic notation (e.g. "e4") to board coordinates [row, col]
const algebraicToCoords = (algebraic: string): [number, number] => {
  const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(algebraic[1], 10);
  return [row, col];
};

const ChessBoard: React.FC = () => {
  const { ref, isInView } = useInView();
  const [board, setBoard] = useState<string[][]>(fenToBoard(INITIAL_POSITION));
  const [moveIndex, setMoveIndex] = useState<number>(-1);
  const [lastMove, setLastMove] = useState<{from: [number, number], to: [number, number]} | null>(null);
  const [notation, setNotation] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [demoRunning, setDemoRunning] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [serialPort, setSerialPort] = useState<any>(null);
  const [receivedFens, setReceivedFens] = useState<string[]>([]);
  const [portInfo, setPortInfo] = useState<string>("");

  // Setup Web Serial API connection
  const connectToHardware = async () => {
    try {
      setIsConnected(false);
      toast.info("Connecting to ChessLink hardware...");
      
      // Check if Web Serial API is supported
      if (!('serial' in navigator)) {
        toast.error("Web Serial API not supported in this browser!");
        return;
      }
      
      // Request a serial port with explicit filters to force selection dialog
      const port = await (navigator as any).serial.requestPort({
        // Adding filters forces the selection dialog to appear
        filters: [
          // Empty filter will match any port
          {}
        ]
      });
      
      // Try to get port information if available
      let portInfoText = "Connected port: ";
      try {
        const portInfo = (port as any).getInfo ? await (port as any).getInfo() : {};
        portInfoText += JSON.stringify(portInfo);
        setPortInfo(portInfoText);
      } catch (e) {
        portInfoText += "Unknown";
        setPortInfo(portInfoText);
      }
      
      console.log("Selected port info:", port);
      toast.info(`Port selected. ${portInfoText}`);
      
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
            receivedData += chunk;
            
            // Check for complete FEN strings (separated by newlines)
            if (receivedData.includes('\n')) {
              const lines = receivedData.split('\n');
              // Keep the last incomplete line (if any)
              receivedData = lines.pop() || "";
              
              // Process complete lines
              for (const line of lines) {
                if (line.trim()) {
                  console.log("Received FEN:", line.trim());
                  processFenString(line.trim());
                }
              }
            }
          }
        } catch (error) {
          console.error("Error reading from serial port:", error);
          toast.error("Connection error. Disconnecting...");
          disconnectHardware();
        } finally {
          reader.releaseLock();
        }
      };
      
      // Start reading from the serial port
      readLoop();
      
      setIsConnected(true);
      toast.success("ChessLink hardware connected!");
      
    } catch (error) {
      console.error("Error connecting to serial port:", error);
      toast.error("Failed to connect to ChessLink hardware!");
      setIsConnected(false);
    }
  };
  
  // Disconnect from serial port
  const disconnectHardware = async () => {
    if (serialPort) {
      try {
        await serialPort.close();
        toast.info("Disconnected from ChessLink hardware");
      } catch (error) {
        console.error("Error closing serial port:", error);
      }
      setSerialPort(null);
    }
    setIsConnected(false);
  };
  
  // Process incoming FEN string
  const processFenString = (fen: string) => {
    // Add to received FENs list
    setReceivedFens(prev => [...prev, fen]);
    
    // Update the board with the new FEN
    setBoard(fenToBoard(fen.split(' ')[0]));
    
    // Update move information (simplified for demo)
    setMoveIndex(prev => prev + 1);
    setComment(`Move received from hardware`);
    
    // Notify user
    toast.info(`Board position updated from hardware`);
  };

  // Cleanup serial connection on unmount
  useEffect(() => {
    return () => {
      disconnectHardware();
    };
  }, []);

  // Reset the board to initial position
  const resetBoard = () => {
    setBoard(fenToBoard(INITIAL_POSITION));
    setMoveIndex(-1);
    setLastMove(null);
    setNotation([]);
    setComment("");
    setDemoRunning(false);
  };

  // Apply a move to the board
  const applyMove = (move: typeof DEMO_MOVES[0]) => {
    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = algebraicToCoords(move.from);
    const [toRow, toCol] = algebraicToCoords(move.to);
    
    // Move the piece
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = ' ';
    
    setBoard(newBoard);
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });
    setNotation([...notation, move.notation]);
    setComment(move.comment);
    
    // Simulate new move detected
    toast.info(`Move detected: ${move.from} to ${move.to}`);
  };

  // Demo controller effect
  useEffect(() => {
    if (!demoRunning) return;
    
    if (moveIndex < DEMO_MOVES.length - 1) {
      const timer = setTimeout(() => {
        setMoveIndex(prev => prev + 1);
        applyMove(DEMO_MOVES[moveIndex + 1]);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setDemoRunning(false);
    }
  }, [demoRunning, moveIndex]);

  // Allow manual navigation through the moves
  const goToMove = (index: number) => {
    if (index < -1 || index >= DEMO_MOVES.length) return;
    
    // Reset the board and apply moves up to the selected index
    setBoard(fenToBoard(INITIAL_POSITION));
    setLastMove(null);
    setNotation([]);
    setComment("");
    
    if (index >= 0) {
      for (let i = 0; i <= index; i++) {
        const [fromRow, fromCol] = algebraicToCoords(DEMO_MOVES[i].from);
        const [toRow, toCol] = algebraicToCoords(DEMO_MOVES[i].to);
        
        // Move the piece
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = ' ';
        
        if (i === index) {
          setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });
          setComment(DEMO_MOVES[i].comment);
        }
        
        setNotation(prev => [...prev, DEMO_MOVES[i].notation]);
      }
    }
    
    setMoveIndex(index);
  };

  // Toggle fullscreen mode
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    if (!isExpanded) {
      // When expanding, notify user
      toast.info("Expanded view activated");
    }
  };

  // Close expanded view
  const closeExpanded = () => {
    setIsExpanded(false);
  };

  // Add ESC key handler for the expanded view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        closeExpanded();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="relative w-full max-w-7xl mx-auto p-6">
          <button 
            onClick={closeExpanded}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 z-10"
            aria-label="Close expanded view"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Expanded Chess Board */}
            <div className="glass-card p-8 rounded-xl shadow-soft">
              <div className="grid grid-cols-8 gap-0 w-[480px] border border-gray-200 shadow-md">
                {board.map((row, rowIndex) => (
                  row.map((piece, colIndex) => {
                    const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                    const isFromSquare = lastMove && lastMove.from[0] === rowIndex && lastMove.from[1] === colIndex;
                    const isToSquare = lastMove && lastMove.to[0] === rowIndex && lastMove.to[1] === colIndex;
                    
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          w-16 h-16 flex items-center justify-center text-4xl 
                          ${isBlackSquare ? 'bg-gray-700' : 'bg-gray-100'} 
                          ${isFromSquare ? 'bg-yellow-200/50' : ''} 
                          ${isToSquare ? 'bg-green-200/50' : ''}
                        `}
                      >
                        <span className={isBlackSquare ? 'text-gray-100' : 'text-gray-800'}>
                          {PIECES[piece as keyof typeof PIECES]}
                        </span>
                      </div>
                    );
                  })
                ))}
              </div>
              
              {/* Coordinates */}
              <div className="flex justify-around mt-1">
                {Array.from('abcdefgh').map(letter => (
                  <div key={letter} className="text-sm text-gray-500 w-16 text-center">{letter}</div>
                ))}
              </div>
              
              <div className="flex flex-row-reverse items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button 
                    onClick={resetBoard}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                    title="Reset board"
                  >
                    <RotateCw size={20} />
                  </button>
                  {isConnected ? (
                    <button 
                      onClick={disconnectHardware}
                      className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors text-red-700"
                      title="Disconnect hardware"
                    >
                      <X size={20} />
                    </button>
                  ) : (
                    <button 
                      onClick={connectToHardware}
                      className="p-2 rounded-full bg-accent text-white hover:bg-accent-dark transition-colors"
                      title="Connect to hardware"
                    >
                      <Zap size={20} />
                    </button>
                  )}
                  <button 
                    onClick={toggleExpand}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                    title="Exit fullscreen"
                  >
                    <Minimize2 size={20} />
                  </button>
                </div>
                
                <div className="text-sm text-green-600 font-medium flex items-center">
                  {isConnected && (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      <span>
                        Hardware connected
                        {portInfo && <span className="ml-1 text-xs opacity-70">{portInfo}</span>}  
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Move history and controls - expanded version */}
            <div className="glass-card p-6 rounded-xl shadow-soft max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Move History</h3>
              
              {/* Move navigator */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => goToMove(moveIndex - 1)} 
                    disabled={moveIndex < 0}
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="px-4 py-2 text-base bg-gray-100 rounded-md">
                    Move {moveIndex + 1} / {DEMO_MOVES.length}
                  </div>
                  
                  <button 
                    onClick={() => goToMove(moveIndex + 1)}
                    disabled={moveIndex >= DEMO_MOVES.length - 1}
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                {/* Move list */}
                <div className="bg-gray-50 rounded-md p-4 h-[400px] overflow-y-auto border border-gray-200">
                  {notation.length > 0 ? (
                    <div className="space-y-3">
                      {notation.map((move, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-100
                            ${idx === moveIndex ? 'bg-blue-50 border border-blue-100' : ''}`}
                          onClick={() => goToMove(idx)}
                        >
                          <div className="w-10 text-gray-500 text-base">{Math.floor(idx/2) + 1}.{idx % 2 === 0 ? '' : '..'}</div>
                          <div className="font-mono font-medium text-lg">{move}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No moves yet</p>
                      <p className="text-base mt-2">Connect to hardware to start</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Analysis */}
              {comment && (
                <div className="bg-blue-50 rounded-md p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-base font-medium text-blue-700 mb-2">Analysis</h4>
                      <p className="text-base text-gray-700">{comment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section 
      id="demo" 
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-24 bg-gradient-to-b from-white to-blue-50"
    >
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="heading-md mb-4">Real-time Chess Board Visualization</h2>
          <p className="text-chesslink-500 max-w-3xl mx-auto">
            Experience the seamless connection between physical play and digital tracking. 
            The ChessLink board detects every move you make and instantly reflects it in the web application.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Chess Board */}
          <div 
            className={`transition-all duration-1000 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="relative">
              <div className="glass-card p-6 rounded-xl shadow-soft">
                <div className="grid grid-cols-8 gap-0 w-[320px] border border-gray-200 shadow-md">
                  {board.map((row, rowIndex) => (
                    row.map((piece, colIndex) => {
                      const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                      const isFromSquare = lastMove && lastMove.from[0] === rowIndex && lastMove.from[1] === colIndex;
                      const isToSquare = lastMove && lastMove.to[0] === rowIndex && lastMove.to[1] === colIndex;
                      
                      return (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            w-10 h-10 flex items-center justify-center text-2xl 
                            ${isBlackSquare ? 'bg-gray-700' : 'bg-gray-100'} 
                            ${isFromSquare ? 'bg-yellow-200/50' : ''} 
                            ${isToSquare ? 'bg-green-200/50' : ''}
                          `}
                        >
                          <span className={isBlackSquare ? 'text-gray-100' : 'text-gray-800'}>
                            {PIECES[piece as keyof typeof PIECES]}
                          </span>
                        </div>
                      );
                    })
                  ))}
                </div>
                
                {/* Coordinates */}
                <div className="flex justify-around mt-1">
                  {Array.from('abcdefgh').map(letter => (
                    <div key={letter} className="text-xs text-gray-500 w-10 text-center">{letter}</div>
                  ))}
                </div>
                
                <div className="flex flex-row-reverse items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={resetBoard}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                      title="Reset board"
                    >
                      <RotateCw size={16} />
                    </button>
                    {isConnected ? (
                      <button 
                        onClick={disconnectHardware}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors text-red-700"
                        title="Disconnect hardware"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={connectToHardware}
                        className="p-2 rounded-full bg-accent text-white hover:bg-accent-dark transition-colors"
                        title="Connect to hardware"
                      >
                        <Zap size={16} />
                      </button>
                    )}
                    <button 
                      onClick={toggleExpand}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                      title="Expand board"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  
                  <div className="text-xs text-green-600 font-medium flex items-center">
                    {isConnected && (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        <span>
                          Hardware connected
                          {portInfo && <span className="block text-xs opacity-70 truncate max-w-32">{portInfo}</span>}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Current move info */}
              {lastMove && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card py-2 px-4 rounded-full animate-float shadow-md">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="font-medium text-gray-800">
                      Move: <span className="text-accent">{notation[notation.length - 1]}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Move history and controls */}
          <div 
            className={`transition-all duration-1000 delay-300 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="glass-card p-6 rounded-xl shadow-soft max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Move History</h3>
              
              {/* Move navigator */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => goToMove(moveIndex - 1)} 
                    disabled={moveIndex < 0}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="px-3 py-1 text-sm bg-gray-100 rounded-md">
                    Move {moveIndex + 1} / {DEMO_MOVES.length}
                  </div>
                  
                  <button 
                    onClick={() => goToMove(moveIndex + 1)}
                    disabled={moveIndex >= DEMO_MOVES.length - 1}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                {/* Move list */}
                <div className="bg-gray-50 rounded-md p-3 h-[200px] overflow-y-auto border border-gray-200">
                  {notation.length > 0 ? (
                    <div className="space-y-2">
                      {notation.map((move, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100
                            ${idx === moveIndex ? 'bg-blue-50 border border-blue-100' : ''}`}
                          onClick={() => goToMove(idx)}
                        >
                          <div className="w-8 text-gray-500 text-sm">{Math.floor(idx/2) + 1}.{idx % 2 === 0 ? '' : '..'}</div>
                          <div className="font-mono font-medium">{move}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No moves yet</p>
                      <p className="text-sm mt-2">Connect to hardware to start</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Analysis */}
              {comment && (
                <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1">Analysis</h4>
                      <p className="text-sm text-gray-700">{comment}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hardware Integration</h4>
                <p className="text-sm text-gray-600">
                  The ChessLink board uses only phototransistors to detect piece movements 
                  and sends the data to this web interface for real-time visualization and analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`glass-card p-6 transition-all duration-700 delay-200 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-chesslink-500">
              Every move is instantly detected by the board's sensors and transmitted to the application.
            </p>
          </div>
          
          <div className={`glass-card p-6 transition-all duration-700 delay-300 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-semibold mb-2">Move Analysis</h3>
            <p className="text-chesslink-500">
              Get instant feedback on your moves with integrated engine analysis and improvement suggestions.
            </p>
          </div>
          
          <div className={`glass-card p-6 transition-all duration-700 delay-400 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-semibold mb-2">Game History</h3>
            <p className="text-chesslink-500">
              Save your games automatically and review them later with advanced analysis tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChessBoard;
