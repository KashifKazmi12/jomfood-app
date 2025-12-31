@echo off
echo ========================================
echo   JomFood - Complete Debug Setup
echo   Starts Metro + Builds + Runs App
echo ========================================
echo.

echo [Step 1/3] Checking for connected devices...
adb devices
for /f "tokens=2" %%a in ('adb devices ^| findstr /i "device$"') do (
    echo ✓ Device found
    goto :device_found
)
echo.
echo ❌ No device found!
echo Please:
echo   1. Start emulator: .\run-emulator-Pixcel_6.bat
echo   2. OR connect physical device via USB
echo   3. Then run this script again
echo.
pause
exit /b 1

:device_found
echo.

echo [Step 2/4] Uninstalling old app (fixes INSTALL_FAILED_UP)...
adb uninstall com.jomfood 2>nul
adb shell pm clear com.jomfood 2>nul
echo ✓ Old app removed
echo.

echo [Step 3/4] Starting Metro Bundler...
start "Metro Bundler" cmd /k "npx react-native start --reset-cache"
echo ✓ Metro bundler starting in background
echo.
echo Waiting 5 seconds for Metro to initialize...
timeout /t 5 /nobreak >nul
echo.

echo [Step 4/4] Building and installing debug app...
echo.
npx react-native run-android

echo.
echo ========================================
echo   Debug App Setup Complete!
echo ========================================
echo.
echo Metro bundler is running in background
echo Keep it running while testing your app
echo.
pause

