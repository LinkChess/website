import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDownToLine, 
  Copy,
  PlayCircle, 
  CircleOff,
  Share2
} from "lucide-react";
import { toast } from "sonner";

const Connect = () => {
  const [game, setGame] = useState(new Chess());
  const [pgn, setPgn] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLiveGame, setIsLiveGame] = useState(false);
  const [lastMove, setLastMove] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // Simulate connecting to hardware
  const connectToHardware = () => {
    // This would be replaced with actual hardware connection logic
    toast.info("Attempting to connect to chess hardware...");
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Connected to chess hardware");
    }, 1500);
  };

  // Simulate disconnecting from hardware
  const disconnectFromHardware = () => {
    setIsConnected(false);
    setIsLiveGame(false);
    toast.info("Disconnected from chess hardware");
  };

  // Simulate starting a live game
  const startLiveGame = () => {
    if (!isConnected) {
      toast.error("Please connect to hardware first");
      return;
    }

    setGame(new Chess()); // Reset the game
    setIsLiveGame(true);
    setPgn("");
    toast.success("Live game started");

    // Generate a shareable URL for spectators
    const randomId = Math.random().toString(36).substring(2, 10);
    setShareUrl(`https://chesslink.site/game/${randomId}`);
  };

  // Simulate receiving moves from hardware
  useEffect(() => {
    if (!isLiveGame) return;
    
    // This would be replaced with actual hardware event listener
    const interval = setInterval(() => {
      // Randomly decide whether to make a move (20% chance)
      if (Math.random() < 0.2 && !game.isGameOver()) {
        const possibleMoves = game.moves();
        if (possibleMoves.length > 0) {
          // Make a random legal move
          const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          
          const newGame = new Chess(game.fen());
          newGame.move(move);
          
          setLastMove(move);
          setGame(newGame);
          setPgn(newGame.pgn());
          
          // Update UI to show the move
          toast.info(`Move played: ${move}`);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [game, isLiveGame]);

  // Function to save PGN to demo
  const saveToDemoLibrary = () => {
    // This would typically save to a database or local storage
    toast.success("Game saved to demo library");
    // Simulate redirection to demo page
    setTimeout(() => {
      window.location.href = "/demo";
    }, 1500);
  };

  // Copy shareable URL
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable URL copied to clipboard");
  };

  // Get game status display
  const getGameStatus = () => {
    if (game.isCheckmate()) return "Checkmate";
    if (game.isDraw()) return "Draw";
    if (game.isStalemate()) return "Stalemate";
    if (game.isThreefoldRepetition()) return "Draw by repetition";
    if (game.isInsufficientMaterial()) return "Draw by insufficient material";
    if (game.isCheck()) return "Check";
    return game.turn() === "w" ? "White to move" : "Black to move";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Live Chess Connection</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Chessboard and Controls */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Live Game Board</CardTitle>
                <div className="flex gap-2">
                  {isConnected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Disconnected
                    </Badge>
                  )}
                  {isLiveGame && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Live
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {isLiveGame ? `Game Status: ${getGameStatus()}` : "Connect your chess hardware to start a live game"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="aspect-square max-w-md mx-auto mb-4">
                <Chessboard position={game.fen()} />
              </div>
              
              {isLiveGame && lastMove && (
                <div className="text-center mb-4">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Last Move: {lastMove}
                  </Badge>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {!isConnected ? (
                  <Button onClick={connectToHardware}>
                    Connect to Hardware
                  </Button>
                ) : (
                  <>
                    <Button onClick={disconnectFromHardware} variant="outline">
                      <CircleOff className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                    
                    {!isLiveGame ? (
                      <Button onClick={startLiveGame}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Live Game
                      </Button>
                    ) : (
                      <Button onClick={saveToDemoLibrary} variant="secondary">
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Save to Demo
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Game Data and Sharing */}
        <div>
          <Tabs defaultValue="pgn">
            <TabsList className="w-full">
              <TabsTrigger value="pgn" className="flex-1">PGN</TabsTrigger>
              <TabsTrigger value="share" className="flex-1">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pgn">
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
                    className="min-h-[200px] font-mono text-sm"
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
                    <Copy className="mr-2 h-4 w-4" />
                    Copy PGN
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="share">
              <Card>
                <CardHeader>
                  <CardTitle>Share Live Game</CardTitle>
                  <CardDescription>
                    Share this link with others to let them watch the game live
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {shareUrl ? (
                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {shareUrl}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-muted-foreground">
                      Start a live game to generate a shareable link
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    onClick={copyShareUrl}
                    className="w-full"
                    disabled={!shareUrl}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy Shareable Link
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Connect; 