import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConfirmationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <div className="py-20 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Subscription Confirmed</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thank you for subscribing to the ChessLink newsletter!
            </p>
          </div>
        </div>
        
        {/* Confirmation Content */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={40} className="text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Subscription Successful</h2>
              
              <p className="text-gray-600 mb-6">
                You have been successfully added to our newsletter. We'll keep you updated on our latest 
                developments, announcements, and early access opportunities.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-medium mb-2 text-blue-700">What to expect</h3>
                <ul className="text-blue-600 text-left list-disc pl-5 space-y-1">
                  <li>Development updates and progress reports</li>
                  <li>Announcements of new features</li>
                  <li>Early access opportunities to beta versions</li>
                  <li>Invitations to community events and webinars</li>
                </ul>
              </div>
              
              <Link 
                to="/" 
                className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
              >
                <ArrowLeft className="mr-2" size={16} />
                Return to Homepage
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConfirmationPage;
