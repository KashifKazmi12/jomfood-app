# 🔍 React Native Debugging Guide

## **How to See Logs & Network Calls in Your Mobile App**

---

## 📱 **Method 1: Chrome DevTools (Best for Network Calls)**

### **How to Enable:**

1. **Shake your device** (or press `Cmd+D` on iOS Simulator / `Ctrl+M` on Android Emulator)
2. Tap **"Debug"** or **"Open Debugger"**
3. Chrome will open automatically
4. Press `F12` or Right-click → **"Inspect"**

### **What You Can See:**

- ✅ **Console Logs:** All `console.log()`, `console.error()`, etc.
- ✅ **Network Tab:** See all HTTP requests (URL, headers, request/response)
- ✅ **React Components:** Install React DevTools extension
- ✅ **Redux State:** Install Redux DevTools extension

### **Network Tab Usage:**

1. Open Chrome DevTools
2. Go to **"Network"** tab
3. Filter by **"Fetch/XHR"** to see API calls
4. Click any request to see:
   - Request URL
   - Request Headers
   - Request Body
   - Response Headers
   - Response Body
   - Status Code

---

## 📺 **Method 2: Metro Bundler Console**

**Where:** Terminal where you ran `npm start`

**What Shows:**
- `console.log()` output
- `console.error()` output
- `console.warn()` output

**Example:**
```javascript
console.log('API Call:', url);
// Shows in Metro bundler terminal
```

**Note:** This does NOT show network requests, only JavaScript logs.

---

## 🖥️ **Method 3: Flipper (Advanced - Optional)**

**Flipper** is Facebook's debugging platform for React Native.

### **Install:**
```bash
npm install react-native-flipper
```

### **Features:**
- Network Inspector (see all API calls)
- React DevTools
- Redux DevTools
- Logs Viewer
- Layout Inspector

**But:** Requires more setup. Chrome DevTools is easier for now.

---

## 📊 **Method 4: Android Logcat (Android Only)**

For Android devices/emulators:

```bash
# View all logs
adb logcat

# Filter for React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filter for your app only
adb logcat | grep jomfood
```

---

## 🍎 **Method 5: iOS Console (iOS Only)**

For iOS Simulator:

1. Open **Xcode**
2. Go to **Window → Devices and Simulators**
3. Select your simulator
4. Click **"Open Console"**
5. All logs appear here

---

## 🛠️ **Adding Network Logging to Your App**

I'll create a utility to automatically log all API calls. This helps you see requests in the console.

---

## 💡 **Quick Tips:**

### **See Network Calls:**
1. Use **Chrome DevTools** (Method 1) - Easiest
2. Shake device → Debug → Open Chrome DevTools → Network tab

### **See Console Logs:**
1. **Metro bundler terminal** (Method 2) - Automatic
2. Add `console.log()` anywhere in your code

### **See Errors:**
1. Red screen = JavaScript errors (auto-shown)
2. Chrome DevTools Console tab = Detailed error stack

---

## 🚀 **Recommended Setup:**

For now, use **Chrome DevTools**:
1. Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Tap "Debug"
3. Open Chrome → `F12` → Network tab
4. See all API calls!

---

**Next:** I'll add automatic network logging to your API client so all calls show in console.

