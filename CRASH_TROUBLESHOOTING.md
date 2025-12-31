# App Crash Troubleshooting Guide

## Problem: App Closes Immediately After Opening

If your app crashes immediately after opening, follow these steps:

## Quick Fix Steps

### 1. **Check Crash Logs** (Most Important!)
```bash
# Run this to see what's causing the crash:
.\check-crash-logs.bat

# OR manually:
adb logcat | findstr /i "error exception crash fatal"
```

### 2. **Clean Build and Reinstall**
```bash
# Use the debug script:
.\debug-crash.bat

# OR manually:
adb shell pm clear com.jomfood
adb uninstall com.jomfood
.\clean-build-release.bat
```

### 3. **Common Causes and Fixes**

#### A. Firebase Not Initialized
**Symptoms:** Crash on startup, Firebase-related errors in logs

**Fix:** Already fixed in `src/messaging.js` - now has try-catch protection

#### B. Missing google-services.json
**Symptoms:** Firebase initialization errors

**Check:** Make sure `android/app/google-services.json` exists and is valid

#### C. AsyncStorage Not Ready
**Symptoms:** i18n initialization errors

**Fix:** Already fixed in `src/i18n/config.js` - now has delay and error handling

#### D. Build Cache Issues
**Symptoms:** Old code running, changes not reflected

**Fix:** Use `.\clean-build-release.bat` to clear all caches

#### E. Missing Native Modules
**Symptoms:** "Module not found" errors

**Fix:** 
```bash
cd android
.\gradlew.bat clean
cd ..
npm install
npx react-native run-android
```

## Step-by-Step Debugging

### Step 1: Get the Crash Log
```bash
.\check-crash-logs.bat
```

Look for lines containing:
- `FATAL EXCEPTION`
- `AndroidRuntime`
- `Error`
- Your app package name: `com.jomfood`

### Step 2: Identify the Error
Common errors:

1. **Firebase Error:**
   ```
   java.lang.IllegalStateException: Default FirebaseApp is not initialized
   ```
   **Solution:** Check `google-services.json` exists and is valid

2. **Module Not Found:**
   ```
   com.facebook.react.common.JavascriptException: Module not found
   ```
   **Solution:** Run `npm install` and rebuild

3. **Permission Error:**
   ```
   java.lang.SecurityException: Permission denied
   ```
   **Solution:** Check `AndroidManifest.xml` permissions

4. **Initialization Error:**
   ```
   Error initializing [module name]
   ```
   **Solution:** Check the specific module initialization

### Step 3: Fix and Rebuild
1. Fix the issue based on the error
2. Clean build: `.\clean-build-release.bat`
3. Reinstall: `.\debug-crash.bat`

## Testing After Fix

1. **Uninstall old version:**
   ```bash
   adb uninstall com.jomfood
   ```

2. **Install fresh build:**
   ```bash
   adb install android\app\build\outputs\apk\release\app-release.apk
   ```

3. **Monitor logs while opening:**
   ```bash
   adb logcat -c
   adb shell am start -n com.jomfood/.MainActivity
   adb logcat | findstr /i "jomfood"
   ```

## Prevention

The following fixes have been applied to prevent crashes:

1. ✅ **Firebase messaging** - Added try-catch in `src/messaging.js`
2. ✅ **i18n initialization** - Added error handling in `src/i18n/config.js`
3. ✅ **Global error handler** - Added in `index.js`
4. ✅ **Notification initialization** - Already has error handling

## Still Crashing?

1. **Check the exact error** from `check-crash-logs.bat`
2. **Share the error message** - Look for the stack trace
3. **Try debug build** instead of release:
   ```bash
   cd android
   .\gradlew.bat assembleDebug
   adb install android\app\build\outputs\apk\debug\app-debug.apk
   ```

## Useful Commands

```bash
# Clear app data
adb shell pm clear com.jomfood

# Uninstall app
adb uninstall com.jomfood

# View all logs
adb logcat

# View only errors
adb logcat *:E

# Clear logcat buffer
adb logcat -c

# Install APK
adb install android\app\build\outputs\apk\release\app-release.apk

# Start app
adb shell am start -n com.jomfood/.MainActivity
```

