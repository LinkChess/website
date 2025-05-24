import { Handler, HandlerEvent } from '@netlify/functions'
import fetch from 'node-fetch';

const { EMAIL_TOKEN } = process.env

// following https://andrewstiefel.com/netlify-functions-email-subscription/

const handler: Handler = async function (event: HandlerEvent) {
  // your server-side functionality
  let email: string;
  
  try {
    // Try parsing as JSON first
    if (event.body) {
      const body = JSON.parse(event.body);
      email = body.payload?.email || body.email;
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
        body: JSON.stringify({ error: 'Invalid request format' })
      };
    }
  }
  
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email is required' })
    };
  }
  
  console.log(`Received a submission: ${email}`);
  
  const response = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${EMAIL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  let responseText = await response.text();
  console.log('response:', responseText);
  return {
      statusCode: 302,
      headers: {
          'Location': '/confirmation',
      },
  }
}

export { handler };