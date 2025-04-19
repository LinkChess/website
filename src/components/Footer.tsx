
import React from 'react';
import { Github, Twitter, Facebook, Instagram, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-chesslink-950 text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <a href="#" className="text-2xl font-bold text-white mb-4 block">
              ChessLink
            </a>
            <p className="text-gray-400 mb-6">
              Where digital innovation meets classical chess, creating a new way to play, learn, and enjoy the world's most enduring strategy game.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#hardware" className="text-gray-400 hover:text-white transition-colors">Hardware</a></li>
              <li><a href="#software" className="text-gray-400 hover:text-white transition-colors">Software</a></li>
              <li><a href="#demo" className="text-gray-400 hover:text-white transition-colors">Demo</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div id="contact">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-400">
                <Mail size={18} className="mr-2" />
                <a href="mailto:info@chesslink.com" className="hover:text-white transition-colors">info@chesslink.com</a>
              </li>
            </ul>
            <div className="mt-6">
              <a href="https://github.com/lklkevin/chesslink" className="btn-accent rounded-md inline-block">View on GitHub</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} ChessLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
