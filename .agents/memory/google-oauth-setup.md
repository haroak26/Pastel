---
name: Google OAuth setup
description: Google Sign-in added alongside GitHub OAuth; architecture decisions for provider storage and routing.
---

# Google OAuth Implementation

## The rule
Google and GitHub OAuth both store their IDs in the `users.googleId` column, prefixed with `google_` and `github_` respectively. New OAuth users always go to `/auth/onboarding`; returning users with incomplete onboarding also go to `/auth/onboarding`; fully onboarded users go to `/home/mail`.

**Why:** The `googleId` column was originally used for Google but GitHub was added later reusing it with a `github_` prefix. This avoids schema migration. The OAuth callback routing uses `buildOnboardingSession()` to determine if a returning user still needs to complete onboarding.

**How to apply:**
- Strategy name `"google"` uses `passport-google-oauth20` (already installed)
- Strategy name `"github"` uses `passport-oauth2` with GitHub's token/auth URLs
- Both strategies set `req.session.oauthFlow = { isNewUser, provider }`
- `oauthCallbackRedirect` in `server/routes/auth.ts` handles all OAuth redirects uniformly
- Callback URLs: `/auth/callback` and `/auth/github/callback` for GitHub; `/auth/google/callback` for Google
- Required env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (add in Replit secrets); optional `GOOGLE_CALLBACK_URL`
