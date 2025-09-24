# OAuth Configuration Fix

## The Issue
The callback URL in your Snapchat app is set to `/auth/callback` but the Express app serves it at `/api/auth/callback`.

## Solution

You need to update your Snapchat OAuth app settings:

1. Go to [business.snapchat.com](https://business.snapchat.com)
2. Navigate to your OAuth app settings
3. Update the **Snap Redirect URI** to:
   ```
   https://snapchatbidmultiplier-rdjs3v9nh-flatiron-gaming.vercel.app/api/auth/callback
   ```
   (Note the `/api/` prefix)

4. Save the changes

## Also Update Vercel

Update the `SNAPCHAT_REDIRECT_URI` environment variable in Vercel to:
```
https://snapchatbidmultiplier-rdjs3v9nh-flatiron-gaming.vercel.app/api/auth/callback
```

## Alternative: Frontend Route

If you can't change the Snapchat app settings, we could add a frontend route that redirects from `/auth/callback` to `/api/auth/callback`, but it's cleaner to just update the redirect URI.