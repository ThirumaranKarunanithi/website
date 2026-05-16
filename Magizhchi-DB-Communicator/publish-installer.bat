@echo off
REM ============================================================
REM  Build the Windows installer and publish it to the website.
REM
REM  Usage (from project root):
REM      publish-installer.bat
REM
REM  What it does:
REM    1. Runs `mvn -P winsetup clean package`
REM    2. Copies the resulting .exe to ..\website\public\downloads\
REM ============================================================
setlocal

set "VERSION=0.1.0"
set "INSTALLER=MagizhchiDBCommunicator-Setup-%VERSION%.exe"
set "SRC=%~dp0target\installer-output\%INSTALLER%"
set "DEST_DIR=%~dp0..\website\public\downloads"

echo.
echo === Building installer ===
echo.
call mvn -P winsetup -DskipTests clean package
if errorlevel 1 (
    echo.
    echo BUILD FAILED. Not copying.
    exit /b 1
)

if not exist "%SRC%" (
    echo.
    echo ERROR: expected installer not found at %SRC%
    exit /b 1
)

if not exist "%DEST_DIR%" (
    mkdir "%DEST_DIR%"
)

echo.
echo === Copying installer to website ===
echo  From: %SRC%
echo  To:   %DEST_DIR%\%INSTALLER%
copy /Y "%SRC%" "%DEST_DIR%\%INSTALLER%"
if errorlevel 1 (
    echo.
    echo COPY FAILED.
    exit /b 1
)

echo.
echo === Done ===
echo  Installer published at /downloads/%INSTALLER%
echo  Rebuild the website (`npm run build`) to refresh the dist bundle.
endlocal
