@echo off
cd /d "C:\Users\MB540WS\Downloads\Food App Management\backend"
start /B node server.js
start /B node tunnel_monitor.js
