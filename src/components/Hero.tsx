import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { useInView } from '@/lib/animations';

const Hero: React.FC = () => {
  const { ref, isInView } = useInView();
  
  return (
    <section 
      ref={ref as React.RefObject<HTMLDivElement>} 
      className="pt-24 pb-16 md:pt-28 md:pb-24 overflow-hidden"
    >
      <div className="section-container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-6">
          {/* Text content */}
          <div className="max-w-2xl lg:max-w-lg">
            <div className={`transition-all duration-700 delay-75 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/20 mb-6">
                More Coming Soon
              </span>
            </div>
            
            <h1 className={`heading-xl mb-6 transition-all duration-700 delay-150 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Where Digital 
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent"> Meets</span> Classical Chess
            </h1>
            
            <p className={`text-lg text-chesslink-500 mb-8 transition-all duration-700 delay-300 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Experience chess like never before with our smart chessboard that tracks moves, offers guidance, and connects to your digital devices.
            </p>
            
            <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 transition-all duration-700 delay-450 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <a href="#features" className="btn-accent rounded-full">
                Explore Features
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
              {/* <a href="/demo" className="btn-secondary rounded-full">
                <Play className="mr-2 h-4 w-4" />
                Interactive Demo
              </a> */}
            </div>
          </div>
          
          {/* Image/Visual */}
          <div className={`w-full lg:w-1/2 transition-all duration-1000 delay-500 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl blur-xl opacity-20 animate-subtle-pulse"></div>
              <div className="glass-card p-6 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1586165368502-1bad197a6461?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2346&q=80" 
                  alt="ChessLink Smart Board" 
                  className="w-full h-auto rounded-xl shadow-soft object-cover"
                />
                <div className="absolute bottom-10 left-10 right-10 glass-card p-4 animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-gray-800">Move detected: e2 to e4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
