@echo off
chcp 65001 >nul
title AI활성화진흥공단 ITSM 포털 바로가기
echo.
echo  ========================================
echo   AI활성화진흥공단 · ITSM_CURSOR 포털
echo  ========================================
echo.
echo  [1] GitHub 소스 (온라인) 열기
echo  [2] 로컬 포털 http://localhost:8000 열기
echo  [3] 로컬 개발  http://localhost:5173 열기
echo  [4] 종료
echo.
set /p choice=번호 선택: 

if "%choice%"=="1" start "" "https://github.com/hudsonkim77/ITSM_CURSOR"
if "%choice%"=="2" start "" "http://localhost:8000/"
if "%choice%"=="3" start "" "http://localhost:5173/"
if "%choice%"=="4" exit /b 0

echo.
pause
