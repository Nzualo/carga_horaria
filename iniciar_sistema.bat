@echo off
title SDEJT Inhassoro - Sistema de Gestao de Carga Horaria v2.0
color 1F

echo ======================================================================
echo    REPUBLICA DE MOCAMBIQUE - GOVERNO DO DISTRITO DE INHASSORO
echo    SERVICO DISTRITAL DE EDUCACAO, JUVENTUDE E TECNOLOGIA (SDEJT)
echo    SISTEMA DE GESTAO DE CARGA HORARIA - VERSAO 2.0
echo ======================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado neste computador!
    echo Instale o Node.js em https://nodejs.org e tente novamente.
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo [INFO] Instalando dependencias pela primeira vez...
    call npm install --omit=dev
)

echo [1/2] Agendando abertura automatica do navegador (http://localhost:3001)...
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3001"

echo [2/2] Iniciando Servidor Local (Porta 3001) e Base SQLite...
echo.
echo ======================================================================
echo  MANTENHA ESTA JANELA ABERTA ENQUANTO UTILIZA O SISTEMA NO NAVEGADOR.
echo  Para encerrar o sistema, feche esta janela (X) ou pressione Ctrl+C.
echo ======================================================================
echo.

node server/index.js

echo.
echo [AVISO] O servidor foi encerrado. Pressione qualquer tecla para fechar.
pause
