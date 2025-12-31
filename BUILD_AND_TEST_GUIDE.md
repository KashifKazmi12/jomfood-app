# Build and Test Guide

## Debug vs Release Builds - When to Use Each

### Debug Build (Development)
- ✅ **Use for:** Daily development, testing, debugging
- ✅ **Requires:** Metro bundler running (development server)
- ✅ **Features:** Red box errors, fast refresh, debugging tools
- ✅ **Size:** Larger, not optimized
- ❌ **Cannot distribute:** Not for end users

**How to run:**
```bash
# Option 1: Complete setup (recommended)
.\run-debug-complete.bat

# Option 2: Manual steps
.\start-metro.bat          # Start Metro bundler
npx react-native run-android  # Build and install
```

### Release Build (Production)
- ✅ **Use for:** Testing final app, distributing to users
- ✅ **Self-contained:** Includes bundled JavaScript (no Metro needed)
- ✅ **Optimized:** Smaller size, faster performance
- ✅ **Distribution:** Can upload to Play Store or share APK
- ❌ **No debugging:** Harder to debug issues

**How to build:**
```bash
.\build-release.bat       # Select option 1 for APK
.\test-release-build.bat   # Install and test
```

## Problem Summary
- ✅ Release build creates successfully but crashes when opened
- ❌ Debug build shows "Unable to load script" (Metro bundler not running)

## Solutions

### Issue 1: Debug Build - No Device Connected

**Error:** `No connected devices!`

**Solution Options:**

#### Option A: Start Emulator (Recommended for Testing)
```bash
# Start your emulator first
.\run-emulator-Pixcel_6.bat

# Wait for emulator to fully boot (check for "Home" screen)
# Then run:
npx react-native run-android
```

#### Option B: Build Debug APK Without Installing
```bash
# This builds the APK without needing a device
.\build-debug-apk.bat

# Then manually install when device is ready:
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

#### Option C: Connect Physical Device
1. Enable USB Debugging on your Android phone
2. Connect via USB
3. Run: `.\check-device.bat` to verify connection
4. Then: `npx react-native run-android`

### Issue 2: Release Build Crashes on Startup

**Symptoms:** App opens then immediately closes

**Step-by-Step Fix:**

#### Step 1: Check Crash Logs
```bash
.\check-crash-logs.bat
```
Look for the exact error message.

#### Step 2: Clean Rebuild
```bash
.\clean-build-release.bat
```
This clears all caches and rebuilds with crash fixes.

#### Step 3: Test Release Build
```bash
.\test-release-build.bat
```
This will:
- Install the release APK
- Start the app
- Show crash logs in real-time

#### Step 4: Common Crash Causes

**A. Firebase Not Initialized**
- **Check:** `android/app/google-services.json` exists
- **Fix:** Already handled with try-catch in code

**B. Missing Permissions**
- **Check:** `AndroidManifest.xml` has all required permissions
- **Fix:** Already configured

**C. Build Cache Issues**
- **Fix:** Use `.\clean-build-release.bat`

**D. Old App Data**
```bash
adb shell pm clear com.jomfood
adb uninstall com.jomfood
```

## Quick Workflow

### For Debug Testing:
```bash
# 1. Start emulator
.\run-emulator-Pixcel_6.bat

# 2. Wait for emulator to boot (30-60 seconds)

# 3. Check device is connected
.\check-device.bat

# 4. Run debug build
npx react-native run-android
```

### For Release Testing:
```bash
# 1. Build release APK
.\build-release.bat
# Select option 1 (APK)

# 2. Test the release build
.\test-release-build.bat

# 3. If it crashes, check logs
.\check-crash-logs.bat
```

## Troubleshooting Commands

```bash
# Check if device is connected
adb devices

# Check crash logs
adb logcat -d | findstr /i "error exception crash fatal"

# Clear app data
adb shell pm clear com.jomfood

# Uninstall app
adb uninstall com.jomfood

# Install APK manually
adb install android\app\build\outputs\apk\release\app-release.apk

# Start app manually
adb shell am start -n com.jomfood/.MainActivity

# Monitor logs in real-time
adb logcat | findstr /i "jomfood"
```

## Scripts Available

1. **`check-device.bat`** - Check if device/emulator is connected
2. **`build-debug-apk.bat`** - Build debug APK without installing
3. **`build-release.bat`** - Build release APK/AAB
4. **`clean-build-release.bat`** - Clean and rebuild release
5. **`test-release-build.bat`** - Install and test release build
6. **`check-crash-logs.bat`** - View crash logs
7. **`debug-crash.bat`** - Full crash debugging workflow
8. **`run-emulator-Pixcel_6.bat`** - Start Android emulator

## Next Steps

1. **For Debug Build:**
   - Start emulator: `.\run-emulator-Pixcel_6.bat`
   - Wait for it to boot
   - Run: `npx react-native run-android`

2. **For Release Build:**
   - Build: `.\build-release.bat`
   - Test: `.\test-release-build.bat`
   - If crashes, check: `.\check-crash-logs.bat`

## Still Having Issues?

1. Share the exact error from `check-crash-logs.bat`
2. Check if `google-services.json` exists in `android/app/`
3. Verify all dependencies are installed: `npm install`
4. Try clean build: `.\clean-build-release.bat`

