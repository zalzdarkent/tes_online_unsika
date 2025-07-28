@echo off
echo Starting Laravel Queue Worker...
cd /d "D:\Projek\tes_online_unsika"
:loop
php artisan queue:work --sleep=3 --tries=3 --timeout=60
timeout /t 5 /nobreak > nul
goto loop
