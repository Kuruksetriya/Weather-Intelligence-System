@echo off
setlocal
echo ========================================================
echo   WeatherIntel - Push Repository to GitHub
echo ========================================================
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/USERNAME/weather-intelligence-system.git): "

if "%REPO_URL%"=="" (
    echo Error: No repository URL entered.
    pause
    exit /b
)

echo.
echo Setting remote origin to %REPO_URL% ...
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" remote remove origin 2>nul
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" remote add origin %REPO_URL%
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" branch -M main

echo.
echo Pushing main branch to GitHub...
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Your repository has been uploaded to GitHub!
) else (
    echo [NOTE] If push failed due to authentication, make sure you are logged in to GitHub or use a GitHub Personal Access Token (PAT).
)
echo.
pause
