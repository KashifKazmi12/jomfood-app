@echo off
echo ========================================
echo   Starting Metro Bundler
echo   Required for Debug Builds
echo ========================================
echo.
echo Metro bundler will start in a new window
echo Keep it running while testing your app
echo.
echo Press Ctrl+C in Metro window to stop
echo.

start "Metro Bundler" cmd /k "npx react-native start --reset-cache"

echo.
echo ✓ Metro bundler starting...
echo.
echo Wait a few seconds for Metro to start, then:
echo   - Run: npx react-native run-android (for debug)
echo   - Or open your app on device/emulator
echo.
pause

