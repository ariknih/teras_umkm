@echo off
title Saloka.id - Local Dev & Cloudflare Tunnel

:: 1. Cek / Download cloudflared.exe jika tidak ada
where cloudflared.exe >nul 2>nul
if %errorlevel% equ 0 (
    set CLOUDFLARED_PATH=cloudflared.exe
    goto :run
)

if exist "cloudflared.exe" (
    set CLOUDFLARED_PATH=cloudflared.exe
    goto :run
)

echo [INFO] Mengunduh cloudflared.exe (hanya sekali)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"

if not exist "cloudflared.exe" (
    echo [ERROR] Gagal mengunduh cloudflared.exe secara otomatis.
    echo Silakan unduh manual dan letakkan di folder ini dengan nama 'cloudflared.exe'.
    pause
    exit /b 1
)
set CLOUDFLARED_PATH=cloudflared.exe

:run
:: 2. Jalankan Server Lokal (npm run dev) di jendela CMD baru
echo [INFO] Menjalankan Server Lokal (npm run dev)...
start "Saloka.id Local Dev" cmd /k "npm run dev"

:: Tunggu 8 detik agar server lokal menyala sempurna
echo [INFO] Menunggu server lokal siap (8 detik)...
timeout /t 8 >nul

:: 3. Jalankan Cloudflare Tunnel di jendela ini
echo [INFO] Menjalankan Cloudflare Tunnel...
%CLOUDFLARED_PATH% tunnel run --token eyJhIjoiMGY5NmIyN2VlZDMzMDc1ODFkOTZmMTdmYzEyN2ZmOTgiLCJ0IjoiMzhlZmNlODUtNGVkZC00ZTJkLWI5YjQtOTE3ZDBkMTBkMzcxIiwicyI6Ik1UUTBNak16WldRdE5UZGtPUzAwTURjd0xUbGpOalV0TXpsbU5qUTJNR1poWTJFeSJ9
