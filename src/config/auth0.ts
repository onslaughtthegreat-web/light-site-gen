// Auth0 Configuration
// Replace these with your actual Auth0 credentials from https://manage.auth0.com/

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "YOUR_AUTH0_DOMAIN.auth0.com",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "YOUR_AUTH0_CLIENT_ID",
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || `https://YOUR_AUTH0_DOMAIN.auth0.com/api/v2/`,
  }
};
