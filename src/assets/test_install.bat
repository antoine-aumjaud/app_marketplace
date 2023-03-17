@echo off
echo .

echo %CD%
echo %APPS_PATH%
echo %APP_PATH%

md "%APP_PATH%"
echo echo coucou > "%APP_PATH%/launch.bat"