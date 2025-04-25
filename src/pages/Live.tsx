import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, PlayCircle, PlusCircle, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { io } from 'socket.io-client';

// Define interfaces for game data
interface LiveGame {
  id: string;
  title: string;
  players: {
    white: string;
    black: string;
  };
  status: 'active' | 'ended';
  lastUpdate: Date;
  currentPosition: string;
  moveCount: number;
  viewerCount: number;
}

const LiveGamesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('games');
  const [isConnected, setIsConnected] = useState(false);
  const [isHostingGame, setIsHostingGame] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [hostGame, setHostGame] = useState<{
    fen: string;
    title: string;
    white: string;
    black: string;
  }>({
    fen: new Chess().fen(),
    title: "My Live Game",
    white: "Player 1",
    black: "Player 2",
  });
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [dataLog, setDataLog] = useState<string[]>([]);
  const navigate = useNavigate();

  // Add a log entry
  const addLogEntry = (entry: string) => {
    setDataLog(prev => [entry, ...prev.slice(0, 19)]);
  };

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    try {
      toast.info("Connecting to ChessLink server...");
      addLogEntry("Connecting to ChessLink server...");
      
      const socket = io('http://localhost:8765');
      
      socket.on('connect', () => {
        setIsConnected(true);
        addLogEntry("✅ Connected to ChessLink server");
        toast.success("Connected to ChessLink server");
        socketRef.current = socket;
        
        // Request current live games
        socket.emit('get_live_games');
      });
      
      socket.on('live_games_list', (data) => {
        // Convert lastUpdate timestamp to Date object for each game
        const gamesWithDate = (data.games || []).map((game: any) => ({
          ...game,
          lastUpdate: new Date(game.lastUpdate) 
        }));
        setLiveGames(gamesWithDate);
        addLogEntry(`Received ${gamesWithDate.length || 0} live games`);
      });
      
      socket.on('game_update', (data) => {
        // Convert lastUpdate before updating state
        const updatedGameWithDate = {
          ...data.game,
          lastUpdate: new Date(data.game.lastUpdate)
        };
        updateGameData(updatedGameWithDate as LiveGame);
        addLogEntry(`Game update received: ${data.game.id}`);
      });
      
      socket.on('new_game', (data) => {
        // Convert lastUpdate before adding to state
        const newGameWithDate = {
          ...data.game,
          lastUpdate: new Date(data.game.lastUpdate)
        };
        addNewGame(newGameWithDate as LiveGame);
        addLogEntry(`New game started: ${data.game.id}`);
        toast.info(`New game started: ${data.game.title}`);
      });
      
      socket.on('game_ended', (data) => {
        handleGameEnded(data.gameId);
        addLogEntry(`Game ended: ${data.gameId}`);
      });
      
      socket.on('position', (data) => {
        updateGamePosition(data.gameId, data.fen);
        addLogEntry(`New position for game ${data.gameId}`);
      });
      
      socket.on('connect_error', (err) => {
        setIsConnected(false);
        socketRef.current = null;
        toast.error("Connection error. Is the ChessLink server running?");
        addLogEntry("❌ WebSocket connection error");
      });
      
      socket.on('disconnect', () => {
        setIsConnected(false);
        socketRef.current = null;
        addLogEntry("WebSocket connection closed");
        
        if (isHostingGame) {
          toast.error("Lost connection to ChessLink server");
          setIsHostingGame(false);
        }
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      toast.error("Failed to connect to ChessLink server");
      addLogEntry(`❌ Connection error: ${error.message}`);
    }
  };
  
  // Update a game in the list
  const updateGameData = (updatedGame: LiveGame) => {
    // Now receives updatedGame with lastUpdate already as Date
    setLiveGames(prev => prev.map(game => 
      game.id === updatedGame.id ? updatedGame : game
    ));
  };
  
  // Add a new game to the list
  const addNewGame = (newGame: LiveGame) => {
    // Now receives newGame with lastUpdate already as Date
    setLiveGames(prev => [newGame, ...prev]);
  };
  
  // Handle a game ending
  const handleGameEnded = (gameId: string) => {
    setLiveGames(prev => prev.map(game => 
      game.id === gameId ? { ...game, status: 'ended' } : game
    ));
    
    if (currentGameId === gameId) {
      setIsHostingGame(false);
      setCurrentGameId(null);
      toast.info("Your game has ended");
    }
  };
  
  // Update a game's position
  const updateGamePosition = (gameId: string, fen: string) => {
    setLiveGames(prev => prev.map(game => 
      game.id === gameId ? { 
        ...game, 
        currentPosition: fen,
        moveCount: game.moveCount + 1,
        lastUpdate: new Date()
      } : game
    ));
    
    if (gameId === currentGameId) {
      setHostGame(prev => ({ ...prev, fen }));
    }
  };

  // Start hosting a new game
  const startHostingGame = () => {
    if (!isConnected) {
      toast.error("Please connect to the ChessLink server first");
      return;
    }
    
    const gameId = Math.random().toString(36).substring(2, 10);
    
    const newGame: LiveGame = {
      id: gameId,
      title: hostGame.title,
      players: {
        white: hostGame.white,
        black: hostGame.black,
      },
      status: 'active',
      lastUpdate: new Date(),
      currentPosition: new Chess().fen(),
      moveCount: 0,
      viewerCount: 1
    };
    
    // Send new game to server
    if (socketRef.current) {
      socketRef.current.emit('start_game', { game: newGame });
      
      setCurrentGameId(gameId);
      setIsHostingGame(true);
      addNewGame(newGame);
      addLogEntry(`Started new game: ${gameId}`);
      toast.success("Live game started!");
    }
  };
  
  // Stop hosting the current game
  const stopHostingGame = () => {
    if (socketRef.current && currentGameId) {
      socketRef.current.emit('end_game', { gameId: currentGameId });
      
      setIsHostingGame(false);
      setCurrentGameId(null);
      addLogEntry(`Ended game: ${currentGameId}`);
      toast.info("Stopped hosting game");
    }
  };
  
  // View a live game
  const viewLiveGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  
  // Disconnect WebSocket
  const disconnect = () => {
    if (socketRef.current) {
      if (isHostingGame) {
        stopHostingGame();
      }
      
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      addLogEntry("Disconnected from ChessLink server");
      toast.info("Disconnected from ChessLink server");
    }
  };
  
  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 120) return "1 minute ago";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 7200) return "1 hour ago";
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  /* --- TEMPORARILY DISABLED MOCK DATA --- 
  // Mock games for demo purposes
  useEffect(() => {
    // Only add mock games if none exist yet
    if (liveGames.length === 0) {
      const mockGames: LiveGame[] = [
        {
          id: "demo1",
          title: "World Championship Game",
          players: { white: "Magnus Carlsen", black: "Ian Nepomniachtchi" },
          status: 'active',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          currentPosition: "r1bqkbnr/ppp2ppp/2np4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4",
          moveCount: 7,
          viewerCount: 42
        },
        {
          id: "demo2",
          title: "Club Championship",
          players: { white: "John Smith", black: "Alice Johnson" },
          status: 'active',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 12), // 12 minutes ago
          currentPosition: "rnbqkb1r/pp2pppp/5n2/2pp4/3P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 0 4",
          moveCount: 8,
          viewerCount: 15
        }
      ];
      
      setLiveGames(mockGames);
    }
  }, [liveGames.length]);
  */ // --- END TEMPORARILY DISABLED MOCK DATA ---

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3">Live Chess Games</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Watch live games from around the world or connect your ChessLink hardware
                to broadcast your own game.
              </p>
            </div>
            
            <Tabs defaultValue="games" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="games">Watch Games</TabsTrigger>
                  <TabsTrigger value="connect">Host a Game</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="games" className="space-y-6">
                {liveGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {liveGames.map((game) => (
                      <Card key={game.id} className={`overflow-hidden ${game.status === 'ended' ? 'opacity-75' : ''}`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{game.title}</CardTitle>
                            <Badge variant={game.status === 'active' ? "default" : "outline"}>
                              {game.status === 'active' ? 'Live' : 'Ended'}
                            </Badge>
                          </div>
                          <CardDescription className="flex justify-between">
                            <span>{getRelativeTime(game.lastUpdate)}</span>
                            <span>{game.viewerCount} watching</span>
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-4">
                          <div className="aspect-square w-full max-h-[240px]">
                            <Chessboard 
                              position={game.currentPosition} 
                              boardWidth={240}
                              areArrowsAllowed={false}
                            />
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">White</span>
                              <p className="font-medium">{game.players.white}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Black</span>
                              <p className="font-medium">{game.players.black}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Moves</span>
                              <p className="font-medium">{game.moveCount}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Status</span>
                              <p className="font-medium">{game.status === 'active' ? 'In progress' : 'Completed'}</p>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="bg-gray-50 border-t p-4">
                          <Button 
                            onClick={() => viewLiveGame(game.id)}
                            className="w-full"
                            disabled={game.status !== 'active'}
                          >
                            {game.status === 'active' ? (
                              <>Watch Game <ArrowRight className="ml-2 h-4 w-4" /></>
                            ) : (
                              'Game Ended'
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
                    <div className="text-4xl mb-4">👀</div>
                    <h3 className="text-lg font-medium mb-2">No live games at the moment</h3>
                    <p className="text-gray-600 mb-6">
                      Be the first to host a game for others to watch!
                    </p>
                    <Button onClick={() => setActiveTab('connect')}>
                      Host a Game <PlusCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="connect" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Hardware Connection Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>ChessLink Connection</CardTitle>
                        <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-600" : ""}>
                          {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Connect to your ChessLink hardware to broadcast a live game
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
                              ? "Connected and waiting for activity..." 
                              : "Connect to ChessLink to see data flow"}
                          </div>
                        )}
                      </div>
                      
                      {/* Connection Controls */}
                      <div className="flex justify-center">
                        {!isConnected ? (
                          <Button onClick={connectWebSocket} className="w-full">
                            <Wifi className="mr-2 h-4 w-4" />
                            Connect to ChessLink
                          </Button>
                        ) : (
                          <Button onClick={disconnect} variant="outline" className="w-full">
                            <WifiOff className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Game Setup Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Game Setup</CardTitle>
                      <CardDescription>
                        Configure your live game broadcast settings
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Game Title</label>
                        <input
                          type="text" 
                          value={hostGame.title}
                          onChange={(e) => setHostGame(prev => ({...prev, title: e.target.value}))}
                          className="w-full p-2 border rounded-md" 
                          disabled={isHostingGame}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">White Player</label>
                          <input
                            type="text" 
                            value={hostGame.white}
                            onChange={(e) => setHostGame(prev => ({...prev, white: e.target.value}))}
                            className="w-full p-2 border rounded-md"
                            disabled={isHostingGame}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Black Player</label>
                          <input
                            type="text" 
                            value={hostGame.black}
                            onChange={(e) => setHostGame(prev => ({...prev, black: e.target.value}))}
                            className="w-full p-2 border rounded-md"
                            disabled={isHostingGame}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        {!isHostingGame ? (
                          <Button 
                            onClick={startHostingGame} 
                            className="w-full"
                            disabled={!isConnected}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Live Game
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <Button 
                              onClick={stopHostingGame} 
                              variant="outline"
                              className="w-full"
                            >
                              Stop Broadcasting
                            </Button>
                            
                            <div className="p-3 bg-gray-50 rounded-md text-sm">
                              <div className="font-medium flex justify-between">
                                <span>Share this game:</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => viewLiveGame(currentGameId!)}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                              <code className="block mt-1 w-full rounded bg-gray-100 p-2 text-xs break-all">
                                {window.location.origin}/game/{currentGameId}
                              </code>
                              <Button 
                                className="w-full mt-2" 
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/game/${currentGameId}`);
                                  toast.success("Link copied to clipboard!");
                                }}
                              >
                                Copy Link
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Live Preview */}
                {isHostingGame && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Game Preview</CardTitle>
                      <CardDescription>
                        This is what viewers will see when they watch your game
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div className="aspect-square max-w-[350px] mx-auto">
                          <Chessboard 
                            position={hostGame.fen} 
                            boardWidth={350}
                            areArrowsAllowed={false}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-medium">{hostGame.title}</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
                              <div>
                                <div className="text-sm text-gray-500">White</div>
                                <div className="font-medium flex items-center gap-2">
                                  <div className="w-3 h-3 bg-white border border-gray-300 rounded-full"></div>
                                  {hostGame.white}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Black</div>
                                <div className="font-medium flex items-center gap-2">
                                  <div className="w-3 h-3 bg-black rounded-full"></div>
                                  {hostGame.black}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm text-gray-500">Status</div>
                                <div className="font-medium">Live</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Viewers</div>
                                <div className="font-medium">
                                  {(liveGames.find(g => g.id === currentGameId)?.viewerCount || 1)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Game Status</div>
                            <p className="font-medium">
                              {(() => {
                                try {
                                  const chess = new Chess(hostGame.fen);
                                  if (chess.isCheckmate()) return "Checkmate";
                                  if (chess.isDraw()) return "Draw";
                                  if (chess.isStalemate()) return "Stalemate";
                                  if (chess.isCheck()) return "Check";
                                  return chess.turn() === "w" ? "White to move" : "Black to move";
                                } catch (e) {
                                  return "Unknown";
                                }
                              })()}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-end">
                            <Button onClick={() => viewLiveGame(currentGameId!)}>
                              View as Spectator
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LiveGamesPage; 