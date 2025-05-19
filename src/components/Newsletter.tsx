import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useFormspark } from "@formspark/use-formspark";

const formId = "ce41wqsoj";

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Initialize Formspark at the component level (not inside a handler)
  const [submit, submitting] = useFormspark({
    formId: formId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Submit the email to Formspark with more detailed logging
      console.log('Attempting to submit to Formspark with form ID:', formId);
      await submit({ 
        email: email,
        source: 'ChessLink Newsletter',
        submitted_at: new Date().toISOString()
      });
      
      console.log('Form submission successful');
      // Handle successful submission
      setSubscribed(true);
      setMessage('Thank you for subscribing!');
      setEmail('');
    } catch (err) {
      console.error('Formspark submission error:', err);
      // More descriptive error message
      setError('Unable to subscribe at this time. Please try again later or contact us at info@chesslink.site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gray-100" id="newsletter">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Mail size={40} className="mx-auto mb-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated on ChessLink</h2>
          <p className="text-xl text-gray-600 mb-8">
            Subscribe to our newsletter to receive development updates, announcements, and early access opportunities.
          </p>
          
          {subscribed ? (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg">
              <p className="font-medium">{message || 'Thank you for subscribing!'}</p>
              <p className="text-sm mt-1">We'll keep you updated on all things ChessLink.</p>
            </div>
          ) : (
            <>
              {/* React form with Formspark hook */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-grow px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Email address"
                />
                <button 
                  type="submit" 
                  className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  {submitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              
              {/* Fallback message in case of repeated errors */}
            </>
          )}
          
          {error && (
            <p className="text-red-500 mt-3">{error}</p>
          )}
          
          <div className="mt-8 text-gray-500">
            <p className="text-sm">
              We respect your privacy. No spam, just updates on our product and chess-related news.
            </p>
          </div>
          
          <div className="flex justify-center mt-8 space-x-6">
            <a 
              href="https://github.com/LinkChess" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            {/* <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a> */}
            <a 
              href="https://www.youtube.com/watch?v=IZxIWcn1aSM" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
