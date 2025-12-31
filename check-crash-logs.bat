@echo off
echo ========================================
echo   JomFood - Crash Log Checker
echo   This will show recent crash logs
echo ========================================
echo.

echo Checking for connected Android devices...
adb devices
echo.

echo ========================================
echo   Recent Logcat Errors (last 50 lines)
echo ========================================
adb logcat -d | findstr /i "error exception crash fatal" | tail -n 50
echo.

echo ========================================
echo   Full Recent Logcat (last 100 lines)
echo ========================================
adb logcat -d -t 100
echo.

echo ========================================
echo   To see live logs, run:
echo   adb logcat
echo ========================================
echo.
pause

