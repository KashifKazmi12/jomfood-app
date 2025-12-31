@echo off
echo ========================================
echo   Fixing Installation Error
echo   Uninstalling old app and reinstalling
echo ========================================
echo.

echo [Step 1/3] Uninstalling old app...
adb uninstall com.jomfood
if %ERRORLEVEL% EQU 0 (
    echo ✓ App uninstalled successfully
) else (
    echo ℹ App may not have been installed (this is okay)
)
echo.

echo [Step 2/3] Clearing app data (if exists)...
adb shell pm clear com.jomfood 2>nul
echo ✓ App data cleared
echo.

echo [Step 3/3] Installing fresh debug build...
npx react-native run-android
echo.

pause

