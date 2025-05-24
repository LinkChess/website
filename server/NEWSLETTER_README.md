# Newsletter Subscription System

This document describes the newsletter subscription system added to the ChessLink project.

## Overview

The newsletter subscription system allows users to subscribe to the ChessLink newsletter through a form on the website. The email addresses are stored in a SQLite database on the server. There's also an admin interface to view and export the list of subscribers.

## Implementation Details

### Database

A new table named `subscribers` has been added to the existing SQLite database (`chess_games.db`). The table has the following schema:

```sql
CREATE TABLE subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Server API Endpoints

Two new API endpoints have been added to the Flask server:

1. **POST /api/subscribe** - Handles newsletter subscriptions
   - Takes a JSON body with an `email` field
   - Validates the email format
   - Stores the email in the database
   - Returns success/error message

2. **GET /api/subscribers** - Admin endpoint to view all subscribers
   - Protected by an admin key (query parameter `admin_key`)
   - Returns a list of all subscribers with their subscription dates
   - Can be used to export subscriber data

### Frontend Components

1. **Newsletter Component** (`src/components/Newsletter.tsx`)
   - Updated to use the new API endpoint instead of Pageclip
   - Handles form submission via fetch API
   - Shows success/error messages to the user

2. **Subscriber Admin Component** (`src/components/SubscriberAdmin.tsx`)
   - Admin interface to view all subscribers
   - Requires authentication with admin key
   - Allows exporting subscriber list as CSV
   - Accessible at `/admin/subscribers` route

## Security Considerations

- The admin endpoint is protected by a simple API key. For production, consider implementing proper authentication.
- Email addresses are stored in plain text. Consider encryption for production.
- There's no rate limiting on the subscribe endpoint. Consider adding rate limiting to prevent abuse.

## Future Improvements

- Add email verification flow
- Implement unsubscribe functionality
- Add ability to send emails to subscribers
- Enhance admin interface with more features (search, filter, delete)
