# Using Netlify Functions for API Routes

This document explains how we're using Netlify Functions to provide API endpoints for both development and production environments.

## Overview

Rather than running a separate Express server for API endpoints, we're leveraging Netlify Functions to handle our API needs. This approach provides several benefits:

1. **Unified Code Base**: The same code handles requests in both development and production
2. **Serverless Architecture**: No need to maintain a separate server or process
3. **Next.js-like API Routes**: Similar to Next.js's `/pages/api` pattern, but for our Vite application

## How It Works

### Netlify Functions

We've created a Netlify Function at `netlify/functions/api-newsletter.ts` that handles newsletter subscriptions.

### Netlify Redirects

In our `netlify.toml` file, we've configured a redirect rule:

```toml
[[redirects]]
  from = "/api/newsletter"
  to = "/.netlify/functions/api-newsletter"
  status = 200
```

This maps the user-friendly URL `/api/newsletter` to the Netlify function URL.

### Frontend Integration

Our newsletter form simply posts to `/api/newsletter`:

```html
<form action="/api/newsletter" method="POST">
  <!-- form fields -->
</form>
```

### Development Environment

When running locally with `netlify dev`, the redirect rules apply, and the API works exactly as it would in production.

### Production Environment

In production, we have two options:

1. **Deploy to Netlify**: If your entire site is on Netlify, everything works automatically
2. **Custom Server with Nginx Proxy**: If you're using your own server, configure Nginx to proxy API requests to Netlify

## Nginx Configuration for Proxying to Netlify

If you're hosting your main site on your own server but want to use Netlify Functions for the API, set up an Nginx proxy:

```nginx
# API proxy to Netlify Functions
location /api/newsletter {
    proxy_pass https://chesslinknewsletter.netlify.app/.netlify/functions/api-newsletter;
    proxy_http_version 1.1;
    proxy_set_header Host chesslinknewsletter.netlify.app;
    # Additional proxy settings...
}
```

A sample configuration file is available at `docs/nginx-netlify-proxy-config.conf`.

## Why This Approach?

This approach gives us the best of both worlds:

- **Simple Development**: Works seamlessly with `netlify dev`
- **No Server Maintenance**: No need to manage a separate Express server, systemd services, etc.
- **Scalable**: Netlify Functions scale automatically
- **Flexible Deployment**: Works whether you deploy to Netlify or your own server

By using this pattern, we get a Next.js-like experience for API routes without having to switch frameworks.
