@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\MB540WS\Downloads\Food App Management"
call "C:\Users\MB540WS\AppData\Roaming\npm\pm2.cmd" start ecosystem.config.js
