@echo off

set TARGET_PATH=%USERPROFILE%\bin\bizapp

set BIN_URL=file:///c:/Users/antoi/prog/bizapp/src-tauri/target/release/bizapp.exe
set BAT_URL=file:///c:/Users/antoi/prog/bizapp/script/bizapp.bat
set BIN_VERSION_URL=file:///c:/Users/antoi/prog/bizapp/src-tauri/target/bizapp.version

set APPS_URL="apps.json"
set APPS_PATH=%USERPROFILE%\bin\bizapp\apps

:check_bin
if not exist %TARGET_PATH% (goto copy_bin) else (goto check_bin_version)

:copy_bin
echo -- Create path %TARGET_PATH%
mkdir %TARGET_PATH% > nul 2>&1
mkdir %APPS_PATH% > nul 2>&1
echo -- Get batch file
curl --fail -ksS -o %TARGET_PATH%\bizapp.bat %BAT_URL%
if %errorlevel% neq 0 (goto error)
echo -- Get binary and version
curl --fail -ksS -o %TARGET_PATH%\bizapp.exe %BIN_URL%
if %errorlevel% neq 0 (goto error)
curl --fail -ksS -o %TARGET_PATH%\bizapp.version %BIN_VERSION_URL%
if %errorlevel% neq 0 (goto error)
goto add_icon

:check_bin_version
echo -- Check for updates
curl -ksS -o %TEMP%\bizapp.version %BIN_VERSION_URL%
if %errorlevel% neq 0 (goto error)
fc %TEMP%\bizapp.version %TARGET_PATH%\bizapp.version > nul 2>&1  && (goto add_icon) || (goto copy_bin)

:add_icon
echo -- Add icon on desktop
powershell -Noprofile -c "$s=(New-Object -COM WScript.Shell).CreateShortcut(\"$env:USERPROFILE\Desktop\bizapp.lnk\");                           $s.TargetPath=\"$env:USERPROFILE\bin\bizapp\bizapp.bat\"; $s.IconLocation=\"$env:USERPROFILE\bin\bizapp\bizapp.exe\"; $s.Save()"
if %errorlevel% neq 0 (goto error)
echo -- Add icon on Windows Start menu
powershell -Noprofile -c "$s=(New-Object -COM WScript.Shell).CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\bizapp.lnk\"); $s.TargetPath=\"$env:USERPROFILE\bin\bizapp\bizapp.bat\"; $s.IconLocation=\"$env:USERPROFILE\bin\bizapp\bizapp.exe\"; $s.Save()"
if %errorlevel% neq 0 (goto error)

:launch_app
echo -- Launch application
start %USERPROFILE%/bin/bizapp/bizapp.exe
goto :EOF

:error
echo ERROR: an error occured
pause