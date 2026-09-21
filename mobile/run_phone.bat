@echo off
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "169.254"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo Using API_URL=http://%IP%:8000
flutter run -d RZ8T5023Z2P --dart-define=API_URL=http://%IP%:8000