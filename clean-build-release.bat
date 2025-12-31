@echo off
echo ========================================
echo   JomFood - Clean Release Build Script
echo   Clears caches and builds release APK/AAB
echo ========================================
echo.

echo [Step 1/6] Clearing Metro Bundler cache...
taskkill /F /IM node.exe 2>nul
if exist "%TEMP%\metro-*" (
    rmdir /s /q "%TEMP%\metro-*" 2>nul
)
if exist "%TEMP%\haste-map-*" (
    rmdir /s /q "%TEMP%\haste-map-*" 2>nul
)
echo ✓ Metro cache cleared
echo.

echo [Step 2/6] Clearing watchman cache (if installed)...
call watchman watch-del-all 2>nul
echo ✓ Watchman cache cleared (if available)
echo.

echo [Step 3/6] Clearing Android build cache...
cd android
call gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Gradle clean had issues, continuing anyway...
)
echo ✓ Android build cache cleared
echo.

echo [Step 4/6] Clearing Android app build directory...
if exist "app\build" (
    rmdir /s /q "app\build"
    echo ✓ Android app build directory cleared
) else (
    echo ℹ Android app build directory already clean
)
echo.

echo [Step 5/6] Clearing Gradle cache (optional)...
REM Uncomment the next line if you want to clear Gradle cache (slower but more thorough)
REM if exist "%USERPROFILE%\.gradle\caches" (
REM     rmdir /s /q "%USERPROFILE%\.gradle\caches"
REM     echo ✓ Gradle cache cleared
REM )
echo.

cd ..
echo [Step 6/6] Building release...
echo.
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
goto end

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


