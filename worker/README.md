# Baymax Cloudflare Worker

This worker provides a secure backend API that validates Auth0 JWT tokens and proxies requests to the Groq AI API.

## Setup

1. Install dependencies:
   ```bash
   cd worker
   npm install
   ```

2. Set environment variables in Cloudflare dashboard:
   - `AUTH0_DOMAIN`: Your Auth0 domain (e.g., "your-domain.auth0.com")
   - `AUTH0_AUDIENCE`: Your Auth0 API audience (e.g., "https://your-domain.auth0.com/api/v2/")
   - `GROQ_API_KEY`: Your Groq API key
   - `VECTOR_API_URL`: Your vector API URL for medical context

3. Create and bind KV namespace:
   ```bash
   wrangler kv:namespace create "CHAT_HISTORY_BAYMAX_PROXY"
   ```
   
   Then add the namespace ID to your wrangler.toml:
   ```toml
   [[kv_namespaces]]
   binding = "CHAT_HISTORY_BAYMAX_PROXY"
   id = "your-kv-namespace-id"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## Endpoints

- `GET /health` - Public health check
- `POST /` - Protected chat endpoint (requires valid Auth0 JWT token)
- `POST /clear` - Protected endpoint to clear chat history (requires valid Auth0 JWT token)

## Security Features

- **Auth0 JWT Verification**: All endpoints (except /health) require a valid Auth0 JWT token
- **User-based Sessions**: Chat history is tied to the Auth0 user ID (sub claim)
- **CORS Protection**: Configurable origin validation
- **Input Validation**: Message length limits and sanitization
- **Rate Limiting**: Built-in token expiry and validation

## Usage from Frontend

```typescript
const { getAccessTokenSilently } = useAuth0();

const token = await getAccessTokenSilently();
const response = await fetch('https://your-worker.workers.dev/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    userMessage: 'Hello Baymax!'
  })
});
```

## Authentication Flow

1. User logs in via Auth0 on the frontend
2. Frontend obtains Auth0 access token using `getAccessTokenSilently()`
3. Frontend sends requests to worker with `Authorization: Bearer <token>` header
4. Worker verifies the JWT token against Auth0's JWKS endpoint
5. Worker extracts user ID from token's `sub` claim
6. Worker uses user ID as the session identifier for chat history
7. Worker processes the request and returns the response

## Development

```bash
# Run locally
npm run dev

# Deploy to production
npm run deploy
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH0_DOMAIN` | Your Auth0 tenant domain | Yes |
| `AUTH0_AUDIENCE` | Your Auth0 API identifier | Yes |
| `GROQ_API_KEY` | API key for Groq AI | Yes |
| `VECTOR_API_URL` | URL for vector/medical database API | Yes |
| `CHAT_HISTORY_BAYMAX_PROXY` | KV namespace binding for chat history | Yes |
