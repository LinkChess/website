#!/bin/bash

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Navigate to the server directory
cd /var/www/chesslink.site/server

# Check if package.json exists, if not initialize npm
if [ ! -f package.json ]; then
    echo "Initializing npm..."
    npm init -y
fi

# Install dependencies (will skip if already installed)
npm install express body-parser node-fetch@2 dotenv

# Create .env file for the API token
if [ ! -f .env ]; then
    echo "EMAIL_TOKEN=your_buttondown_api_token_here" > .env
    echo "Created .env file. Please update it with your actual API token."
fi

# Create systemd service file
cat > newsletter-api.service << EOL
[Unit]
Description=ChessLink Newsletter API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/chesslink.site/server
ExecStart=/usr/bin/node newsletter-api.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Install the service if it doesn't exist
if [ ! -f /etc/systemd/system/newsletter-api.service ]; then
    echo "Installing newsletter-api service..."
    sudo mv newsletter-api.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable newsletter-api
    sudo systemctl start newsletter-api
    echo "Newsletter API service installed and started!"
else
    echo "Newsletter API service already installed. Reloading..."
    sudo systemctl daemon-reload
fi

echo "Setup complete! Check status with: sudo systemctl status newsletter-api"
