# How to Deploy the Main Web App (`web_app`) on Render

React applications like your `web_app` should **never** be deployed as "Web Services" because they are front-end only. They must be deployed as **"Static Sites"** so that Render builds the raw HTML/JS for browsers to download instantly.

If you deploy it as a "Web Service", you will get the **"Invalid Host header"** error because it starts a development server!

Here are the EXACT steps to completely deploy your `web_app` correctly and for free:

### 🌍 Step 1: Create a New Static Site
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Look at the top right of your screen and click **"New"**.
3. **CRITICAL:** Select **"Static Site"**. (Do NOT select "Web Service").
4. Under "Connect a repository", select your `machariake/nyeri-coffee` GitHub repository.

### ⚙️ Step 2: Configure the Settings
Fill out the deployment form exactly like this:
- **Name:** `nyeri-farmer-web` *(or whatever you like)*
- **Region:** Leave as default
- **Branch:** `main`
- **Root Directory:** `web_app` *(THIS IS REQUIRED! It tells Render which folder to look inside).*
- **Build Command:** `npm install && npm run build` *(This builds your React code into production HTML).*
- **Publish Directory:** `build` *(This tells Render to serve the "build" folder that gets created).*

### 🔑 Step 3: Add the API Environment Variable
Since your Web App needs to talk to your live backend:
1. Scroll down and click **"Advanced"**.
2. Click **"Add Environment Variable"**.
3. **Key:** `REACT_APP_API_URL`
4. **Value:** Paste your live Render backend URL *(It should look like `https://nyeri-farmer-api.onrender.com`)*.

### 🚀 Step 4: Deploy!
1. Scroll to the very bottom and click the blue **"Create Static Site"** button.
2. Render will automatically install dependencies and build your React app. This takes about 2-3 minutes.

### 🔗 Step 5: Fix "404 Not Found" when Refreshing (CRITICAL for React)
Because React handles its own URLs (like `/login` or `/dashboard`), you have to tell Render to always send users to the main file, even if they refresh the page.
1. Once your site is created, look at the menu on the **left side** of your screen.
2. Click on **"Redirects/Rewrites"**.
3. Click **"Add Rule"**.
4. Fill in the boxes exactly like this:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
5. Click **"Save Changes"**.

You are completely done! Your web app URL (e.g. `https://nyeri-farmer-web.onrender.com`) is now live, connected to your DB, and ready for farmers to use!
