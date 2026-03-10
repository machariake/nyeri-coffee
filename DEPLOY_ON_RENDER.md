# How to Configure Step 4 (React Routing) on Render

React applications are "Single Page Applications" (SPAs). This means they only have ONE physical file (`index.html`), and React handles changing the URL in the browser (like `/dashboard` or `/login`). 

If you don't tell Render this, and a user goes to `https://nyeri-farmer-web.onrender.com/dashboard` and hits **Refresh**, Render will desperately look for a folder called "dashboard" with an `index.html` file inside it. When it can't find it, it throws a **"404 Not Found"** error.

To fix this, we set up a **"Rewrite Rule"**. We are simply telling Render: _"No matter what URL the user types in, just serve them the main `index.html` file and let React handle the rest."_

---

### Exact Step-By-Step to Fix This in Render:

1. **Wait for your app to finish creating.** If you already clicked "Create Static Site", that's perfectly fine! Just let it finish building.
2. Go to your **Render Dashboard**.
3. Click on your deployed site (e.g., `nyeri-farmer-web`).
4. Look at the **menu on the left side** of your screen. 
5. Under your site's name, click on **"Redirects/Rewrites"**.
6. You will see a button that says **"Add Rule"**. Click it.
7. Fill in the 3 boxes exactly like this:
   - **Source:** `/*` *(This means "literally any path the user types")*
   - **Destination:** `/index.html` *(This means "always send them here")*
   - **Action:** Select `Rewrite` from the dropdown.
8. Click the green **"Save Changes"** button at the bottom.

You are done! If you repeat this exact same process for the **Admin Panel** (`web_admin`), both of your React sites will perfectly support direct links and browser refreshing!
