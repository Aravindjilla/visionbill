# VisionBill: Android Play Store Submission Guide

Follow these steps to generate your final **Android App Bundle (.aab)** and submit it to the Google Play Store.

### 1. Account Initialization
If you haven't already, install the EAS CLI and log in:
```bash
npm install -g eas-cli
eas login
```

### 2. Project Configuration
Initialize your EAS project. This will prompt you to create an account or link an existing one:
```bash
eas project:init
```

### 3. Generate Android Build Credentials
Expo can handle your keystore and signing credentials for you:
```bash
eas build:configure --platform android
```

### 4. Build the App (.aab)
Run the production build command. This will upload your code to the Expo build servers and return a download link for the `.aab` file:
```bash
eas build --platform android --profile production
```

### 5. Play Store Submission
Once the build is complete, use EAS to submit the bundle directly to the Google Play Console:
```bash
eas submit --platform android
```

### 📜 Deployment Tips:
- **Version Management**: Ensure you increment `versionCode` in `app.json` for every subsequent release.
- **Privacy Policy**: Use the in-app Privacy Policy link when filling out the "Data Safety" section in the Play Console.
- **Store Assets**: Use the generated icons and splash screens from our `/assets` folder for your listing.
- **Backend URLs**: Double-check that all production environment variables (e.g., `JWT_SECRET`, `API_URL`) are correctly set in the mobile app.
