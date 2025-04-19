#!/bin/bash

# Exit on any error
set -e

echo "Building the site..."
npm run build

# Create copies of index.html for each problematic route
echo "Creating static route files..."
mkdir -p dist/demo dist/play dist/sounds
cp dist/index.html dist/demo/index.html
cp dist/index.html dist/play/index.html
cp dist/index.html dist/sounds/index.html

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
    
    # Most restrictive rule first: assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }
    
    # Force specific route handling
    location = /demo {
        alias /var/www/chesslink.site/demo;
        try_files $uri $uri/ /demo/index.html;
    }
    
    location = /play {
        alias /var/www/chesslink.site/play;
        try_files $uri $uri/ /play/index.html;
    }
    
    location = /sounds {
        alias /var/www/chesslink.site/sounds;
        try_files $uri $uri/ /sounds/index.html;
    }
    
    # Default handling for all other routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
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
    
    # Most restrictive rule first: assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }
    
    # Force specific route handling
    location = /demo {
        alias /var/www/chesslink.site/demo;
        try_files $uri $uri/ /demo/index.html;
    }
    
    location = /play {
        alias /var/www/chesslink.site/play;
        try_files $uri $uri/ /play/index.html;
    }
    
    location = /sounds {
        alias /var/www/chesslink.site/sounds;
        try_files $uri $uri/ /sounds/index.html;
    }
    
    # Default handling for all other routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
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

# Create direct symlinks for problematic routes
echo "Creating direct symlinks for problematic routes..."
if [ ! -d "$WEB_ROOT/demo" ]; then
  mkdir -p "$WEB_ROOT/demo"
fi
if [ ! -d "$WEB_ROOT/play" ]; then
  mkdir -p "$WEB_ROOT/play"
fi
if [ ! -d "$WEB_ROOT/sounds" ]; then
  mkdir -p "$WEB_ROOT/sounds"
fi

# Make sure index.html exists in each directory
echo "Checking for index.html in each directory..."
for dir in "$WEB_ROOT" "$WEB_ROOT/demo" "$WEB_ROOT/play" "$WEB_ROOT/sounds"; do
  if [ ! -f "$dir/index.html" ]; then
    echo "Creating index.html in $dir"
    cp "$WEB_ROOT/index.html" "$dir/index.html"
  fi
done

# Check for files in the web root
echo "Checking web content..."
ls -la "$WEB_ROOT"
echo "Checking special directories:"
for dir in "demo" "play" "sounds"; do
  echo "Directory: $dir"
  ls -la "$WEB_ROOT/$dir"
done

# Clean any NGINX cache
echo "Clearing NGINX cache..."
if [ -d "/var/cache/nginx" ]; then
  rm -rf /var/cache/nginx/*
fi

# Turn off any gzip to avoid caching issues
find /etc/nginx -name "*.conf" -exec sed -i 's/gzip on/gzip off/g' {} \; 2>/dev/null || true

# Validate and restart Nginx
echo "Testing and restarting Nginx..."
nginx -t
if [ $? -eq 0 ]; then
  echo "Nginx configuration test passed, restarting..."
  systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null || /etc/init.d/nginx restart 2>/dev/null

  # Verify nginx is running
  sleep 2
  if pgrep nginx > /dev/null; then
    echo "Nginx is running correctly."
  else
    echo "WARNING: Nginx might not be running! Starting it..."
    systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null || /etc/init.d/nginx start 2>/dev/null
  fi
else
  echo "ERROR: Nginx configuration test failed!"
  exit 1
fi

# Test the routes that were giving 404s
echo "Testing routes with curl..."
for route in "/" "/demo" "/play" "/sounds"; do
  echo "Testing route: $route"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost$route)
  echo "  Status: $STATUS"
  
  # Also check headers
  echo "  Headers:"
  curl -s -I http://localhost$route | head -5
  
  if [ "$STATUS" == "404" ]; then
    echo "WARNING: Route $route is still returning 404!"
  fi
done

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
echo "Try accessing these URLs directly:"
echo "- https://chesslink.site/demo"
echo "- https://chesslink.site/play"
echo "- https://chesslink.site/sounds"
echo ""
echo "If you're still seeing errors, please try the following:"
echo "1. Clear your browser cache completely or use private/incognito mode"
echo "2. Try accessing the site from a different browser or device"
echo "3. Wait a few minutes for DNS changes to propagate" 