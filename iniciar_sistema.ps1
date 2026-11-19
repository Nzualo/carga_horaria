Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   REPÚBLICA DE MOÇAMBIQUE - GOVERNO DO DISTRITO DE INHASSORO" -ForegroundColor White
Write-Host "   SERVIÇO DISTRITAL DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA (SDEJT)" -ForegroundColor White
Write-Host "   SISTEMA INTEGRADO DE CARGA HORÁRIA E EFECTIVOS DOCENTES (2026)" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host "`n[1/2] Iniciando Servidor e Base de Dados SQLite Local..." -ForegroundColor Green
$serverJob = Start-Process -FilePath "node" -ArgumentList "server/index.js" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "[2/2] Abrindo o Sistema no Navegador..." -ForegroundColor Green
Start-Process "http://localhost:3001"

Write-Host "`nSistema em execução em http://localhost:3001" -ForegroundColor Yellow
Write-Host "Pressione qualquer tecla para encerrar..."

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Stop-Process -Id $serverJob.Id -Force -ErrorAction SilentlyContinue

