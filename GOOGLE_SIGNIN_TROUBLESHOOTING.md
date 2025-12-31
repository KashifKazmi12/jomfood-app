# Google Sign-In SHA-1 Fingerprint Troubleshooting Guide

## Problem: "SHA-1 fingerprints not configured" Error

Even though you've added the SHA-1 fingerprint to Google Cloud Console, you're still getting this error. Here's why and how to fix it:

---

## Root Cause

For React Native Google Sign-In to work, you need **TWO separate OAuth clients** in Google Cloud Console:

1. **Web Client ID** - Used in your code (`webClientId` parameter)
2. **Android OAuth Client** - Must exist with SHA-1 fingerprint (not used in code, but Google checks it)

**The client ID you're currently using (`942861883753-kijbq0jn8ktkgcghqccf57qqavpkr34r`) appears to be an Android/Installed client, not a Web client.**

---

## Solution: Create Both Clients

### Step 1: Create/Verify Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Check if you have a **Web application** type OAuth client
4. If not, create one:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
   - Select **Application type**: `Web application`
   - Name: `JomFood Web Client`
   - **Authorized JavaScript origins**: (can be empty for mobile)
   - **Authorized redirect URIs**: (can be empty for mobile)
   - Click **CREATE**
5. **Copy the Client ID** (it will look like: `942861883753-xxxxx.apps.googleusercontent.com`)

### Step 2: Create Android OAuth Client with SHA-1

1. In the same **Credentials** page
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Application type**: `Android`
4. Fill in:
   - **Name**: `JomFood Android Release`
   - **Package name**: `com.jomfood`
   - **SHA-1 certificate fingerprint**: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6`
5. Click **CREATE**
6. **Important**: After creating, click **EDIT** on this Android client and add the debug SHA-1 as well:
   - Click **+ ADD SHA-1 CERTIFICATE FINGERPRINT**
   - Add: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Click **SAVE**

### Step 3: Update Your Code

Update `src/config/secrets.js` with the **Web Client ID** (not the Android one):

```javascript
export default {
  // Use the WEB CLIENT ID here (from Step 1)
  google_client_id: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
};
```

**Important**: 
- Use the **Web Client ID** in your code
- The **Android Client ID** doesn't need to be in your code, but it MUST exist in Google Cloud Console with the SHA-1 fingerprint

---

## Common Mistakes

### ❌ Wrong: Using Android Client ID in Code
```javascript
// DON'T DO THIS - This is an Android client ID
google_client_id: '942861883753-kijbq0jn8ktkgcghqccf57qqavpkr34r.apps.googleusercontent.com'
```

### ✅ Correct: Using Web Client ID in Code
```javascript
// DO THIS - Use the Web Client ID
google_client_id: '942861883753-xxxxx.apps.googleusercontent.com' // Web client ID
```

---

## Verification Steps

1. **Check Client Types in Google Cloud Console:**
   - Go to **APIs & Services** > **Credentials**
   - You should see:
     - ✅ One **Web application** client (used in code)
     - ✅ One **Android** client (with SHA-1 fingerprints)

2. **Verify SHA-1 Fingerprints:**
   - Click on your **Android** OAuth client
   - Verify both SHA-1 fingerprints are listed:
     - Debug: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
     - Release: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6`

3. **Test:**
   - Rebuild your release APK: `cd android && ./gradlew assembleRelease`
   - Install and test Google Sign-In
   - The error should be resolved

---

## Still Not Working?

### Check These:

1. **Wait Time**: Google Cloud Console changes can take 5-10 minutes to propagate. Wait a bit and try again.

2. **Package Name Match**: Ensure your Android package name (`com.jomfood`) exactly matches what's in Google Cloud Console.

3. **Keystore Match**: Make sure you're using the correct keystore for release builds. Verify the SHA-1 matches:
   ```bash
   keytool -list -v -keystore path/to/your/release.keystore -alias your_alias
   ```

4. **OAuth Consent Screen**: Make sure your OAuth consent screen is configured and published in Google Cloud Console.

5. **API Enabled**: Ensure Google Sign-In API is enabled in your Google Cloud project.

---

## Quick Checklist

- [ ] Created **Web application** OAuth client
- [ ] Created **Android** OAuth client
- [ ] Added **both** SHA-1 fingerprints (debug + release) to Android client
- [ ] Updated `secrets.js` with **Web Client ID** (not Android)
- [ ] Package name matches: `com.jomfood`
- [ ] Waited 5-10 minutes after making changes
- [ ] Rebuilt the APK after changes

---

## Need Help?

If you're still getting the error after following these steps, check:
1. The exact error message in your app logs
2. Verify the client ID you're using is actually a Web client (not Android)
3. Double-check SHA-1 fingerprints match your keystore

