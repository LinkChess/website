import React, { useState } from 'react';
import { newsletterApi } from '../lib/api';

// Define TypeScript interfaces for our data
interface Subscriber {
  email: string;
  subscribed_at: string;
}

const SubscriberAdmin: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await newsletterApi.getSubscribers(adminKey);
      
      if (data.success) {
        setSubscribers(data.subscribers);
        setCount(data.count);
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Failed to fetch subscribers');
        setIsAuthenticated(false);
      }
    } catch (error) {
      setError('Failed to connect to the server');
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers();
  };

  const exportCsv = () => {
    if (subscribers.length === 0) return;
    
    // Create CSV content
    const headers = 'Email,Subscribed At\n';
    const rows = subscribers.map(sub => 
      `"${sub.email}","${sub.subscribed_at}"`
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscribers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and remove link
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Newsletter Subscriber Management</h1>
      
      {!isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              className="flex-grow px-4 py-2 border rounded"
              required
            />
            <button 
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Authenticate'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </form>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Subscribers ({count})</h2>
              <p className="text-gray-600 text-sm">Manage your newsletter subscribers</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => fetchSubscribers()} 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Refresh
              </button>
              <button 
                onClick={exportCsv} 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                disabled={subscribers.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>
          
          {loading ? (
            <p className="text-center py-8">Loading subscribers...</p>
          ) : subscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Email</th>
                    <th className="border p-3 text-left">Subscription Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border p-3">{sub.email}</td>
                      <td className="border p-3">{new Date(sub.subscribed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No subscribers found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SubscriberAdmin;
