import React, { useState, useEffect } from 'react';

// Define the image data structure with captions
interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

// Define page themes
interface PageTheme {
  title: string;
  description: string;
}

const Gallery: React.FC = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 9; // 6 images per page in a 3x2 grid

  // Define themes for each page
  const pageThemes: PageTheme[] = [
    {
      title: "Early Prototyping & Design",
      description: "Explore the initial design phase of ChessLink. These images showcase our team's engineering process, 3D printing experiments, and circuit design planning."
    },
    {
      title: "Development & Testing",
      description: "Follow the journey of ChessLink through development and testing. See how we refined our prototypes and conducted quality testing to ensure reliable performance."
    },
    {
      title: "Final Product & Demonstrations",
      description: "See the completed ChessLink in action. These images highlight the final product design, real-world demonstrations, and our team showcasing the technology."
    }
  ];

  // List of gallery images with captions
  const images: GalleryImage[] = [
    // PAGE 1: Early Prototyping & Design
    {
      src: '/img/gallery/whiteboard.jpg',
      alt: 'Initial design planning',
      caption: 'Early brainstorming and design planning on the whiteboard'
    },
    {
      src: '/img/gallery/easyeda.jpg',
      alt: 'PCB design',
      caption: 'Designing the PCB layout using EasyEDA'
    },
    {
      src: '/img/gallery/different-3dprints.jpg',
      alt: '3D printing iterations',
      caption: 'Different iterations of 3D printed components for the chess board'
    },
    {
      src: '/img/gallery/version-1-pcb.png',
      alt: 'Version 1 PCB design',
      caption: 'The first version of our PCB design for ChessLink'
    },
    {
      src: '/img/gallery/first-setup.jpg',
      alt: 'The first setup',
      caption: 'The first setup of our prototype with basic components for sensing'
    },
    {
      src: '/img/gallery/sizing.jpg',
      alt: 'Component sizing',
      caption: 'Testing the size and fit of various components'
    },
    {
      src: '/img/gallery/version-1-setup.jpg',
      alt: 'Version 1 prototype setup',
      caption: 'The first complete prototype setup ready for testing'
    },
    {
      src: '/img/gallery/v1-setup.jpg',
      alt: 'Testing environment',
      caption: 'Testing environment for our version 1 prototype'
    },
    {
      src: '/img/gallery/stickers.jpg',
      alt: 'Using stickers for piece detection',
      caption: 'Calibrating the sensors using stickers on the chess pieces'
    },
    // PAGE 2: Development & Testing
    {
      src: '/img/gallery/microscope.jpg',
      alt: 'Microscope inspection',
      caption: 'Using a microscope to inspect circuit components'
    },
    {
      src: '/img/gallery/scope.jpg',
      alt: 'Oscilloscope testing',
      caption: 'Testing signal quality with an oscilloscope'
    },
    {
      src: '/img/gallery/esp32-i2c.jpg',
      alt: 'ESP32 I2C bus implementation',
      caption: 'Using a protoboard to implement I2C communication with the ESP32'
    },
    {
       src: '/img/gallery/kevin-fusion.jpg',
      alt: 'Fusion 360 design',
      caption: 'Using Fusion 360 for 3D modeling and design'
    },
    {
      src: '/img/gallery/jaffar-soldering.jpg',
      alt: 'Soldering components',
      caption: 'Jaffar soldering components onto the PCB'
    },
    {
      src: '/img/gallery/bambu.png',
      alt: 'Using Bambu Studio',
      caption: '3D printing with Bambu Studio for rapid prototyping prints'
    },
    {
      src: '/img/gallery/calibration.jpg',
      alt: 'Sensor calibration',
      caption: 'Calibrating the sensors for accurate chess piece detection'
    },
    {
      src: '/img/gallery/pcb-layout.jpeg',
      alt: 'Full layout of all 4 pcbs',
      caption: 'Full layout of all the 4 pcbs'
    },
    {
      src: '/img/gallery/whiteboard.jpg',
      alt: 'Using a whiteboard to explain system design',
      caption: 'A whiteboard system design'
    },
    // PAGE 3: Final Product & Demonstrations,
    {
       src: '/img/gallery/half-board.jpg',
      alt: 'Half-completed board',
      caption: 'A half-completed chess board showing the internal structure'
    },
    {
      src: '/img/gallery/final-schematic.png',
      alt: 'Final chess board schematic',
      caption: 'The completed ChessLink smart chess board schematic'
    },
    {
      src: '/img/gallery/final-2d.png',
      alt: '2D render of final design',
      caption: '2D rendering of the final ChessLink design'
    },
    {
      src: '/img/gallery/team-demo.jpeg',
      alt: 'Team photo on demo day',
      caption: 'FLTRL: Victor Zheng, Jaffar Keikei, Kevin Li, Chiatzen Wang, Prof. Paul Dietz',
    },
    {
      src: '/img/gallery/demo-day1.jpg',
      alt: 'Demo day presentation',
      caption: 'Presenting ChessLink at our university demo day'
    },
    {
      src: '/img/gallery/demo-day2.jpg',
      alt: 'Audience interaction',
      caption: 'Visitors interacting with ChessLink at our demo'
    },
    {
      src: '/img/gallery/demo-day3.jpg',
      alt: 'ChessLink Demo Day with professors',
      caption: 'ChessLink being demonstrated at our demo day in front of fellow students, faculty, and community'
    },
    {
      src: '/img/gallery/demo-day4.jpg',
      alt: 'ChessLink Demo Day with professors',
      caption: 'ChessLink being demonstrated at our demo day in front of fellow students, faculty, and community'
    },
    {
      src: '/img/gallery/demo-day5.jpeg',
      alt: 'ChessLink Demo Day photos',
      caption: 'ChessLink being demonstrated at our demo day in front of fellow students, faculty, and community'
    }
  ];

  // State for enlarged image modal
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Calculate pagination data
  const totalPages = Math.ceil(images.length / imagesPerPage);
  
  // Get current images for the current page
  const getCurrentImages = () => {
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    return images.slice(startIndex, endIndex);
  };

  // Function to change page
  const goToPage = (pageNumber: number) => {
    setSelectedImage(null); // Close any open modal
    setCurrentPage(pageNumber);
    
    // Scroll to top of gallery when changing pages
    const galleryElement = document.getElementById('gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Function to open the modal
  const openModal = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  // Function to close the modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-chesslink-800 mb-4">
            ChessLink Gallery
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Take a visual journey through the development and usage of our ChessLink smart chess board. 
            From initial prototypes to final designs, see how we've revolutionized the chess experience.
          </p>
        </div>
        
        {/* Page Theme Section */}
        {currentPage <= pageThemes.length && (
          <div className="mb-12 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-chesslink-700 mb-3">
              {pageThemes[currentPage - 1].title}
            </h3>
            <p className="text-gray-600">
              {pageThemes[currentPage - 1].description}
            </p>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCurrentImages().map((image, index) => (
            <div 
              key={index}
              className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              onClick={() => openModal(image)}
            >
              <div className="relative pb-[75%] overflow-hidden">
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  className="absolute inset-0 object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-600 group-hover:text-chesslink-600 transition-colors duration-300">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex justify-center mt-12 space-x-2">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md flex items-center ${
              currentPage === 1 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-chesslink-600 text-white hover:bg-chesslink-700'
            } transition-colors`}
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          {/* Page number buttons */}
          <div className="flex items-center px-2 bg-white rounded-md shadow-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 mx-1 rounded-full ${
                  currentPage === page
                  ? 'bg-chesslink-600 text-white font-medium shadow-md'
                  : 'bg-white text-chesslink-600 hover:bg-gray-100'
                } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-chesslink-400`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md flex items-center ${
              currentPage === totalPages 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-chesslink-600 text-white hover:bg-chesslink-700'
            } transition-colors`}
            aria-label="Next page"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Page indicator - smaller and more elegant */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <span>Showing page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="max-w-5xl w-full bg-white rounded-xl overflow-hidden shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img 
                src={selectedImage.src} 
                alt={selectedImage.alt} 
                className="w-full object-contain max-h-[70vh]"
              />
              <button 
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all duration-200"
                onClick={closeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {/* Navigation buttons for the modal */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button 
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-r-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = images.findIndex(img => img.src === selectedImage.src);
                    const prevIndex = (currentIndex - 1 + images.length) % images.length;
                    setSelectedImage(images[prevIndex]);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button 
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-l-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = images.findIndex(img => img.src === selectedImage.src);
                    const nextIndex = (currentIndex + 1) % images.length;
                    setSelectedImage(images[nextIndex]);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-lg text-gray-800 mb-2">{selectedImage.caption}</p>
              <p className="text-sm text-gray-500">{selectedImage.alt}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
