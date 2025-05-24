
import React from 'react';
import { Zap, Wifi, BadgeDollarSign, CloudLightning, LayoutDashboard, BarChart3, Speaker, Lightbulb, Brain } from 'lucide-react';
import { useSequentialAnimation } from '@/lib/animations';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isVisible: boolean;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, isVisible, index }) => {
  const staggerDelay = index * 0.15; // 150ms between animations
  
  return (
    <div 
      className={`feature-card transition-all duration-700 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-16'
      }`}
      style={{ transitionDelay: `${staggerDelay}s` }}
    >
      <div className="rounded-full bg-blue-50 w-12 h-12 flex items-center justify-center mb-4">
        <div className="text-accent">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-chesslink-500">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap size={20} />,
      title: 'Real-Time Move Tracking',
      description: 'Detects piece movements via sensors and updates a digital interface instantly.'
    },
    {
      icon: <Lightbulb size={20} />,
      title: 'LED Feedback',
      description: 'Highlights valid moves, checks, or other important chess events with intuitive lighting.'
    },
    {
      icon: <Speaker size={20} />,
      title: 'Audio Prompts',
      description: 'Announces moves and signals special situations like check or checkmate.'
    },
    {
      icon: <Wifi size={20} />,
      title: 'Online Integration',
      description: 'Syncs with our web application to record games and provide analysis.'
    },
    {
      icon: <Brain size={20} />,
      title: 'Training Mode',
      description: 'Offers real-time suggestions and visual/audio guidance for learning. Both on the board and on the app.'
    },
    {
      icon: <BarChart3 size={20} />,
      title: 'Analysis Mode',
      description: 'Provides post-game data and best-move recommendations to improve your game.'
    },
    {
      icon: <LayoutDashboard size={20} />,
      title: 'Complete Piece Detection',
      description: 'Detects pieces regardless of starting position and even illegal moves, chess960 positions, and chess variants like Bughouse.'
    },
    {
      icon: <BadgeDollarSign size={20} />,
      title: 'Low Cost',
      description: 'Completely open-source hardware and software solutions for everyone, from casual players to serious competitors. Total engineering costs are less than $30.'
    },
    {
      icon: <CloudLightning size={20} />,
      title: 'Quick Setup',
      description: 'Easily set up and connect to your devices in minutes, with no complicated installation required.'
    }
  ];

  const { containerRef, visibleItems } = useSequentialAnimation(features.length);

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="section-container" ref={containerRef}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="subheading">Features</span>
          <h2 className="heading-lg mb-6">Redefining Chess Experience</h2>
          <p className="text-lg text-chesslink-500">
            ChessLink combines the traditional tactile experience of chess with cutting-edge technology, 
            offering features that enhance both play and learning.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              isVisible={visibleItems[index]}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
