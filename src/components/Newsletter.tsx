import React, { FormEvent, useState } from 'react';
import { Mail } from 'lucide-react';

const Newsletter: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    try {
      // First try using the API endpoint which will be handled by redirects
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      console.log('Form submission response:', {
        status: response.status,
        redirected: response.redirected,
        url: response.url
      });
      
      // Handle redirect from response
      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        window.location.href = '/confirmation';
      } else {
        window.location.href = '/confirmation?status=error';
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      window.location.href = '/confirmation?status=error';
    } finally {
      setIsSubmitting(false);
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
          <form 
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto pageclip-form"
          >
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              className="flex-grow px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Email address"
              required
            />
            <button 
              type="submit" 
              className="button pageclip-form__submit bg-accent hover:bg-accent-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
            </form>

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
            <a 
              href="https://www.youtube.com/watch?v=CkrfsJtZPF4" 
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
