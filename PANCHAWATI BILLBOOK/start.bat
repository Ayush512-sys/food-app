@echo off
echo Starting BillBook Application...

cd backend
echo Pushing database schema...
call npx prisma generate
call npx prisma db push

echo Starting Backend Server...
start powershell -NoExit -Command "npm run dev"

cd ../frontend
echo Starting Frontend Server...
start powershell -NoExit -Command "npm run dev"

echo Both servers started!
echo Waiting for servers to initialize...
timeout /t 4
echo Opening browser...
start http://127.0.0.1:5173
