@echo off
REM ============================================
REM RESTORE ORIGINAL DEBUG KEYSTORE
REM ============================================
REM This script restores your original debug.keystore
REM Use this when you want to revert back to your original SHA-1

echo.
echo ============================================
echo RESTORING ORIGINAL DEBUG KEYSTORE
echo ============================================
echo.

cd /d "%~dp0"

if not exist "debug.keystore.backup" (
    echo ERROR: Backup file 'debug.keystore.backup' not found!
    echo Cannot restore original keystore.
    pause
    exit /b 1
)

echo Current keystore will be replaced with the original backup...
echo.
pause

REM Remove current keystore
if exist "debug.keystore" (
    del /f "debug.keystore"
    echo Removed current debug.keystore
)

REM Restore backup
copy /y "debug.keystore.backup" "debug.keystore"
echo.
echo ============================================
echo SUCCESS! Original keystore restored.
echo ============================================
echo.
echo Your original SHA-1 is: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
echo.
echo IMPORTANT: 
echo 1. Clean and rebuild your app: cd .. && gradlew clean
echo 2. Rebuild: npx react-native run-android
echo.
pause

