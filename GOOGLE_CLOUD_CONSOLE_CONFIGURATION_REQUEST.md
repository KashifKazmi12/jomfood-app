# Google Sign-In Configuration Request

Please configure the following OAuth 2.0 Client IDs in Google Cloud Console for our React Native mobile app.

---

## Required OAuth 2.0 Client IDs

### 1. Android OAuth Client ID

**Application Type:** Android

**Configuration:**
- **Package Name:** `com.jomfood`
- **SHA-1 Certificate Fingerprints:**
  - Debug: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
  - Release: `5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6`

**Note:** Both SHA-1 fingerprints need to be added to the same Android OAuth client. You can add multiple SHA-1 fingerprints to a single client.

---

### 2. iOS OAuth Client ID

**Application Type:** iOS

**Configuration:**
- **Bundle ID:** `com.jomfood`

---

### 3. Web OAuth Client ID (Already Exists)

**Status:** ✅ Already configured

**Client ID:** `942861883753-a1epq9ns8dsa9s49chcd1hut8uudgg56.apps.googleusercontent.com`

**Note:** This web client ID is already in use. No changes needed.

---

## Additional Requirements

1. **Enable Google Sign-In API** (if not already enabled)
   - Go to: APIs & Services > Library
   - Search for: "Google Sign-In API"
   - Click: Enable

2. **After Configuration:**
   - Please provide us with the **Android Client ID** and **iOS Client ID** once created
   - We will need these to update our app configuration

---

## Summary Checklist

- [ ] Create Android OAuth Client ID with package name `com.jomfood` and both SHA-1 fingerprints
- [ ] Create iOS OAuth Client ID with bundle ID `com.jomfood`
- [ ] Enable Google Sign-In API
- [ ] Provide us with the new Client IDs

---

## Contact

If you need any additional information, please let us know.

Thank you!

