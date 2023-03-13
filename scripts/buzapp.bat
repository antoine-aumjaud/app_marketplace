@echo off

set TARGET_PATH=%USERPROFILE%\bin\buzapp
set TARGET_PATH_APPS=%TARGET_PATH%\apps

set BIN_URL=file:///c:/Users/antoi/prog/buzapp/buzapp/src-tauri/target/release/buzapp.exe
set BIN_VERSION_URL=file:///c:/Users/antoi/prog/buzapp/buzapp/src-tauri/target/buzapp.version

:check_bin
if not exist %TARGET_PATH% (goto copy_bin) else (goto check_bin_version)

:copy_bin
echo -- Create path %TARGET_PATH%
mkdir %TARGET_PATH% > nul 2>&1
echo -- Copy batch file
copy %~f0 %TARGET_PATH%\buzapp.bat > nul 2>&1
echo -- Get binary and version
curl -ksS -o %TARGET_PATH%\buzapp.exe %BIN_URL%
if %errorlevel% neq 0 (goto error)
curl -ksS -o %TARGET_PATH%\buzapp.version %BIN_VERSION_URL%
if %errorlevel% neq 0 (goto error)
goto add_icon

:check_bin_version
echo -- Check for updates
curl -ksS -o %TEMP%\buzapp.version %BIN_VERSION_URL%
if %errorlevel% neq 0 (goto error)
fc %TEMP%\buzapp.version %TARGET_PATH%\buzapp.version > nul 2>&1  && (goto add_icon) || (goto copy_bin)

:add_icon
echo -- Add icon on desktop
powershell -Noprofile -c "$s=(New-Object -COM WScript.Shell).CreateShortcut(\"$env:USERPROFILE\Desktop\BuzApp.lnk\"); $s.TargetPath=\"$env:USERPROFILE\bin\buzapp\buzapp.bat\"; $s.Save()"
if %errorlevel% neq 0 (goto error)

:launch_app
echo -- Launch application
start %USERPROFILE%/bin/buzapp/buzapp.exe
goto :EOF

:error
echo ERROR: an error occured
pause