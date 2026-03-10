# How to Fix "Invalid Host header" on Render

If you are seeing a blank white screen with the text **"Invalid Host header"**, it means you accidentally deployed your React frontend as a Node.js **"Web Service"** running a Development Server (`npm start`), instead of a **"Static Site"** running Production HTML (`npm run build`).

A Development Server strictly blocks connections from public URLs (like `.onrender.com`) for security reasons, which is why it's rejecting your connection!

### ❌ The Wrong Way (What happened):
You likely created a **Web Service** or used `npm start`. React apps should **never** use `npm start` on the public internet.

### ✅ The Fix:
You need to delete the incorrect service and create a Static Site. It takes 2 minutes and is completely free!

1. Go to your **Render Dashboard**.
2. Click on the `web_app` service that is giving you the error.
3. Scroll to the very bottom and click the red **"Delete Web Service"** button.
4. Go back to your Render Dashboard home page.
5. Click **"New"** in the top right.
6. **IMPORTANT:** Select **"STATIC SITE"** (do NOT select Web Service!).
7. Connect your repository.
8. Fill out the exact same settings:
   - **Root Directory:** `web_app`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
9. Click **Create Static Site**.

Because a Static Site builds raw HTML/JS instead of running a live Node.js development server, it will never throw a "Host header" error, it will load instantly, and it will be permanently free!
