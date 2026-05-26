@echo off
title Ada Bereket Kurban 2026 - Durdurma
color 0C

echo ============================================================
echo               SISTEM DURDURULUYOR
echo ============================================================
echo.

echo Port 3000'i kullanan islemleri ariyorum...
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Process ID %%a kapatiliyor...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if %FOUND%==0 (
    echo Port 3000'de calisan islem yok.
) else (
    echo.
    echo Sistem durduruldu.
)

echo.
echo ============================================================
echo  Yeniden baslatmak icin: baslat.bat
echo ============================================================
echo.
pause
