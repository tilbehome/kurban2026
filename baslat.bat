@echo off
title Ada Bereket Kurban 2026 - Production Server
color 0A

cd /d "%~dp0"

echo ============================================================
echo.
echo               ADA BEREKET KURBAN 2026
echo               Production Server - Bayram
echo.
echo ============================================================
echo.
echo  Tarih    : %date% %time%
echo  Klasor   : %cd%
echo  IP       : 192.168.1.89:3000
echo.
echo ============================================================
echo  KULLANIM ADRESLERI:
echo ============================================================
echo.
echo  Yonetici Paneli : http://192.168.1.89:3000
echo  TV Ekrani       : http://192.168.1.89:3000/tv
echo  Personel        : http://192.168.1.89:3000/tv/personel
echo  Musteri Telefon : http://192.168.1.89:3000/tv/m
echo.
echo ============================================================
echo  UYARILAR:
echo ============================================================
echo.
echo  - Bu pencereyi KAPATMAYIN
echo  - Kapatirsaniz sistem durur
echo  - Sistem durursa 5sn sonra otomatik yeniden baslar
echo  - Acil durdurma: durdur.bat dosyasini calistirin
echo.
echo ============================================================
echo.
echo  Server baslatiliyor...
echo.

:BASLA
call pnpm start

echo.
echo ============================================================
echo   SISTEM DURDU - 5 SANIYE SONRA YENIDEN BASLAYACAK
echo ============================================================
echo.
echo   Tum durdurmak icin: Ctrl+C 2 kere bas
echo.
REM 5 saniye bekle (ping -n 6 = 5 saniye gecikme, timeout.exe yoksa da calisir)
ping -n 6 127.0.0.1 >nul

goto BASLA
