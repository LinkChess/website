const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment info logging
console.log('Newsletter API starting up...');
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Basic health check endpoint
app.get('/api/newsletter/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Newsletter subscription endpoint
app.post('/api/newsletter', async (req, res) => {
  let email = req.body.email;
  
  if (!email) {
    console.error('No email provided in request body');
    return res.status(400).json({ error: 'Email is required' });
  }
  
  console.log(`Received a newsletter submission: ${email}`);
  
  if (!process.env.EMAIL_TOKEN) {
    console.error('EMAIL_TOKEN environment variable is not set');
    return res.redirect('/confirmation?status=error&reason=configuration');
  }
  
  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.EMAIL_TOKEN}`,
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
        return res.redirect('/confirmation?status=already_exists');
      }
      else if (responseData.email_address === email) {
        // on success, we expect to get the email address back
        console.log('Successfully added subscriber');
        return res.redirect('/confirmation');
      }
      
      // Default error handler
      return res.redirect('/confirmation?status=error');
      
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      return res.redirect('/confirmation?status=error');
    }
  } catch (error) {
    console.error('Error sending to Buttondown API:', error);
    return res.redirect('/confirmation?status=error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Newsletter API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/newsletter/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/newsletter`);
  
  // Check if token is set
  if (!process.env.EMAIL_TOKEN) {
    console.warn('WARNING: EMAIL_TOKEN environment variable is not set!');
    console.warn('The API will not work correctly without this token.');
    console.warn('Please update the .env file with your Buttondown API token.');
  }
});
