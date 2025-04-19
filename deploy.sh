#!/bin/bash

# Exit on any error
set -e

echo "Building the site..."
npm run build

echo "Creating .htaccess file for SPA routing..."
cat > dist/.htaccess << 'EOL'
RewriteEngine On
# Handle requests for files or directories that exist
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Handle client routing by redirecting to index.html
RewriteRule ^ index.html [L]
EOL

echo "Deploying to server..."
echo "You'll be prompted for the server password (PS2jghwr626Wl39JJU)"
scp -P 22 -r dist/* root@107.175.111.165:/var/www/html/

echo "Deployment complete! Your site is now live at https://chesslink.site" 