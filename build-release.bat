@echo off
echo ========================================
echo   JomFood - Release Build Script
echo ========================================
echo.

:menu
echo Select build type:
echo [1] Build APK (for testing/direct install)
echo [2] Build AAB (for Google Play Store)
echo [3] Build both APK and AAB
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto build_apk
if "%choice%"=="2" goto build_aab
if "%choice%"=="3" goto build_both
if "%choice%"=="4" goto end
echo Invalid choice. Please try again.
echo.
goto menu

:build_apk
echo.
echo Building Release APK...
cd android
call gradlew.bat assembleRelease
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   APK Build Successful!
    echo ========================================
    echo APK Location: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo ========================================
    echo   APK Build Failed!
    echo ========================================
)
cd ..
goto end

:build_aab
echo.
echo Building Release AAB (for Google Play Store)...
cd android
call gradlew.bat bundleRelease
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   AAB Build Successful!
    echo ========================================
    echo AAB Location: android\app\build\outputs\bundle\release\app-release.aab
    echo.
    echo You can now upload this AAB file to Google Play Console!
) else (
    echo.
    echo ========================================
    echo   AAB Build Failed!
    echo ========================================
)
cd ..
goto end

:build_both
echo.
echo Building both APK and AAB...
cd android
echo.
echo [1/2] Building APK...
call gradlew.bat assembleRelease
if %ERRORLEVEL% EQU 0 (
    echo APK Build Successful!
) else (
    echo APK Build Failed!
    cd ..
    goto end
)
echo.
echo [2/2] Building AAB...
call gradlew.bat bundleRelease
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Both Builds Successful!
    echo ========================================
    echo APK Location: android\app\build\outputs\apk\release\app-release.apk
    echo AAB Location: android\app\build\outputs\bundle\release\app-release.aab
) else (
    echo.
    echo ========================================
    echo   AAB Build Failed!
    echo ========================================
)
cd ..
goto end

:end
echo.
pause


