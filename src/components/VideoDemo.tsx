import React from 'react';

const VideoDemo: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50" id="video-demo">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See ChessLink in Action</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch our demonstration video to see how ChessLink brings physical chess into the digital age
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto relative" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe 
            src="https://www.youtube.com/embed/CkrfsJtZPF4" 
            title="ChessLink Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-xl"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default VideoDemo;
