# Google Sign-In Setup Guide for React Native

This guide will help you configure Google Sign-In for your React Native app in Google Cloud Console.

## Prerequisites

1. Google Cloud Console account
2. Your app's package name (Android) and Bundle ID (iOS)
3. SHA-1 fingerprint for Android (for debug and release builds)

---

## Step 1: Get Your App Information

### Android Package Name
Your Android package name is: **`com.jomfood`** (check `android/app/build.gradle`)

### iOS Bundle ID
Your iOS Bundle ID is: **`com.jomfood`** (check `ios/jomfood/Info.plist`)

---

## Step 2: Get SHA-1 Fingerprint (Android)

✅ **Your SHA-1 Fingerprints (Already Retrieved):**

### Debug Build SHA-1:
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### Release Build SHA-1:
```
5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6
```

**You need to add BOTH of these to Google Cloud Console!**

### How to Get SHA-1 (For Future Reference):
```bash
cd android
./gradlew signingReport
```

Or manually:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## Step 3: Configure Google Cloud Console

### 3.1 Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Go to **APIs & Services** > **Credentials**

### 3.2 Create OAuth 2.0 Client IDs

You need **THREE** OAuth 2.0 Client IDs:

#### A. Web Client ID (You already have this)
- **Type**: Web application
- **Name**: `JomFood Web Client`
- **Authorized JavaScript origins**: Your web app URLs
- **Authorized redirect URIs**: Your web app callback URLs
- **Client ID**: `942861883753-a1epq9ns8dsa9s49chcd1hut8uudgg56.apps.googleusercontent.com` ✅

#### B. Android Client ID (REQUIRED for Android)
1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Select **Application type**: `Android`
3. Fill in:
   - **Name**: `JomFood Android`
   - **Package name**: `com.jomfood` ✅
   - **SHA-1 certificate fingerprint**: 
     - **Debug**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` ✅
     - **Release**: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6` ✅
   
   **Important**: You can add multiple SHA-1 fingerprints to the same Android OAuth client. After creating it, click **EDIT** and add the second SHA-1 fingerprint.

4. Click **CREATE**
5. **Copy the Client ID** (you'll need this)

#### C. iOS Client ID (REQUIRED for iOS)
1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Select **Application type**: `iOS`
3. Fill in:
   - **Name**: `JomFood iOS`
   - **Bundle ID**: `com.jomfood`
4. Click **CREATE**
5. **Copy the Client ID** (you'll need this)

---

## Step 4: Update Your Code

### 4.1 Update `src/config/secrets.js`

```javascript
export default {
  // Web Client ID (for server-side verification)
  google_client_id: '942861883753-a1epq9ns8dsa9s49chcd1hut8uudgg56.apps.googleusercontent.com',
  google_client_secret: '8WB_zlUJd40ak5D-vnVDUhec',
  
  // Android Client ID (from Step 3.2.B)
  google_android_client_id: 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com',
  
  // iOS Client ID (from Step 3.2.C)
  google_ios_client_id: 'YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com',
};
```

### 4.2 Update `src/utils/googleSignIn.js`

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import SECRETS from '../config/secrets';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Use webClientId for both platforms (it works for mobile too)
    // OR use platform-specific client IDs
    webClientId: SECRETS.google_client_id, // Web client ID works for mobile
    
    // Optional: Use platform-specific client IDs
    // ...(Platform.OS === 'android' && { 
    //   webClientId: SECRETS.google_android_client_id 
    // }),
    // ...(Platform.OS === 'ios' && { 
    //   webClientId: SECRETS.google_ios_client_id 
    // }),
    
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    
    // Android-specific (optional)
    ...(Platform.OS === 'android' && {
      // If you have a separate Android client ID, you can use it here
      // But webClientId usually works fine
    }),
  });
};
```

**Note**: The `webClientId` you're currently using should work for both Android and iOS, BUT you **MUST** add the SHA-1 fingerprint for Android in Google Cloud Console.

---

## Step 5: Enable Google Sign-In API

1. Go to **APIs & Services** > **Library**
2. Search for **"Google Sign-In API"** or **"Google+ API"**
3. Click **ENABLE**

---

## Step 6: Common Issues & Solutions

### Issue 1: "DEVELOPER_ERROR" on Android
**Cause**: SHA-1 fingerprint not added or incorrect

**Solution**:
1. Get your SHA-1 fingerprint (Step 2)
2. Add it to your Android OAuth client in Google Cloud Console
3. Wait 5-10 minutes for changes to propagate
4. Rebuild your app: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

### Issue 2: "Sign in cancelled" or no popup
**Cause**: Package name or Bundle ID mismatch

**Solution**:
1. Verify package name in `android/app/build.gradle` matches Google Cloud Console
2. Verify Bundle ID in `ios/jomfood/Info.plist` matches Google Cloud Console

### Issue 3: Works on one device but not another
**Cause**: Different SHA-1 fingerprints for debug vs release

**Solution**:
1. Add BOTH debug and release SHA-1 fingerprints to Google Cloud Console
2. You can add multiple SHA-1 fingerprints to the same Android OAuth client

### Issue 4: iOS not working
**Cause**: Bundle ID mismatch or iOS client not created

**Solution**:
1. Create iOS OAuth client in Google Cloud Console
2. Verify Bundle ID matches exactly
3. Rebuild iOS app: `cd ios && pod install && cd .. && npx react-native run-ios`

---

## Step 7: Testing

### Test on Android:
```bash
npx react-native run-android
```

### Test on iOS:
```bash
npx react-native run-ios
```

### What to Check:
1. Click "Sign in with Google" button
2. Google sign-in popup should appear
3. After selecting account, should redirect back to app
4. Check console logs for any errors

---

## Quick Checklist

- [ ] Created Android OAuth client in Google Cloud Console
- [ ] Added SHA-1 fingerprint(s) to Android OAuth client
- [ ] Created iOS OAuth client in Google Cloud Console
- [ ] Verified package name matches: `com.jomfood`
- [ ] Verified Bundle ID matches: `com.jomfood`
- [ ] Enabled Google Sign-In API
- [ ] Updated `secrets.js` with client IDs (if using platform-specific)
- [ ] Rebuilt the app after changes
- [ ] Tested on both debug and release builds

---

## Important Notes

1. **SHA-1 Fingerprint is CRITICAL for Android** - Without it, you'll get `DEVELOPER_ERROR`
2. **Changes take 5-10 minutes to propagate** - Wait after making changes in Google Cloud Console
3. **You can use webClientId for mobile** - But you still need to add SHA-1 for Android
4. **Debug vs Release** - You may need different SHA-1 fingerprints for debug and release builds
5. **Package Name Must Match Exactly** - Case-sensitive, no spaces

---

## Need Help?

If you're still getting errors:
1. Check the error code in console logs
2. Verify all steps above
3. Check Google Cloud Console > APIs & Services > Credentials for your OAuth clients
4. Make sure you're using the correct SHA-1 fingerprint for your build type (debug/release)

