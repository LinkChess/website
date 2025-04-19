import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Demo from '@/components/Demo';

const DemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <div className="py-10 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">ChessLink Interactive Demo</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience how the ChessLink system detects, processes, and visualizes chess moves in real-time.
              This demo showcases the core functionality of our smart chessboard.
            </p>
          </div>
        </div>
        
        <Demo />
        
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">How This Demo Works</h2>
            
            <div className="prose prose-lg max-w-none">
              <p>
                This interactive demonstration simulates the key functionality of the ChessLink system:
              </p>
              
              <h3>What You Can Do</h3>
              <ul>
                <li><strong>Connect/Disconnect the Board</strong> - Simulates establishing a connection with the physical chessboard</li>
                <li><strong>Simulate Moves</strong> - Demonstrates how sensor data flows through the system when a piece is moved</li>
                <li><strong>Reset Demo</strong> - Returns the board to its starting position</li>
              </ul>
              
              <h3>System Visualization</h3>
              <p>
                The demo visualizes several key aspects of the ChessLink system:
              </p>
              
              <ul>
                <li><strong>Board State</strong> - Shows the current position using chess piece symbols</li>
                <li><strong>Sensor Activation</strong> - Highlights squares when sensors detect piece movement</li>
                <li><strong>Data Flow</strong> - Shows a real-time log of data processing through the system</li>
                <li><strong>Hardware & Software Components</strong> - Provides information about the system architecture</li>
              </ul>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                <h4 className="text-lg font-medium text-yellow-800 mb-2">Note About This Demo</h4>
                <p className="text-yellow-800">
                  This is a simulated demonstration. In the actual ChessLink system, the physical board contains real sensors that detect piece movements, 
                  with the data processed by an ESP32-C3 microcontroller and Arduino Nano co-processor.
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

export default DemoPage; 