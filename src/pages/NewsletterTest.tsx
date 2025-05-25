import React, { useState } from 'react';

const NewsletterTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectFunction = async () => {
    setLoading(true);
    setResult('Testing direct function call...');
    try {
      const response = await fetch('/.netlify/functions/api-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      
      setResult(`Direct function result: ${response.status} ${response.statusText}, Redirected: ${response.redirected}, URL: ${response.url}`);
    } catch (error) {
      setResult(`Direct function error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiEndpoint = async () => {
    setLoading(true);
    setResult('Testing API endpoint...');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      
      setResult(`API endpoint result: ${response.status} ${response.statusText}, Redirected: ${response.redirected}, URL: ${response.url}`);
    } catch (error) {
      setResult(`API endpoint error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Newsletter API Test</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={testDirectFunction}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Direct Function
        </button>
        
        <button 
          onClick={testApiEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test API Endpoint
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Troubleshooting Notes:</h2>
        <ul className="list-disc pl-6">
          <li>If both tests fail, check your CORS configuration and network settings</li>
          <li>If direct function works but API endpoint fails, check your redirect configuration</li>
          <li>If redirects work but no redirection happens, check the redirect implementation in the function</li>
        </ul>
      </div>
    </div>
  );
};

export default NewsletterTest;
