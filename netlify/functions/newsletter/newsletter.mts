import { Context } from '@netlify/functions'

const { EMAIL_TOKEN } = process.env
import fetch from 'node-fetch';

// following https://andrewstiefel.com/netlify-functions-email-subscription/

exports.handler = async function (event, context) {
  // your server-side functionality
  const email = JSON.parse(event.body).payload.email
  console.log(`Received a submission: ${email}`)
  
  const response = await fetch( 'https://api.buttondown.email/v1/subscribers', {
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
          'Location': '/confirmation/',
      },
  }
}