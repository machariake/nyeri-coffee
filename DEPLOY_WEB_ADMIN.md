# How to Deploy the Admin Panel (`web_admin`) on Render

Now that the backend and the main web app are deploying, it's time to launch the **Admin Control Panel**. This is the exact same process as deploying the main web app, but with a different root directory!

### 🌍 Step 1: Create a New Static Site
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click the **"New"** button in the top right.
3. Select **"Static Site"**.
4. Connect to your `machariake/nyeri-coffee` repository on GitHub.

### ⚙️ Step 2: Configure the Settings
Fill out the deployment form exactly like this:
- **Name:** `nyeri-admin-panel` *(You can name this whatever you like)*
- **Region:** Default
- **Branch:** `main`
- **Root Directory:** `web_admin` *(THIS IS THE MOST IMPORTANT PART! If you type this wrong, it won't work).*
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

### 🔑 Step 3: Add the API Environment Variable
Since your Admin Panel needs to talk to your live backend on Render:
1. Scroll down and click **"Advanced"**.
2. Click **"Add Environment Variable"**.
3. **Key:** `REACT_APP_API_URL`
4. **Value:** Paste your live Render backend URL *(It should look like `https://nyeri-farmer-api.onrender.com`)*.

### 🚀 Step 4: Deploy & Fix Routing
1. Scroll to the bottom and click the blue **"Create Static Site"** button.
2. Wait a few minutes for the deployment to finish.
3. Once the site is live, look at the menu on the left side of your screen.
4. Click on **"Redirects/Rewrites"**.
5. Click **"Add Rule"**.
6. Set **Source** to `/*`
7. Set **Destination** to `/index.html`
8. Set **Action** to `Rewrite`
9. Click **"Save Changes"**.

You are officially done! Your Admin Panel is now live on the internet and permanently connected to your database!
