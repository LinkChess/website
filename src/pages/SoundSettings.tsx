import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SoundTest from '@/components/SoundTest';

const SoundSettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <div className="py-20 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Sound Settings</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Configure and test the audio features of your ChessLink system. 
              Customize sound effects and speech announcements for human-to-human games.
            </p>
          </div>
        </div>
        
        {/* Sound Test Section */}
        <section className="py-12 container mx-auto px-4">
          <SoundTest />
          
          <div className="max-w-3xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">About Chess Sound Features</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Sound Effects</h3>
                <p className="text-gray-600">
                  ChessLink provides realistic sound effects for various chess events, enhancing the immersive 
                  experience of your games. Hear distinct sounds for moves, captures, checks, and special moves.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Speech Announcements</h3>
                <p className="text-gray-600">
                  The speech synthesis system converts chess moves into natural language announcements.
                  This feature is particularly helpful for learning chess notation and for players with visual impairments.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Accessibility Benefits</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Allows players to focus on the board while still tracking game progress</li>
                  <li>Provides audio confirmation of moves and game events</li>
                  <li>Makes chess more accessible for players with visual impairments</li>
                  <li>Helps beginners learn chess terminology through audio reinforcement</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Setting Up Sound Files</h3>
                <p className="text-gray-600">
                  ChessLink requires sound files to be placed in the <code>/public/sounds/</code> directory.
                  Please refer to the setup guide in that directory for instructions on obtaining
                  and configuring the necessary sound files.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 className="text-lg font-medium mb-2 text-blue-700">Browser Compatibility</h3>
                <p className="text-blue-600">
                  Sound effects and speech synthesis require a modern web browser with audio capabilities.
                  Some browsers may require user interaction before playing audio. If you experience issues,
                  try clicking somewhere on the page before testing sounds.
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

export default SoundSettingsPage; 