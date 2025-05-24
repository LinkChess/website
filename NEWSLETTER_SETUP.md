# Newsletter Subscription System Setup

This guide explains how to set up and use the ChessLink newsletter subscription system.

## Overview

The ChessLink newsletter subscription system allows users to subscribe through a form on the website. Email addresses are stored in a SQLite database on the server. There's also an admin interface to view and export the list of subscribers.

## Setup

### Server Setup

1. Make sure you have Python installed (3.8 or higher recommended)
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```
4. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
5. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Database Setup

The subscribers table should be automatically created when you first run the server. If not, you can create it manually:

```bash
cd server
sqlite3 chess_games.db "CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
```

## Running the System

### Start Both Frontend and Backend Servers

We've created a convenience script to start both servers simultaneously:

```bash
./start_dev.sh
```

This will start:
- Backend server at http://localhost:8765
- Frontend development server at http://localhost:8080

### Start Backend Server Only

```bash
cd server
./start_server.sh
```

## Admin Access

To access the admin panel:

1. Navigate to http://localhost:8080/admin/subscribers
2. Enter the admin key (default: "your_admin_key_here")
3. View and export subscriber data

The admin key can be changed in `server/app.py`.

## API Endpoints

### Subscribe Endpoint

- **URL**: `/api/subscribe`
- **Method**: POST
- **Body**: `{ "email": "user@example.com" }`
- **Success Response**: `{ "success": true, "message": "Subscription successful!" }`

### Admin Endpoint

- **URL**: `/api/subscribers?admin_key=your_admin_key_here`
- **Method**: GET
- **Success Response**: `{ "success": true, "count": 2, "subscribers": [...] }`

## Development Notes

- The frontend components use the API service from `src/lib/api.ts`
- API requests are proxied through Vite's development server
- Environment variables are managed in `.env.development`
