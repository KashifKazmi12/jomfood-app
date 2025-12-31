@echo off
REM ============================================
REM RESTORE ORIGINAL RELEASE KEYSTORE
REM ============================================
REM This script restores your original release keystore
REM Use this when you want to revert back to your original production SHA-1

echo.
echo ============================================
echo RESTORING ORIGINAL RELEASE KEYSTORE
echo ============================================
echo.

cd /d "%~dp0"

if not exist "jomfood-release.keystore.backup" (
    echo ERROR: Backup file 'jomfood-release.keystore.backup' not found!
    echo Cannot restore original release keystore.
    pause
    exit /b 1
)

echo Current release keystore will be replaced with the original backup...
echo.
pause

REM Remove current release keystore
if exist "jomfood-release.keystore" (
    del /f "jomfood-release.keystore"
    echo Removed current jomfood-release.keystore
)

REM Restore backup
copy /y "jomfood-release.keystore.backup" "jomfood-release.keystore"
echo.
echo ============================================
echo SUCCESS! Original release keystore restored.
echo ============================================
echo.
echo Your original Production SHA-1 is: 5C:5B:9F:2A:12:F4:A8:54:69:00:57:EF:98:E1:6B:E8:FD:93:31:B6
echo.
echo IMPORTANT: 
echo 1. Clean and rebuild your app: cd .. && gradlew clean
echo 2. Rebuild release: cd .. && gradlew assembleRelease
echo.
pause

