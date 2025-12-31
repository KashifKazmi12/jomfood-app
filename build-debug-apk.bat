@echo off
echo ========================================
echo   JomFood - Build Debug APK
echo   Builds debug APK without installing
echo ========================================
echo.

echo [Step 1/3] Cleaning build cache...
cd android
call gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Clean had issues, continuing anyway...
)
echo ✓ Build cache cleaned
echo.

echo [Step 2/3] Building Debug APK...
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Debug APK Build Successful!
    echo ========================================
    echo Debug APK Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install manually:
    echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ========================================
    echo   Debug APK Build Failed!
    echo ========================================
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [Step 3/3] Checking for connected devices...
adb devices
echo.

echo ========================================
echo   Next Steps
echo ========================================
echo.
echo To install this debug APK:
echo   1. Connect device or start emulator
echo   2. Run: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To start emulator:
echo   .\run-emulator-Pixcel_6.bat
echo.
pause

