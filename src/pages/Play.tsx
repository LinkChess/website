import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Chess from '@/components/Chess';

const PlayPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <div className="py-10 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Play Chess</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the ChessLink system with a full-featured digital chessboard.
              Play against a friend or challenge our computer opponent.
            </p>
          </div>
        </div>
        
        {/* Chess Game Section */}
        <section className="py-12 container mx-auto px-4">
          <Chess className="mb-10" />
          
          <div className="max-w-3xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">How to Play</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Making Moves</h3>
                <p className="text-gray-600">
                  Click on a piece to select it (highlighted in yellow), then click on a valid destination 
                  (highlighted in green) to move. The game automatically enforces all chess rules.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Game Modes</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li><strong>Human vs Human</strong> - Play against a friend on the same device</li>
                  <li><strong>Human vs Computer</strong> - Challenge our AI with three difficulty levels</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Special Moves</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li><strong>Castling</strong> - Select your king and click on the destination two squares away</li>
                  <li><strong>En Passant</strong> - Automatically handled when valid</li>
                  <li><strong>Pawn Promotion</strong> - Automatically promotes to queen (future update will allow selection)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Game Information</h3>
                <p className="text-gray-600">
                  Track moves in the history panel on the right. The game status displays above the board.
                  Click "Game Info" to see technical details like FEN notation.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 className="text-lg font-medium mb-2 text-blue-700">Coming Soon</h3>
                <p className="text-blue-600">
                  This digital chess interface demonstrates the software capabilities of the ChessLink system. 
                  Future updates will include connectivity with the physical ChessLink board, online play, 
                  and advanced training features.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default PlayPage; 