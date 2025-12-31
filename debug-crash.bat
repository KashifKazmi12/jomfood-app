@echo off
echo ========================================
echo   JomFood - Debug Crash Script
echo   This will help diagnose the crash
echo ========================================
echo.

echo [Step 1] Checking connected devices...
adb devices
echo.

echo [Step 2] Clearing app data (fresh start)...
adb shell pm clear com.jomfood
echo ✓ App data cleared
echo.

echo [Step 3] Uninstalling old version...
adb uninstall com.jomfood
echo ✓ Old version uninstalled
echo.

echo [Step 4] Installing new APK...
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    adb install android\app\build\outputs\apk\release\app-release.apk
    echo ✓ APK installed
) else (
    echo ❌ APK not found! Please build first using: .\build-release.bat
    pause
    exit /b 1
)
echo.

echo [Step 5] Starting app with log monitoring...
echo.
echo ========================================
echo   Starting app and showing logs...
echo   Press Ctrl+C to stop
echo ========================================
echo.

adb shell am start -n com.jomfood/.MainActivity
timeout /t 2 /nobreak >nul
adb logcat -c
adb logcat | findstr /i "jomfood error exception crash fatal"
echo.
pause

