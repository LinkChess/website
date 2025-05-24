/**
 * API service for ChessLink application
 * Handles all API requests to the backend server
 */

// The base URL for the API (development and production environments)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765';

/**
 * Newsletter subscription API
 */
export const newsletterApi = {
  /**
   * Subscribe an email to the newsletter
   * @param email - The email to subscribe
   * @returns Promise with the subscription result
   */
  subscribe: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error;
    }
  },
  
  /**
   * Get all newsletter subscribers (admin only)
   * @param adminKey - The admin key for authentication
   * @returns Promise with the list of subscribers
   */
  getSubscribers: async (adminKey: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribers?admin_key=${adminKey}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
  }
};
