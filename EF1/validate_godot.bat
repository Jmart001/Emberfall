@echo off
REM ============================================================
REM  Emberfall - Godot headless validator
REM  Double-click this file. It runs Godot's import/parse pass
REM  and an 8-second runtime boot, writing everything to
REM  godot_validate.log in this folder. Claude can then read
REM  that log to diagnose parse/runtime errors.
REM
REM  If Godot has moved, edit the GODOT line below to point at
REM  your Godot_v4.7.1-stable_win64_console.exe.
REM ============================================================

set "GODOT=C:\Users\james\Downloads\Godot_v4.7.1-stable_win64.exe\Godot_v4.7.1-stable_win64_console.exe"
set "PROJ=%~dp0godot"
set "LOG=%~dp0godot_validate.log"

if not exist "%GODOT%" (
    echo COULD NOT FIND GODOT AT: "%GODOT%" > "%LOG%"
    echo Edit the GODOT path in validate_godot.bat and run again. >> "%LOG%"
    echo Godot not found - see %LOG%
    pause
    exit /b 1
)

echo === Emberfall validation %DATE% %TIME% ===> "%LOG%"
echo.>> "%LOG%"
echo === PASS 1: editor import / parse (--editor --quit) ===>> "%LOG%"
"%GODOT%" --headless --path "%PROJ%" --editor --quit >> "%LOG%" 2>&1
echo.>> "%LOG%"
echo === PASS 2: runtime boot for 8 seconds (--quit-after 8) ===>> "%LOG%"
"%GODOT%" --headless --path "%PROJ%" --quit-after 8 >> "%LOG%" 2>&1
echo.>> "%LOG%"
echo === DONE ===>> "%LOG%"

echo Validation complete. Log written to:
echo   %LOG%
echo Tell Claude it is ready and it will read the log.
pause
