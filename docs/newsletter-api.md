# Newsletter API Integration Guide

This guide explains how to set up the ChessLink newsletter API on your Linux server.

## Overview

The ChessLink application has a newsletter signup feature that needs a backend API to process submissions. This API:

1. Receives form submissions from the frontend
2. Validates the email address
3. Sends the email to Buttondown email service API
4. Redirects users to the appropriate confirmation page

## Server-side Setup

### Prerequisites

- Node.js (v14+) installed on your Linux server
- Access to add systemd services
- A Buttondown account with API token

### Installation

1. **Copy the API files to your server**:
   
   The deployment process will copy the necessary files to `/var/www/chesslink.site/server/`.

2. **Run the setup script**:

   ```bash
   cd /var/www/chesslink.site/server
   chmod +x setup-newsletter-api.sh
   sudo ./setup-newsletter-api.sh
   ```

3. **Configure your API token**:

   Edit the `.env` file to add your Buttondown API token:

   ```bash
   sudo nano /var/www/chesslink.site/server/.env
   ```

   Add your token:

   ```
   EMAIL_TOKEN=your_buttondown_api_token_here
   ```

4. **Restart the service**:

   ```bash
   sudo systemctl restart newsletter-api
   ```

### Nginx Configuration

The API needs to be accessible at `/api/newsletter`. Update your Nginx configuration to include:

```nginx
location /api/newsletter {
    proxy_pass http://localhost:3000/api/newsletter;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

A sample configuration file is available at `docs/nginx-config.conf`.

## Testing

You can test the API by submitting the newsletter form on your website or using curl:

```bash
curl -X POST -d "email=test@example.com" http://localhost:3000/api/newsletter
```

## Troubleshooting

- **Check the service status**:
  ```bash
  sudo systemctl status newsletter-api
  ```

- **View logs**:
  ```bash
  sudo journalctl -u newsletter-api
  ```

- **Common issues**:
  - Ensure the API token is correctly set in the .env file
  - Verify the Node.js version is compatible (v14+)
  - Check permissions on the newsletter-api.js file
