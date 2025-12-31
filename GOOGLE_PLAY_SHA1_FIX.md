# Fix Google Sign-In for Google Play Store AAB

## Problem
Google Sign-In works in local APK but fails in AAB uploaded to Google Play Store with error:
> "Google Sign-In is not properly configured. Please contact support or check SHA-1 fingerprint in Google Cloud Console."

## Root Cause
When you upload an AAB to Google Play, Google Play **re-signs** your app with their own signing certificate. This certificate has a **different SHA-1 fingerprint** than your local release keystore.

Your local release keystore SHA-1: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6`
Google Play's signing certificate SHA-1: **Different** (you need to get this)

## Solution: Get Google Play's SHA-1 Fingerprint

### Step 1: Get Google Play App Signing Certificate SHA-1

✅ **You already have it!** Your Google Play SHA-1 fingerprint is:
```
EE:03:21:6B:1D:03:67:F5:20:E5:45:FE:AB:46:03:E2:54:9E:43:85
```

*(If you need to get it again: Go to Google Play Console → Your App → Release → Setup → App signing → Download the .der file and extract SHA-1)*

### Step 2: Add Google Play's SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** > **Credentials**
3. Find your **Android OAuth Client** (the one with package name `com.jomfood`)
4. Click **EDIT** on the Android OAuth client
5. Click **+ ADD SHA-1 CERTIFICATE FINGERPRINT**
6. Paste this SHA-1: `EE:03:21:6B:1D:03:67:F5:20:E5:45:FE:AB:46:03:E2:54:9E:43:85`
7. Click **SAVE**

**Note**: Make sure you have all three SHA-1 fingerprints in this Android OAuth Client:
- Debug: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- Local Release: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6`
- Google Play: `EE:03:21:6B:1D:03:67:F5:20:E5:45:FE:AB:46:03:E2:54:9E:43:85` ✅

### Step 3: Wait for Propagation

- Google Cloud Console changes can take **5-10 minutes** to propagate
- Wait a few minutes, then test again

## Important Notes

✅ **You need ALL THREE SHA-1 fingerprints in Google Cloud Console:**
1. Debug SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (for local debug builds)
2. Local Release SHA-1: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6` (for local release APK)
3. **Google Play SHA-1**: `EE:03:21:6B:1D:03:67:F5:20:E5:45:FE:AB:46:03:E2:54:9E:43:85` (for AAB uploaded to Play Store)

## Verification

After adding Google Play's SHA-1:
1. Wait 5-10 minutes for changes to propagate
2. Upload a new AAB to Google Play Console
3. Test Google Sign-In in the Play Store version
4. It should work now! ✅

## Why This Happens

- **Local APK**: Uses your release keystore → Works with your local SHA-1
- **Play Store AAB**: Google Play re-signs with their key → Needs Google Play's SHA-1

This is **normal behavior** for Google Play. Google Play manages app signing certificates for security and to prevent key loss.

## Summary

- ✅ **Frontend Issue**: Error message is hardcoded in `src/utils/googleSignIn.js`
- ✅ **Configuration Issue**: Missing Google Play's SHA-1 in Google Cloud Console
- ❌ **NOT a Backend Issue**: Backend never receives the request - error happens in Google Sign-In SDK

