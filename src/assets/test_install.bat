echo %CD%
echo %APPS_PATH%
echo %APP_PATH%

md "%APP_PATH%"
echo echo coucou > "%APP_PATH%/launch.bat"

echo %time%
ping 127.0.0.1 -n 15 > nul
echo %time%
