import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Game = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(new Chess());
  const [lastMove, setLastMove] = useState("");
  const [playerWhite, setPlayerWhite] = useState("Player 1");
  const [playerBlack, setPlayerBlack] = useState("Player 2");
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(1);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // In a real implementation, this would connect to a WebSocket or similar
  // to receive real-time updates from the server
  useEffect(() => {
    // Display toast to show connection status
    toast.success(`Connected to game ${gameId}`);

    // This simulates receiving game updates from the server
    // In production, this would be replaced with WebSocket connection
    const interval = setInterval(() => {
      // Simulate other viewers joining
      if (Math.random() < 0.1 && viewerCount < 25) {
        setViewerCount(prev => prev + 1);
        toast.info(`New spectator joined! (${viewerCount + 1} watching)`);
      }

      // Randomly decide whether to make a move (10% chance)
      if (Math.random() < 0.1 && isLive && !game.isGameOver()) {
        const possibleMoves = game.moves();
        if (possibleMoves.length > 0) {
          // Make a random legal move
          const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          
          const newGame = new Chess(game.fen());
          newGame.move(move);
          
          // Add to history
          setMoveHistory(prev => [...prev, move]);
          
          setLastMove(move);
          setGame(newGame);
          
          // Show toast notification for the move
          toast.info(`Move played: ${move}`);
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(interval);
      toast.info("Disconnected from live game");
    };
  }, [game, gameId, isLive, viewerCount]);

  // Function to get game status text
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Live Chess Game</h1>
        <p className="text-muted-foreground">Game ID: {gameId}</p>
        <div className="mt-2 flex justify-center items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">Live</Badge>
          <Badge variant="outline">{viewerCount} watching</Badge>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left sidebar - Game info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Players</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white border border-black rounded-full"></div>
                      {playerWhite}
                    </span>
                    <Badge variant={game.turn() === 'w' ? "default" : "outline"}>
                      {game.turn() === 'w' ? "To Move" : ""}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                      {playerBlack}
                    </span>
                    <Badge variant={game.turn() === 'b' ? "default" : "outline"}>
                      {game.turn() === 'b' ? "To Move" : ""}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  <p>{getGameStatus()}</p>
                  {lastMove && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Last move:</span>
                      <Badge variant="secondary" className="ml-2">
                        {lastMove}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Center - Chessboard */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Board</CardTitle>
              <CardDescription>
                Moves are displayed in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square">
                <Chessboard 
                  position={game.fen()} 
                  boardWidth={350}
                  areArrowsAllowed={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right sidebar - Move history */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Move History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] overflow-y-auto">
                {moveHistory.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {moveHistory.map((move, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-md ${index % 2 === 0 ? 'bg-muted' : ''}`}
                      >
                        <span className="font-mono">
                          {index % 2 === 0 ? Math.ceil((index + 1) / 2) + '. ' : ''}
                          {move}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No moves yet
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

export default Game; 