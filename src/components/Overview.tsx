import React from 'react';
import { Cpu, LucideMonitor, Info, Cable, Link, Settings, Share2 } from 'lucide-react';
import { useAnimatedRef } from '@/lib/animations';

const Overview: React.FC = () => {
  const [hardwareRef, isHardwareVisible] = useAnimatedRef<HTMLDivElement>();
  const [softwareRef, isSoftwareVisible] = useAnimatedRef<HTMLDivElement>();
  const [integratedRef, isIntegratedVisible] = useAnimatedRef<HTMLDivElement>();
  
  return (
    <div className="bg-white">
      {/* Hardware Overview */}
      <section id="hardware" className="py-24" ref={hardwareRef}>
        <div className="section-container">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className={`w-full lg:w-1/2 transition-all duration-1000 ${isHardwareVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <div className="glass-card p-6 relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/5 z-0"></div>
                <div className="relative z-10">
                  <img 
                    src="/img/chesslink_hardware.jpeg" 
                    alt="ChessLink Hardware" 
                    className="w-full h-auto rounded-xl shadow-soft"
                  />
                </div>
              </div>
            </div>
            
            <div className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${isHardwareVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <span className="subheading flex items-center">
                <Cpu className="mr-2 h-4 w-4" />
                Hardware Overview
              </span>
              <h2 className="heading-md mb-6">Precision Engineering Meets Classic Design</h2>
              
              <div className="space-y-6 text-chesslink-500">
                <p>
                  ChessLink's hardware combines elegance with advanced technology. Our chessboard uses embedded sensors to precisely detect every piece movement without compromising the traditional chess experience.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 rounded-full bg-blue-50 p-1 mt-1">
                      <Info className="h-4 w-4 text-accent" />
                    </div>
                    <div className="ml-3">
                      <p><strong className="font-medium text-gray-900">Sensors:</strong> Phototransistors and LEDs detect when pieces are moved with perfect accuracy.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 rounded-full bg-blue-50 p-1 mt-1">
                      <Info className="h-4 w-4 text-accent" />
                    </div>
                    <div className="ml-3">
                      <p><strong className="font-medium text-gray-900">LEDs:</strong> Embedded in the board to provide guidance for moves and highlight errors.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 rounded-full bg-blue-50 p-1 mt-1">
                      <Info className="h-4 w-4 text-accent" />
                    </div>
                    <div className="ml-3">
                      <p><strong className="font-medium text-gray-900">Microcontroller:</strong> 4 Arduino Nanos read sensor data and communicate with the web app.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Software Overview */}
      <section id="software" className="py-24 bg-gray-50" ref={softwareRef}>
        <div className="section-container">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className={`w-full lg:w-1/2 transition-all duration-1000 ${isSoftwareVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="glass-card p-6 relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/10 to-blue-400/5 z-0"></div>
                <div className="relative z-10">
                  <img 
                    src="/img/chesslink_software.jpeg" 
                    alt="ChessLink Software" 
                    className="w-full h-auto rounded-xl shadow-soft"
                  />
                </div>
              </div>
            </div>
            
            <div className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${isSoftwareVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <span className="subheading flex items-center">
                <LucideMonitor className="mr-2 h-4 w-4" />
                Software Overview
              </span>
              <h2 className="heading-md mb-6">Intelligent Interface, Seamless Experience</h2>
              
              <div className="space-y-6 text-chesslink-500">
                <p>
                  Our web application complements the physical chessboard with powerful digital capabilities, 
                  enabling game recording, analysis, and more. The data flow is straightforward and efficient:
                </p>
                
                <ol className="space-y-6 relative border-l border-gray-200 pl-6 ml-3">
                  <li className="relative">
                    <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 border border-white">
                      <span className="text-xs font-medium text-accent">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Board Sensors → Arduino</h3>
                      <p className="text-sm">As soon as you move a piece, the board's sensors note the change in position.</p>
                    </div>
                  </li>
                  <li className="relative">
                    <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 border border-white">
                      <span className="text-xs font-medium text-accent">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Arduino → Web App</h3>
                      <p className="text-sm">The Arduino sends the move data via serial or other communication channel to our Node.js-based server.</p>
                    </div>
                  </li>
                  <li className="relative">
                    <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 border border-white">
                      <span className="text-xs font-medium text-accent">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Web App & Database</h3>
                      <p className="text-sm">Logs moves, stores games, and delivers real-time visual updates with analysis features.</p>
                    </div>
                  </li>
                  <li className="relative">
                    <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 border border-white">
                      <span className="text-xs font-medium text-accent">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Feedback to the Board</h3>
                      <p className="text-sm">LED lights or audio prompts may be triggered based on the game state or training mode settings.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated System */}
      <section id="integrated" className="py-24" ref={integratedRef}>
        <div className="section-container">
          <div className="text-center mb-12">
            <span className="subheading flex items-center justify-center">
              <Share2 className="mr-2 h-4 w-4" />
              Integration
            </span>
            <h2 className="heading-lg">Seamless Connection Between Hardware and Software</h2>
            <p className="max-w-3xl mx-auto text-chesslink-500 mt-4">
              See how our hardware and software components work together to create a complete chess experience.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className={`w-full lg:w-1/2 transition-all duration-1000 ${isIntegratedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="glass-card p-6 relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-blue-400/10 z-0"></div>
                <div className="relative z-10">
                  <img 
                    src="/img/hardware_software.jpeg" 
                    alt="ChessLink Integrated System" 
                    className="w-full h-auto rounded-xl shadow-soft"
                  />
                </div>
              </div>
            </div>
            
            <div className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${isIntegratedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <span className="subheading flex items-center">
                <Cable className="mr-2 h-4 w-4" />
                How It All Connects
              </span>
              <h2 className="heading-md mb-6">Bridging Physical and Digital Chess</h2>
              
              <div className="space-y-6 text-chesslink-500">
                <p>
                  ChessLink creates a seamless connection between the physical chessboard and our digital platform.
                  Here's how the complete system works together:
                </p>
                
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">Connection Flow</h3>
                  <ul className="space-y-5">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 rounded-full bg-blue-50 p-1.5 mt-1">
                        <Settings className="h-5 w-5 text-accent" />
                      </div>
                      <div className="ml-4">
                        <p><strong className="font-medium text-gray-900">Physical to Digital:</strong> The board's sensors detect piece movements, which the Arduino microcontroller translates into chess notation.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 rounded-full bg-blue-50 p-1.5 mt-1">
                        <Cable className="h-5 w-5 text-accent" />
                      </div>
                      <div className="ml-4">
                        <p><strong className="font-medium text-gray-900">Data Transmission:</strong> Move data is sent via USB connection or wireless module (Bluetooth/Wi-Fi) to your computer or mobile device.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 rounded-full bg-blue-50 p-1.5 mt-1">
                        <Link className="h-5 w-5 text-accent" />
                      </div>
                      <div className="ml-4">
                        <p><strong className="font-medium text-gray-900">Bidirectional Communication:</strong> The web application not only receives move data but can also send commands back to the board, triggering LED indicators or move suggestions.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 rounded-full bg-blue-50 p-1.5 mt-1">
                        <LucideMonitor className="h-5 w-5 text-accent" />
                      </div>
                      <div className="ml-4">
                        <p><strong className="font-medium text-gray-900">Real-time Synchronization:</strong> Any move made on the physical board instantly appears in the digital interface, and analysis can be viewed immediately.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
