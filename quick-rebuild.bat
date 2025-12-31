@echo off
echo ========================================
echo   Quick Rebuild - Clean Install
echo   Uninstalls old app and rebuilds
echo ========================================
echo.

echo [Step 1/4] Stopping Metro bundler (if running)...
taskkill /F /IM node.exe 2>nul
echo ✓ Metro stopped
echo.

echo [Step 2/4] Uninstalling old app...
adb uninstall com.jomfood 2>nul
adb shell pm clear com.jomfood 2>nul
echo ✓ Old app removed
echo.

echo [Step 3/4] Cleaning Android build...
cd android
call gradlew.bat clean
cd ..
echo ✓ Build cleaned
echo.

echo [Step 4/4] Starting Metro and building...
start "Metro Bundler" cmd /k "npx react-native start --reset-cache"
timeout /t 5 /nobreak >nul
npx react-native run-android
echo.

pause

