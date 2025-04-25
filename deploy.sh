#!/bin/bash

# Exit on any error
set -e

# --- Frontend Build ---
echo "Building the site with production Socket.IO URL..."
# Set the environment variable for the build process
VITE_SOCKET_URL='wss://chesslink.site' npm run build

# --- Local SPA Workaround Removal ---
# Removed: mkdir -p dist/demo dist/play dist/sounds
# Removed: cp dist/index.html dist/demo/index.html
# Removed: cp dist/index.html dist/play/index.html
# Removed: cp dist/index.html dist/sounds/index.html

# --- Server Setup Script Generation ---
echo "Creating server setup script (server-setup.sh)..."
cat > server-setup.sh << 'EOL'
#!/bin/bash
set -e

echo ">>> Installing prerequisites using dnf (including Python 3.9)..."
# dnf check-update can be run manually if needed
# Install base tools, nginx, and the python39 module + devel for building packages
dnf install -y nginx python3-pip python3-devel gcc curl # Keep base python3 tools just in case
dnf module install -y python39 # Removed python39-devel

# Check Python version
PYTHON_VERSION_DEFAULT=$(python3 -c 'import sys; print("{}.{}".format(sys.version_info.major, sys.version_info.minor))')
PYTHON_VERSION_39=$(python3.9 -c 'import sys; print("{}.{}".format(sys.version_info.major, sys.version_info.minor))')
echo ">>> Default Python version: $PYTHON_VERSION_DEFAULT"
echo ">>> Python 3.9 version: $PYTHON_VERSION_39"

if [[ "$PYTHON_VERSION_39" < "3.7" ]]; then
  echo "ERROR: Installed Python 3.9 module version ($PYTHON_VERSION_39) is unexpectedly less than 3.7!"
  exit 1
fi

# --- Nginx Configuration ---
echo ">>> Configuring Nginx..."
NGINX_CONF_PATH="/etc/nginx/sites-available/chesslink.site.conf"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/chesslink.site.conf"
# Fallback if sites-available doesn't exist
if [ ! -d "/etc/nginx/sites-available" ]; then
  NGINX_CONF_PATH="/etc/nginx/conf.d/chesslink.site.conf"
  NGINX_ENABLED_PATH="" # No separate enabling step needed
fi

echo "Creating Nginx configuration at $NGINX_CONF_PATH"
cat > "$NGINX_CONF_PATH" << 'CONF'
server {
    listen 80;
    server_name chesslink.site www.chesslink.site; # Add www if needed

    # Consider adding HTTPS configuration here later (listen 443 ssl...)
    
    root /var/www/chesslink.site;
    index index.html index.htm;

    # Standard SPA Routing (Handles React Router)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate"; # Prevent caching of index.html
    }

    # Serve static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/chesslink.site; # Ensure root is correct for assets
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }
    
    # WebSocket Proxy for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:8765; # Point to the backend Flask-SocketIO server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
CONF

  # Enable the site if using sites-available/sites-enabled pattern
if [ -n "$NGINX_ENABLED_PATH" ] && [ ! -L "$NGINX_ENABLED_PATH" ]; then
    ln -sf "$NGINX_CONF_PATH" "$NGINX_ENABLED_PATH"
fi

# --- Backend Setup ---
echo ">>> Setting up Python backend using Python 3.9..."
BACKEND_DIR="/opt/chesslink-backend"
VENV_DIR="$BACKEND_DIR/venv"

# Create backend directory if it doesn't exist
mkdir -p "$BACKEND_DIR"

# Remove old venv if it exists from previous failed attempts
rm -rf "$VENV_DIR"

echo "Creating Python virtual environment at $VENV_DIR using python3.9..."
python3.9 -m venv "$VENV_DIR"

echo "Installing Python dependencies from requirements.txt into Python 3.9 venv..."
# Activate venv to ensure pip and python are the correct ones, though explicit paths are safer
# source "$VENV_DIR/bin/activate" # Optional activation
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
# deactivate # Optional deactivation

echo "Creating systemd service file for the backend (using venv python)..."
# The ExecStart path automatically uses the python version the venv was created with
cat > /etc/systemd/system/chesslink-backend.service << 'SERVICE'
[Unit]
Description=ChessLink Backend Service
After=network.target

[Service]
User=root # Consider running as a non-root user for security
Group=root # Consider running as a non-root user for security
WorkingDirectory=/opt/chesslink-backend
ExecStart=/opt/chesslink-backend/venv/bin/python app.py # This python is from the venv (Python 3.9)
Restart=always
Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
SERVICE

echo "Reloading systemd, enabling and restarting backend service..."
systemctl daemon-reload
systemctl enable chesslink-backend.service
systemctl restart chesslink-backend.service

# --- Frontend Files Permissions ---
echo ">>> Setting permissions for frontend files..."
WEB_ROOT="/var/www/chesslink.site"
if [ -d "$WEB_ROOT" ]; then
  NGINX_USER=$(ps aux | grep "nginx: worker" | grep -v "grep" | awk '{print $1}' | head -1 || echo "nginx") # Default to nginx if detection fails
  echo "Setting ownership for $WEB_ROOT to $NGINX_USER..."
  # Ensure the directory exists before changing ownership
  mkdir -p "$WEB_ROOT"
    chown -R "$NGINX_USER":"$NGINX_USER" "$WEB_ROOT"
  echo "Setting file permissions..."
  find "$WEB_ROOT" -type d -exec chmod 755 {} \;
  find "$WEB_ROOT" -type f -exec chmod 644 {} \;
else
  echo "WARNING: Web root $WEB_ROOT not found, skipping frontend permission setup."
fi

# --- Nginx Validation and Restart ---
# Removed steps for creating /demo, /play, /sounds dirs and copying index.html
# Removed Gzip disable command

echo ">>> Testing and restarting Nginx..."
nginx -t
if [ $? -eq 0 ]; then
  echo "Nginx configuration test passed, restarting..."
  systemctl restart nginx
  sleep 2
  if ! pgrep nginx > /dev/null; then
    echo "WARNING: Nginx failed to start after restart!"
  else
    echo "Nginx restarted successfully."
  fi
else
  echo "ERROR: Nginx configuration test failed!"
  exit 1
fi

echo "Server setup complete!"
EOL

chmod +x server-setup.sh

# --- Deployment ---
echo "Deploying to server..."
# IMPORTANT: Use SSH keys for authentication instead of passwords!
# Setup: ssh-keygen -> ssh-copy-id root@107.175.111.165
SERVER="root@107.175.111.165"
SERVER_IP="107.175.111.165" # Keep IP for potential direct checks
BACKEND_DEST_DIR="/opt/chesslink-backend"
FRONTEND_DEST_DIR="/var/www/chesslink.site"

# Create necessary directories on server before copying
echo "Ensuring target directories exist on server..."
ssh -p 22 "$SERVER" "mkdir -p $BACKEND_DEST_DIR $FRONTEND_DEST_DIR"

# --- Upload Files ---
echo "Uploading frontend files (dist/*) to $FRONTEND_DEST_DIR ..."
scp -P 22 -r dist/* "$SERVER:$FRONTEND_DEST_DIR/"

echo "Uploading backend files (server/* excluding venv) to $BACKEND_DEST_DIR ..."
# First clean any existing server directory to prevent conflicts with venv
ssh -p 22 "$SERVER" "rm -rf $BACKEND_DEST_DIR/* && mkdir -p $BACKEND_DEST_DIR"

# Create a temporary directory for filtered files
TMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TMP_DIR"

# Copy server files to temp directory excluding venv
cp -r server/* "$TMP_DIR/"
rm -rf "$TMP_DIR/venv" 2>/dev/null || true
rm -rf "$TMP_DIR/__pycache__" 2>/dev/null || true
find "$TMP_DIR" -name "*.pyc" -delete 2>/dev/null || true

# Upload filtered content
scp -P 22 -r "$TMP_DIR"/* "$SERVER:$BACKEND_DEST_DIR/"

# Clean up temporary directory
rm -rf "$TMP_DIR"

echo "Uploading and running server setup script..."
scp -P 22 server-setup.sh "$SERVER:~/"
ssh -p 22 "$SERVER" "bash ~/server-setup.sh"

# Clean up local setup script
rm server-setup.sh

echo "Deployment complete! Your site should be accessible at http://chesslink.site" # Changed to http for now
echo "The backend should be running and proxied via Nginx."
echo "IMPORTANT: Setup HTTPS (Let's Encrypt/Certbot) and update VITE_SOCKET_URL to wss:// for production!"
echo "Also ensure you are using SSH Key authentication, not passwords." 