# Script para limpiar archivos grandes antes del deploy en Cloudflare Pages
# Elimina archivos de cache que exceden los 25 MiB

Write-Host "Iniciando limpieza pre-deploy para Cloudflare Pages..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

$dirsToClean = @(
    ".next\cache",
    "node_modules\.cache",
    ".cache"
)

foreach ($dir in $dirsToClean) {
    $fullPath = Join-Path -Path $projectRoot -ChildPath $dir
    
    if (Test-Path -Path $fullPath) {
        Write-Host "Limpiando: $dir..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction Stop
            Write-Host "[OK] $dir eliminado exitosamente" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] Error al eliminar ${dir}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "[SKIP] $dir no existe, omitiendo..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Limpieza completada. El proyecto esta listo para deploy." -ForegroundColor Green

