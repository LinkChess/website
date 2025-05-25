import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const { EMAIL_TOKEN } = process.env;

export const handler: Handler = async (event) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or your specific domains
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  console.log('Received request to api-newsletter:', { 
    headers: event.headers,
    path: event.path,
    httpMethod: event.httpMethod,
    body: event.body ? event.body.substring(0, 100) : null // Log first 100 chars of body
  });

  // Parse the email from form data or JSON
  let email: string;
  
  try {
    // Try parsing as JSON first
    if (event.body) {
      const body = JSON.parse(event.body);
      email = body.email;
    } else {
      throw new Error('Empty request body');
    }
  } catch (error) {
    // If JSON parsing fails, try handling form data
    if (event.body && event.body.includes('email=')) {
      const params = new URLSearchParams(event.body);
      email = params.get('email') || '';
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request format' })
      };
    }
  }
  
  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email is required' })
    };
  }
  
  console.log(`Received a newsletter submission: ${email}`);
  
  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${EMAIL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    });

    const responseText = await response.text();
    console.log('Buttondown API response:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      
      if (responseData.code === 'email_already_exists') {
        console.log('Email already exists');
        return {
          statusCode: 302,
          headers: {
            ...headers,
            'Location': '/confirmation?status=already_exists',
          },
        };
      }
      else if (responseData.email_address === email) {
        // on success, we expect to get the email address back
        console.log('Successfully added subscriber');
        return {
          statusCode: 302,
          headers: {
            ...headers,
            'Location': '/confirmation',
          },
        };
      }
      
      // Default error handler
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': '/confirmation?status=error',
        },
      };
      
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': '/confirmation?status=error',
        },
      };
    }
  } catch (error) {
    console.error('Error sending to Buttondown API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process subscription' })
    };
  }
};
