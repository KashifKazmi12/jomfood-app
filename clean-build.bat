@echo off
echo ========================================
echo   JomFood - Clean Build Script
echo   This will clear all caches and rebuild
echo ========================================
echo.

echo [Step 1/5] Clearing Metro Bundler cache...
call npx react-native start --reset-cache
timeout /t 2 /nobreak >nul
taskkill /F /IM node.exe 2>nul
echo ✓ Metro cache cleared
echo.

echo [Step 2/5] Clearing watchman cache (if installed)...
call watchman watch-del-all 2>nul
echo ✓ Watchman cache cleared (if available)
echo.

echo [Step 3/5] Clearing Android build cache...
cd android
call gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Gradle clean had issues, continuing anyway...
)
echo ✓ Android build cache cleared
echo.

echo [Step 4/5] Clearing Android app build directory...
if exist "app\build" (
    rmdir /s /q "app\build"
    echo ✓ Android app build directory cleared
) else (
    echo ℹ Android app build directory already clean
)
echo.

echo [Step 5/5] Clearing node_modules cache (optional - uncomment if needed)...
REM rmdir /s /q "..\node_modules\.cache" 2>nul
REM echo ✓ Node modules cache cleared
echo.

cd ..
echo ========================================
echo   Cache clearing complete!
echo ========================================
echo.
echo Now you can rebuild your app:
echo   1. For development: npx react-native run-android
echo   2. For release APK: .\build-release.bat
echo.
pause


