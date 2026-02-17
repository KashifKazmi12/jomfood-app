@echo off
setlocal
set EMULATOR_PATH=%LOCALAPPDATA%\Android\Sdk\emulator
set AVD_NAME=Pixel_7

echo ========================================
echo   Starting Android Emulator: %AVD_NAME%
echo ========================================
echo.
echo Note: Emulator may take 30-60 seconds to boot
echo Wait for the home screen before running: npx react-native run-android
echo.

cd /d "%EMULATOR_PATH%"
if not exist "emulator.exe" (
    echo ❌ Emulator not found at: %EMULATOR_PATH%
    echo Please check your Android SDK installation.
    pause
    exit /b 1
)

echo Starting emulator...
start "Android Emulator" emulator -avd %AVD_NAME% -netdelay none -netspeed full -no-boot-anim -gpu host

echo.
echo ✓ Emulator starting in background...
echo.
echo To check if emulator is ready, run: .\check-device.bat
echo.
pause
