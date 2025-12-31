# How to Build APK for JomFood App

This guide will help you create an APK file for your React Native app.

## Prerequisites

- Android Studio installed
- Java JDK installed
- Android SDK configured
- React Native development environment set up

---

## ⚠️ IMPORTANT: Configure Production Backend URL First!

**Before building a production release APK, you MUST update the backend API URL to point to your live/production server.**

### Step 1: Update API Configuration

1. **Open `src/config/api.js`**

2. **Update the production URL:**
   ```javascript
   const API_CONFIG = {
     BASE_URL: isDevelopment 
       ? 'http://192.168.100.93:5055/api'  // Development (keep this)
       : 'https://your-live-backend-url.com/api', // ⚠️ CHANGE THIS to your production URL!
     
     TIMEOUT: 10000,
   };
   ```

3. **Replace `https://your-live-backend-url.com/api` with your actual production backend URL**

   Example:
   ```javascript
   : 'https://api.jomfood.my/api',  // Your production URL
   ```

4. **Save the file**

### Why This Matters:
- Debug builds use the development URL (for testing)
- Release builds use the production URL (for users)
- If you don't change this, your production APK will try to connect to your local development server (which won't work for users!)

---

## Quick Checklist Before Production Build:

- [ ] ✅ Updated `src/config/api.js` with production backend URL
- [ ] ✅ Generated release keystore (see Option 2 below)
- [ ] ✅ Configured `gradle.properties` with keystore passwords
- [ ] ✅ Updated `build.gradle` for release signing
- [ ] ✅ Tested the app with production URL (if possible)

---

## Option 1: Build Debug APK (Quick Testing)

A debug APK is signed with a debug certificate and is suitable for testing.

### Steps:

1. **Open terminal in project root** (`D:\jomfood`)

2. **Build the debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

   On Windows (PowerShell/CMD):
   ```bash
   cd android
   gradlew.bat assembleDebug
   ```

3. **Find your APK:**
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`
   - This APK can be installed on any Android device for testing

---

---

## Option 2: Build Release APK (For Production)

**⚠️ REMINDER: Make sure you've updated the production backend URL in `src/config/api.js` before building!**

A release APK is optimized and signed with your own keystore. **Required for Google Play Store**.

### Step 1: Generate a Release Keystore

1. **Open terminal in project root**

2. **Generate keystore file:**
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore jomfood-release.keystore -alias jomfood-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Fill in the prompts:**
   - Enter a password (remember this!)
   - Enter your name, organization, city, state, country code
   - Confirm with 'yes'

4. **Move keystore to `android/app/` directory** (if not already there)

### Step 2: Configure Gradle for Release Signing

1. **Create `android/gradle.properties` file** (if it doesn't exist) and add:
   ```properties
   JOMFOOD_RELEASE_STORE_FILE=jomfood-release.keystore
   JOMFOOD_RELEASE_KEY_ALIAS=jomfood-key-alias
   JOMFOOD_RELEASE_STORE_PASSWORD=your_keystore_password
   JOMFOOD_RELEASE_KEY_PASSWORD=your_key_password
   ```

   ⚠️ **IMPORTANT:** Add `gradle.properties` to `.gitignore` to keep passwords secure!

2. **Update `android/app/build.gradle`:**

   Find the `signingConfigs` section and update it:
   ```gradle
   signingConfigs {
       debug {
           storeFile file('debug.keystore')
           storePassword 'android'
           keyAlias 'androiddebugkey'
           keyPassword 'android'
       }
       release {
           if (project.hasProperty('JOMFOOD_RELEASE_STORE_FILE')) {
               storeFile file(JOMFOOD_RELEASE_STORE_FILE)
               storePassword JOMFOOD_RELEASE_STORE_PASSWORD
               keyAlias JOMFOOD_RELEASE_KEY_ALIAS
               keyPassword JOMFOOD_RELEASE_KEY_PASSWORD
           }
       }
   }
   ```

   And update the `buildTypes` section:
   ```gradle
   buildTypes {
       debug {
           signingConfig signingConfigs.debug
       }
       release {
           signingConfig signingConfigs.release  // Changed from debug
           minifyEnabled enableProguardInReleaseBuilds
           proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
       }
   }
   ```

### Step 3: Build Release APK

1. **Open terminal in project root**

2. **Build the release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   On Windows:
   ```bash
   cd android
   gradlew.bat assembleRelease
   ```

3. **Find your APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`
   - This is your production-ready APK!

---

## Option 3: Build AAB (Android App Bundle) for Google Play

AAB is the preferred format for Google Play Store (smaller file size).

### Steps:

1. **Follow Step 1 and Step 2 from Option 2** (keystore setup)

2. **Build the AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

   On Windows:
   ```bash
   cd android
   gradlew.bat bundleRelease
   ```

3. **Find your AAB:**
   - Location: `android/app/build/outputs/bundle/release/app-release.aab`
   - Upload this to Google Play Console

---

## Quick Commands Summary

### Debug APK (Testing)
```bash
cd android && gradlew.bat assembleDebug
```
APK Location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (Production)
```bash
cd android && gradlew.bat assembleRelease
```
APK Location: `android/app/build/outputs/apk/release/app-release.apk`

### Release AAB (Google Play)
```bash
cd android && gradlew.bat bundleRelease
```
AAB Location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Troubleshooting

### Error: "Task 'assembleRelease' not found"
- Make sure you're in the `android` directory
- Try: `cd android && gradlew.bat clean && gradlew.bat assembleRelease`

### Error: "Keystore file not found"
- Verify the keystore file path in `gradle.properties`
- Make sure the keystore is in `android/app/` directory

### Error: "Password incorrect"
- Double-check passwords in `gradle.properties`
- Make sure there are no extra spaces

### Build takes too long
- First build always takes longer (downloading dependencies)
- Subsequent builds are faster

---

## Notes

- **Debug APK**: Larger file size, not optimized, uses debug certificate
- **Release APK**: Optimized, smaller, signed with your keystore
- **AAB**: Google Play's preferred format, automatically generates APKs for different device configurations

- Keep your keystore file and passwords **SECURE** - you'll need them for all future updates!
- Never commit `gradle.properties` with passwords to version control

---

## Testing the APK

1. **Transfer APK to Android device** (via USB, email, or cloud storage)
2. **Enable "Install from Unknown Sources"** in device settings
3. **Tap the APK file** to install
4. **Test the app** thoroughly before publishing

