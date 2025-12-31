@echo off
echo ========================================
echo   JomFood - Device Checker
echo   Checks for connected Android devices
echo ========================================
echo.

echo Checking for connected devices...
echo.
adb devices
echo.

echo ========================================
echo   Device Status
echo ========================================
for /f "tokens=2" %%a in ('adb devices ^| findstr /i "device$"') do (
    echo ✓ Device found: %%a
    goto :found
)

echo ❌ No devices found!
echo.
echo Options:
echo 1. Start emulator: .\run-emulator-Pixcel_6.bat
echo 2. Connect physical device via USB (enable USB debugging)
echo 3. Build APK without installing: .\build-debug-apk.bat
echo.
goto :end

:found
echo.
echo ✓ Device is ready!
echo You can now run: npx react-native run-android
echo.

:end
pause

