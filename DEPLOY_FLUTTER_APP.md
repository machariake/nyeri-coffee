# How to Build and Distribute the Flutter App

Now that your backend and web apps are deployed, it's time to generate the final **Release APK** for the mobile app so your users can actually install it on their Android phones!

A "Release" APK is much faster, smaller, and smoother than the "Debug" APK we were using for testing.

### 🚀 Step 1: Open the Terminal
1. Open up a terminal in your IDE.
2. Make sure you are inside the `flutter_app` folder. If you aren't, run:
   ```bash
   cd flutter_app
   ```

### ⚙️ Step 2: Build the Release APK
Now, type in this exact command and press Enter:
```bash
flutter build apk --release
```

Flutter will now carefully compile your Dart code, strip out all the debugging tools, shrink the images, and pack it into a single highly optimized Android installation file. 

*Note: This process usually takes 1 to 3 minutes depending on your computer's speed.*

### 📂 Step 3: Locate your APK File
Once the terminal says it has successfully built the APK, you can find the actual installable file here:
`flutter_app\build\app\outputs\flutter-apk\app-release.apk`

### 📱 Step 4: Share it with Farmers!
Since this is an APK file, you don't necessarily have to put it on the Google Play Store right away. You can distribute it immediately:
1. Copy the `app-release.apk` file.
2. You can send it directly to farmers via **WhatsApp**.
3. You can upload it to Google Drive and share the download link.
4. If you have a website, you can host the file there with a "Download Android App" button.

### ⚠️ A Note on connecting to your live database
Right now, your Flutter app (`api_service.dart`) might still be pointing to your old local Node backend (e.g., `http://10.0.2.2:3000` or `http://localhost:3000`).
Before you build the APK, make sure you open `lib/core/services/api_service.dart` and update the `baseUrl` to point to your new live Render URL (like `https://nyeri-farmer-api.onrender.com/api`).
*(Note: Authentication is already hooked directly into Supabase, but any custom Node.js backend routes require your new Render URL).*
