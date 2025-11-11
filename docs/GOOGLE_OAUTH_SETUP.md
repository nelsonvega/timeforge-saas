---
noteId: "c63749e0bf2611f0b347d3c624c98e18"
tags: []

---

# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth authentication for your TimeTrack application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "TimeTrack Auth")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: TimeTrack (or your app name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
8. Click "Update" and then "Save and Continue"
9. On "Test users" page, you can add test users if in testing mode
10. Click "Save and Continue"
11. Review and click "Back to Dashboard"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "TimeTrack Web Client")
5. Add Authorized JavaScript origins:
   - For local development: `http://localhost:5000`
   - For production: `https://yourdomain.com`
6. Add Authorized redirect URIs:
   - For local development: `http://localhost:5000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret** (you'll need these for your `.env` file)

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Important Notes:**
- Replace `your-client-id-here` with your actual Google Client ID
- Replace `your-client-secret-here` with your actual Google Client Secret
- For production, update `GOOGLE_CALLBACK_URL` to match your production domain

## Step 6: Test the Integration

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to the login page at `http://localhost:5000/login`

3. Click "Continue with Google"

4. You should be redirected to Google's authentication page

5. After successful authentication, you'll be redirected back to your application

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen with production URLs
2. Add your production domain to "Authorized JavaScript origins"
3. Add your production callback URL to "Authorized redirect URIs"
4. Update the `GOOGLE_CALLBACK_URL` environment variable to your production URL:
   ```bash
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   ```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the callback URL in your `.env` file exactly matches one of the authorized redirect URIs in Google Cloud Console
- Check for trailing slashes - they must match exactly

### Error: "access_denied"
- User denied access to their Google account
- Have the user try again and grant permissions

### Error: "Google OAuth not configured"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
- Restart your development server after adding environment variables

### User Created but Can't Login
- Check that the user was properly created in the database
- Verify that a tenant and workspace were created for the user
- Check server logs for any errors during the OAuth callback

### Email Already Registered with Local Auth
If you previously registered with email/password and now try to sign in with Google using the same email:
- The system will automatically link your Google account to your existing account
- You can use either Google OAuth or email/password to log in
- Your existing workspaces and data will be preserved
- No duplicate user accounts will be created

## Security Best Practices

1. **Never commit** your `.env` file to version control
2. **Rotate secrets** regularly in production
3. Use different OAuth credentials for development and production
4. Enable "Published" status only when ready for production users
5. Monitor your Google Cloud Console for unusual activity

## How It Works

1. User clicks "Continue with Google" button
2. User is redirected to `/api/auth/google`
3. Backend redirects to Google's OAuth consent page
4. User grants permissions
5. Google redirects back to `/api/auth/google/callback` with auth code
6. Backend exchanges auth code for user profile information
7. Backend creates or updates user in database
8. If new user, creates tenant and default workspace
9. User is logged in and redirected to dashboard

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)
