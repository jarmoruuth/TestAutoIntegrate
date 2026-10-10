
@echo off
rem Collect Auto stretching analysis lines from the latest test logs into skyanalysis.txt
rem
rem   skyanalysis.bat                       use the test names listed below
rem   skyanalysis.bat <testlist.txt>        use test names from a TestAutoIntegrate test list,
rem                                         name is the second part of a line or the directory
rem                                         name of the setup file if the name is missing
rem   skyanalysis.bat <logfile>             process one log file
setlocal
if /i "%~x1" == ".txt" goto testlist
if not ".%~1" == "." goto process

del skyanalysis.txt 2>nul

call :latest HaLRGB
call :latest LRGB
call :latest Narrowband
call :latest NarrowbandFlowchart
call :latest LocalNormalization_Cone
call :latest Calibrate_LRGB
call :latest Calibrate_OSC
call :latest ExtractChannels
call :latest Comet_stars
call :latest Comet
call :latest SingleIntegrate
call :latest FastIntegrate
call :latest MARS_LRGB
call :latest MARS_HSO
call :latest RGB_HSO_TestRGBstars
call :latest RGB_HSO_TestMP
call :latest RGB_HSO_TestMPstars
call :latest VeraLux_Galaxy
call :latest M13
call :latest vDB
call :latest LRGB_ML
call :latest Chamaeleon_Dark_Nebula
call :latest Omega_Centauri_Globular_Cluster
call :latest Rosette_Nebula
call :latest Trifid_Nebula
call :latest Whirlpool_Galaxy
call :latest Galaxy_M81_Seestar
goto end

:testlist
if not exist "%~1" (
    echo Test list %~1 not found
    goto end
)
del skyanalysis.txt 2>nul
for /f "usebackq eol=# tokens=1,* delims=," %%A in ("%~1") do call :testline "%%A" "%%B"
goto end

:testline
rem %1 is the setup file, %2 is the optional test name
set "tname="
for /f "tokens=*" %%N in ("%~2") do set "tname=%%N"
if not defined tname for %%D in ("%~dp1.") do set "tname=%%~nxD"
call :latest "%tname%"
goto :eof

:latest
rem Match only name_date_time.log so that for example Comet does not match Comet_stars
for /f "delims=" %%F in ('dir /b /a-d /o-n "results\%~1_*.log" 2^>nul ^| findstr /r /i /c:"^%~1_[0-9]*_[0-9]*\.log$"') do (
    call :process "results\%%F"
    goto :eof
)
echo No matching file for %~1
goto :eof

:process
echo "%~1"
dgrep -b -A 9 "Auto stretching analysis" "%~1" >> skyanalysis.txt
goto :eof

:end
