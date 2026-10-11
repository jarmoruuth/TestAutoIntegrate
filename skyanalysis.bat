
@echo off
rem Collect Auto stretching analysis lines from the latest test logs
rem
rem   skyanalysis.bat <testlist.txt>        use test names from a TestAutoIntegrate test list,
rem                                         name is the second part of a line or the directory
rem                                         name of the setup file if the name is missing,
rem                                         output goes to skyanalysis_<testlist>.txt
rem   skyanalysis.bat <logfile>             process one log file,
rem                                         output goes to skyanalysis_<logfile>.txt
setlocal
if ".%~1" == "." goto usage
set "outfile=skyanalysis_%~n1.txt"
if /i "%~x1" == ".txt" goto testlist
del "%outfile%" 2>nul
call :process "%~1"
goto done

:usage
echo Usage: skyanalysis.bat ^<testlist.txt^> ^| ^<logfile^>
goto end

:testlist
if not exist "%~1" (
    echo Test list %~1 not found
    goto end
)
del "%outfile%" 2>nul
for /f "usebackq eol=# tokens=1,* delims=," %%A in ("%~1") do call :testline "%%A" "%%B"
goto done

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
dgrep -b -A 9 "Auto stretching analysis" "%~1" >> "%outfile%"
goto :eof

:done
echo Output written to %outfile%

:end
