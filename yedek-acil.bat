@echo off
title Ada Bereket - Acil Yedek
color 0E

cd /d "%~dp0"

echo ============================================================
echo               ACIL MANUEL YEDEK
echo ============================================================
echo.
echo Suanki veritabani yedekleniyor...
echo.

set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

set HEDEF=backups\acil-yedek-%TIMESTAMP%.db

if not exist "backups" mkdir backups

copy "prisma\tilbe.db" "%HEDEF%" >nul

if exist "%HEDEF%" (
    echo.
    echo BASARILI:
    echo   Yedek dosyasi: %HEDEF%
    echo.
    dir "%HEDEF%" | findstr ".db"
) else (
    echo.
    echo HATA: Yedek alinamadi
    echo prisma\tilbe.db dosyasini bulunamadi mi kontrol edin.
)

echo.
echo ============================================================
pause
