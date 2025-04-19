# Deployment Guide

This guide explains how to deploy the ChessLink frontend application to the production server.

## Prerequisites

*   Node.js and npm installed locally.
*   SSH access to the production server (IP: `107.175.111.165`).
*   The appropriate credentials (password or SSH key) for the server.
*   The `deploy.sh` script present in the project root.

## Deployment Process

The deployment process is automated using the `deploy.sh` script. This script handles:

1.  Building the Vite/React frontend application for production.
2.  Creating static fallback files (copies of `index.html`) for specific routes (`/demo`, `/play`, `/sounds`) to ensure they work correctly even with potential server routing issues.
3.  Creating a server-side setup script (`server-setup.sh`) that:
    *   Identifies the correct Nginx web root directory (`/var/www/chesslink.site`).
    *   Backs up the existing site content.
    *   Cleans the web root directory.
    *   Updates the Nginx configuration (`/etc/nginx/sites-available/chesslink.site.conf` or similar) with rules optimized for Single Page Applications (SPAs), including handling specific routes and asset caching.
    *   Sets correct file ownership (to the `nginx` user) and permissions (`755` for directories, `644` for files).
    *   Clears any Nginx cache.
    *   Tests the Nginx configuration and restarts the Nginx service.
    *   Performs basic `curl` tests on key routes to verify they are responding correctly.
4.  Uploading the built frontend files (`dist/` directory) to the server's web root using `scp`.
5.  Uploading and executing the `server-setup.sh` script on the server via `ssh`.
6.  Cleaning up temporary scripts.

## Steps to Deploy

1.  **Ensure Code is Up-to-Date:** Make sure you have the latest code checked out on your local machine and have committed any changes.
    ```bash
    git pull origin main # Or your development branch
    ```
2.  **Run the Deployment Script:** Open your terminal in the project root directory and execute:
    ```bash
    ./deploy.sh
    ```
3.  **Enter Credentials:** The script will prompt you multiple times for the server's password (if using password authentication). Enter it each time it asks. **Using SSH keys is strongly recommended for better security and convenience.**
4.  **Verify:** Once the script finishes, it will output "Deployment complete!".
    *   Open your web browser and navigate to `https://chesslink.site`.
    *   Test the main page and specifically navigate directly to `/demo`, `/play`, and `/sounds` to ensure they load correctly.
    *   Clear your browser cache if you still see the old version.

## Troubleshooting

*   **Permission Errors during SCP/SSH:** Ensure you are running the script from a user account that has SSH access configured or that your SSH agent is running.
*   **Nginx Errors:** If the script reports `ERROR: Nginx configuration test failed!`, there might be a syntax error in the generated Nginx config or a conflict with other server configurations. You may need to SSH into the server (`ssh <your_username>@107.175.111.165`) and manually check the Nginx error logs (usually in `/var/log/nginx/error.log`).
*   **Site Not Updating:** Clear your browser cache thoroughly. Check the output of the `curl` tests in the script's final output to see if the server itself is returning the correct status codes. 