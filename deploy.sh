#!/bin/bash

# Exit on any error
set -e

echo "Building the site..."
npm run build

# Create a script to run on the server
echo "Creating server setup script..."
cat > server-setup.sh << 'EOL'
#!/bin/bash
# This script runs on the server to fix permission and configuration issues

echo "Checking for existing Nginx configuration..."
EXISTING_CONFIG=$(grep -l "server_name.*chesslink.site" /etc/nginx/conf.d/* /etc/nginx/sites-enabled/* 2>/dev/null || echo "")

if [ -n "$EXISTING_CONFIG" ]; then
  echo "Found existing configuration at: $EXISTING_CONFIG"
  
  # Backup the existing config
  cp "$EXISTING_CONFIG" "${EXISTING_CONFIG}.bak"
  
  # Update the configuration for SPA
  echo "Updating Nginx configuration for SPA routing..."
  cat > "$EXISTING_CONFIG" << 'CONF'
server {
    listen 80;
    server_name chesslink.site www.chesslink.site;
    
    root /var/www/chesslink.site;
    index index.html;
    
    # Allow all methods
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Explicitly allow access to assets
    location /assets {
        try_files $uri =404;
    }
}
CONF
else
  echo "No existing configuration found for chesslink.site"
  echo "Creating new configuration..."
  
  # Clean up any conflicting configs we might have created
  rm -f /etc/nginx/conf.d/chesslink-spa.conf
  
  # Create a new site configuration in the proper location
  NGINX_SITES_DIR=$([ -d "/etc/nginx/sites-available" ] && echo "/etc/nginx/sites-available" || echo "/etc/nginx/conf.d")
  CONF_FILE="$NGINX_SITES_DIR/chesslink.site.conf"
  
  echo "Creating configuration at $CONF_FILE"
  cat > "$CONF_FILE" << 'CONF'
server {
    listen 80;
    server_name chesslink.site www.chesslink.site;
    
    root /var/www/chesslink.site;
    index index.html;
    
    # Allow all methods
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Explicitly allow access to assets
    location /assets {
        try_files $uri =404;
    }
}
CONF

  # Enable the site if using sites-available/sites-enabled pattern
  if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf "$CONF_FILE" "/etc/nginx/sites-enabled/$(basename "$CONF_FILE")"
  fi
fi

# Fix permissions and ownership
echo "Checking and fixing permissions..."
if [ -d "/var/www/chesslink.site" ]; then
  WEB_ROOT="/var/www/chesslink.site"
  echo "Found web directory at $WEB_ROOT"
  
  # Check who owns the directory
  NGINX_USER=$(ps aux | grep "nginx: worker" | grep -v "grep" | awk '{print $1}' | head -1)
  echo "Nginx is running as user: $NGINX_USER"
  
  # Set proper ownership and permissions
  if [ -n "$NGINX_USER" ]; then
    echo "Setting ownership to $NGINX_USER..."
    chown -R "$NGINX_USER":"$NGINX_USER" "$WEB_ROOT"
  else
    echo "Could not determine Nginx user, using nginx:nginx..."
    chown -R nginx:nginx "$WEB_ROOT"
  fi
  
  echo "Setting proper permissions..."
  find "$WEB_ROOT" -type d -exec chmod 755 {} \;
  find "$WEB_ROOT" -type f -exec chmod 644 {} \;
else
  echo "ERROR: Web directory /var/www/chesslink.site not found!"
  exit 1
fi

# Check for files in the web root
echo "Checking web content..."
ls -la "$WEB_ROOT"
find "$WEB_ROOT" -type f | wc -l | xargs echo "Total files in web root:"

# Fix common misconfigurations
echo "Checking for common issues in Nginx configuration..."
sed -i 's/deny all;//g' /etc/nginx/conf.d/* /etc/nginx/sites-enabled/* 2>/dev/null || true

# Validate and restart Nginx
echo "Testing and restarting Nginx..."
nginx -t
if [ $? -eq 0 ]; then
  echo "Nginx configuration test passed, restarting..."
  systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null || /etc/init.d/nginx restart 2>/dev/null
else
  echo "ERROR: Nginx configuration test failed!"
  exit 1
fi

echo "Server setup complete!"
EOL

chmod +x server-setup.sh

echo "Deploying to server..."
echo "You'll be prompted for the server password (PS2jghwr626Wl39JJU)"

# First check the server
echo "Checking server configuration before deploying..."
scp -P 22 server-setup.sh root@107.175.111.165:~/pre-check.sh
ssh -p 22 root@107.175.111.165 "chmod +x ~/pre-check.sh && ls -l /var/www/chesslink.site"

# Upload the files to the correct directory
echo "Uploading files to /var/www/chesslink.site..."
scp -P 22 -r dist/* root@107.175.111.165:/var/www/chesslink.site/

# Upload and run the server setup script
echo "Uploading and running server setup script..."
scp -P 22 server-setup.sh root@107.175.111.165:~/
ssh -p 22 root@107.175.111.165 "bash ~/server-setup.sh"

# Clean up
rm server-setup.sh

echo "Deployment complete! Your site should now be live at https://chesslink.site"
echo "If you're still seeing errors, try clearing your browser cache or waiting a few minutes."
echo "You may need to run the script again if the issues persist." 