@echo off
echo ========================================
echo   JomFood - Test Release Build
echo   Installs and tests release APK
echo ========================================
echo.

if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ❌ Release APK not found!
    echo Please build first using: .\build-release.bat
    echo.
    pause
    exit /b 1
)

echo [Step 1/4] Checking for connected devices...
adb devices
for /f "tokens=2" %%a in ('adb devices ^| findstr /i "device$"') do (
    echo ✓ Device found
    goto :device_found
)
echo ❌ No device found! Please connect a device or start emulator.
pause
exit /b 1

:device_found
echo.

echo [Step 2/4] Uninstalling old version (if exists)...
adb uninstall com.jomfood 2>nul
echo ✓ Uninstalled (or didn't exist)
echo.

echo [Step 3/4] Installing release APK...
adb install android\app\build\outputs\apk\release\app-release.apk
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Installation failed!
    echo Try: adb install -r android\app\build\outputs\apk\release\app-release.apk
    pause
    exit /b 1
)
echo ✓ APK installed
echo.

echo [Step 4/4] Starting app and monitoring logs...
echo.
echo ========================================
echo   App will start now
echo   Watch for any crash errors below
echo   Press Ctrl+C to stop monitoring
echo ========================================
echo.

adb logcat -c
adb shell am start -n com.jomfood/.MainActivity
timeout /t 3 /nobreak >nul
adb logcat | findstr /i "jomfood error exception crash fatal AndroidRuntime"
echo.
pause

