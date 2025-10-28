# Baymax Setup Guide

Complete setup guide for the Baymax healthcare chatbot with Auth0 authentication and Cloudflare Worker backend.

## Prerequisites

- Node.js and npm installed
- Auth0 account (free tier works)
- Cloudflare account (free tier works)
- Groq API key (for AI responses)

## Step 1: Auth0 Setup

1. **Create an Auth0 Application**
   - Go to https://manage.auth0.com/
   - Navigate to Applications → Applications
   - Click "Create Application"
   - Name it "Baymax" and select "Single Page Application"
   - Click "Create"

2. **Configure Application Settings**
   - In the application settings, add your URLs:
     - **Allowed Callback URLs**: `http://localhost:5173, https://your-domain.com`
     - **Allowed Logout URLs**: `http://localhost:5173/auth, https://your-domain.com/auth`
     - **Allowed Web Origins**: `http://localhost:5173, https://your-domain.com`
   - Save changes

3. **Create an API**
   - Navigate to Applications → APIs
   - Click "Create API"
   - Name: "Baymax API"
   - Identifier: `https://your-domain.auth0.com/api/v2/` (or your custom identifier)
   - Click "Create"

4. **Note Your Credentials**
   - Domain: `your-domain.auth0.com`
   - Client ID: (from your application settings)
   - Audience: (from your API identifier)

## Step 2: Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create .env File**
   ```bash
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   Edit `.env` with your Auth0 credentials:
   ```env
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-actual-client-id
   VITE_AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
   VITE_BAYMAX_ENDPOINT=https://your-worker.workers.dev
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Step 3: Cloudflare Worker Setup

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Install Worker Dependencies**
   ```bash
   cd worker
   npm install
   ```

4. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "CHAT_HISTORY_BAYMAX_PROXY"
   ```
   
   Note the namespace ID returned, you'll need it next.

5. **Configure wrangler.toml**
   Edit `worker/wrangler.toml` and add your KV namespace:
   ```toml
   [[kv_namespaces]]
   binding = "CHAT_HISTORY_BAYMAX_PROXY"
   id = "your-kv-namespace-id"
   ```

6. **Set Environment Variables in Cloudflare Dashboard**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Select your worker (after first deploy)
   - Go to Settings → Variables
   - Add these secrets:
     - `AUTH0_DOMAIN`: your-domain.auth0.com
     - `AUTH0_AUDIENCE`: https://your-domain.auth0.com/api/v2/
     - `GROQ_API_KEY`: your-groq-api-key
     - `VECTOR_API_URL`: your-vector-api-url

7. **Deploy Worker**
   ```bash
   npm run deploy
   ```

8. **Note Your Worker URL**
   After deployment, you'll get a URL like `https://baymax-worker.your-subdomain.workers.dev`

9. **Update Frontend .env**
   Update `VITE_BAYMAX_ENDPOINT` in your frontend `.env` with the worker URL.

## Step 4: Testing

1. **Start Frontend**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Navigate to http://localhost:5173
   - You should be redirected to `/auth`
   - Click "Login" to authenticate with Auth0
   - After login, you should be redirected to the main page

3. **Test Chat**
   - Type a message in the chat
   - Baymax should respond using the Groq AI API
   - Your chat history is stored in Cloudflare KV, tied to your Auth0 user ID

4. **Test Session Management**
   - Type "clear" to clear your chat history
   - Logout and login again - your previous session should be restored

## Security Features

✅ **Auth0 JWT Verification**: All backend requests require valid Auth0 tokens
✅ **User Isolation**: Chat history is isolated per Auth0 user ID
✅ **Token Validation**: Tokens are verified against Auth0's JWKS endpoint
✅ **Input Sanitization**: User messages are sanitized before processing
✅ **Rate Limiting**: Token expiry and validation built-in
✅ **CORS Protection**: Configurable origin validation

## Architecture

```
┌─────────────┐
│   Browser   │
│  (React +   │
│   Auth0)    │
└──────┬──────┘
       │ Auth0 JWT Token
       ▼
┌─────────────────┐
│ Cloudflare      │
│ Worker          │
│ - Verify JWT    │
│ - Store History │
│ - Call Groq API │
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│  Groq AI    │
│  API        │
└─────────────┘
```

## Troubleshooting

### "Unauthorized: Invalid token"
- Ensure your Auth0 credentials are correct in both frontend `.env` and worker environment variables
- Verify the `AUTH0_AUDIENCE` matches between frontend and backend
- Check that your Auth0 API is enabled

### CORS Errors
- Ensure your worker allows your frontend origin
- Check that `Access-Control-Allow-Origin` is set correctly in worker

### "Failed to get token"
- Ensure you're logged in to Auth0
- Check browser console for Auth0 errors
- Verify your Auth0 callback URLs are configured correctly

### Chat History Not Persisting
- Ensure your KV namespace is correctly bound in `wrangler.toml`
- Check Cloudflare dashboard for KV namespace errors
- Verify the worker has permission to write to KV

## Production Deployment

1. **Update Auth0 URLs**
   - Add your production domain to Auth0 Allowed URLs

2. **Deploy Frontend**
   - Build: `npm run build`
   - Deploy `dist` folder to your hosting service

3. **Update Worker Environment**
   - Ensure all production environment variables are set in Cloudflare dashboard

4. **Update Frontend .env**
   - Point `VITE_BAYMAX_ENDPOINT` to your production worker URL

## Cost Estimate (Free Tier)

- **Auth0**: Free for up to 7,000 users
- **Cloudflare Workers**: Free for first 100,000 requests/day
- **Cloudflare KV**: Free for first 100,000 reads/day, 1,000 writes/day
- **Groq API**: Check Groq pricing for your usage

## Support

For issues or questions, refer to:
- [Auth0 Documentation](https://auth0.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Groq API Documentation](https://groq.com/docs)
