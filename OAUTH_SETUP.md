# Google OAuth Setup for AfterCredits

## Why it's not working yet

OAuth (Google, Apple, Facebook login) requires additional configuration for React Native apps. The buttons are currently just UI - they need:

1. **Supabase OAuth Configuration**
2. **Mobile OAuth Flow Setup** (using expo-auth-session)
3. **Deep Linking Configuration**

---

## Quick Fix: Disable OAuth Buttons for Now

Since OAuth requires complex setup, I recommend **hiding the social login buttons** until we properly configure them:

### Option 1: Hide Social Buttons

In `src/pages/auth_page.jsx`, comment out or remove the social login section (lines with Google/Apple/Facebook buttons).

---

## Full Setup (For Later)

### Step 1: Enable Google OAuth in Supabase

1. Go to: https://app.supabase.com/project/kiapyhqhjcrxjwzazobt/auth/providers
2. Enable **Google** provider
3. Set up Google Cloud Console OAuth credentials
4. Add redirect URL: `https://kiapyhqhjcrxjwzazobt.supabase.co/auth/v1/callback`

### Step 2: Install Dependencies

```bash
npm install expo-auth-session expo-web-browser expo-crypto
```

### Step 3: Configure Deep Linking

Update `app.json`:

```json
{
  "expo": {
    "scheme": "aftercredits"
  }
}
```

### Step 4: Update OAuth Functions

Use proper mobile OAuth flow with `expo-auth-session`.

---

## Recommendation

For now, **use Email/Password authentication** which is fully working.

OAuth setup is complex and requires:

- Google Cloud Console project
- Supabase configuration
- Mobile-specific OAuth flow
- Testing across platforms

We can add it later as an enhancement!

---

## Current Status

✅ **Working:**

- Email/Password Sign Up
- Email/Password Login
- Logout
- Profile with privacy settings

❌ **Not Configured:**

- Google OAuth
- Apple OAuth
- Facebook OAuth

**Focus on the working features first, OAuth can be added later!** 🎯
