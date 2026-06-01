@echo off
echo ==========================================
echo   Day By Day - Service Bootstrapper
echo ==========================================
echo.

echo [+] Starting Backend API in a new window...
start "Day By Day - Backend" cmd /k "cd backend && npm run dev"

echo [+] Starting Frontend App in a new window...
start "Day By Day - Frontend" cmd /k "cd frontend && npx vite --port 5173"

echo [+] Starting Admin Panel in a new window...
start "Day By Day - Admin" cmd /k "cd admin && npx vite --port 5174"

echo.
echo ==========================================
echo   All services have been launched!
echo   - Backend: http://127.0.0.1:8000
echo   - Frontend: http://localhost:5173
echo   - Admin Panel: http://localhost:5174
echo ==========================================
echo.
pause
