
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Overview from '@/components/Overview';
import ChessBoard from '@/components/ChessBoard';
import VideoDemo from '@/components/VideoDemo';
import Gallery from '@/components/Gallery';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  // Add smooth scroll behavior for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href === '#') return;
        
        const targetElement = document.querySelector(href || '');
        if (targetElement) {
          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY - 80,
            behavior: 'smooth'
          });
          
          // Update URL without reload
          history.pushState(null, '', href);
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Overview />
        <VideoDemo />
        <ChessBoard />
        <Gallery />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
