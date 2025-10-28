# Baymax Cloudflare Worker

This worker provides a secure backend API that validates Auth0 JWT tokens.

## Setup

1. Install dependencies:
   ```bash
   cd worker
   npm install
   ```

2. Set environment variables in Cloudflare dashboard:
   - `AUTH0_DOMAIN`: Your Auth0 domain (e.g., "your-domain.auth0.com")
   - `AUTH0_AUDIENCE`: Your Auth0 API audience

3. Deploy:
   ```bash
   npm run deploy
   ```

## Endpoints

- `GET /health` - Public health check
- `GET /api/data` - Protected endpoint (requires valid Auth0 JWT token)

## Usage from Frontend

```typescript
const { getAccessTokenSilently } = useAuth0();

const token = await getAccessTokenSilently();
const response = await fetch('https://your-worker.workers.dev/api/data', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```
