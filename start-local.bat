@echo off
cd /d "%~dp0"
echo ========================================
echo   AIMLOCK JAME - LOCAL SERVER
echo ========================================
echo.
if not exist node_modules (
  echo Dang cai thu vien Node.js, vui long doi...
  npm install
)
echo.
echo Dang mo app tai http://localhost:3000
echo Key mac dinh: Jame261103
echo Admin: http://localhost:3000/admin
echo Mat khau admin mac dinh: Admin11
echo.
start http://localhost:3000
npm start
pause
