import React from 'react';
import { Linkedin } from 'lucide-react';
import { useInView } from '@/lib/animations';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  linkedin: string;
}

const Team: React.FC = () => {
  const { ref, isInView } = useInView();

  const teamMembers: TeamMember[] = [
    {
      name: 'Victor Zheng',
      role: 'Project Lead',
      image: '/img/team/victor.jpeg',
      linkedin: 'https://www.linkedin.com/in/victor-zheng1/'
    },
    {
      name: 'Jaffar Keikei',
      role: 'Software Engineer',
      image: '/img/team/jaffar.jpeg',
      linkedin: 'https://www.linkedin.com/in/jaffarkeikei/'
    },
    {
      name: 'Kevin Li',
      role: 'Lead Hardware Engineer',
      image: '/img/team/kevin.jpeg',
      linkedin: 'https://www.linkedin.com/in/kevin-li-923540178/'
    },
    {
      name: 'Chiatzen Wang',
      role: 'Design Engineer',
      image: '/img/team/chiatzen.jpeg',
      linkedin: 'https://www.linkedin.com/in/chiatzen-wang/'
    }
  ];

  return (
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div 
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-700 transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-chesslink-800 mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The brilliant minds behind ChessLink, combining expertise in hardware design, 
            software development, and a passion for chess.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={member.name}
              className={`text-center transition-all duration-700 delay-${index * 150} transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="mb-4 relative group mx-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur-md opacity-20 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative rounded-full overflow-hidden w-40 h-40 mx-auto">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <a 
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-chesslink-600 bg-opacity-0 flex items-center justify-center hover:bg-opacity-70 transition-all duration-300"
                  >
                    <Linkedin className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                  </a>
                </div>
              </div>
              <h3 className="text-xl font-bold text-chesslink-700 mb-1">{member.name}</h3>
              <p className="text-gray-500">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
