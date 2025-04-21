import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const Connect = () => {
  const [pgn, setPgn] = useState("");

  const handleAddGame = () => {
    // Placeholder for game addition functionality
    console.log("Adding game with PGN:", pgn);
    // Here you would typically process the PGN or redirect to another page
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Chess Game Visualizer</CardTitle>
          <CardDescription>
            Enter PGN notation to visualize and analyze chess games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Paste PGN here..."
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <Button 
              onClick={handleAddGame}
              className="w-full"
            >
              Add Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Connect; 