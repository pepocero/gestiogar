# Script de limpieza para desarrollo - Gestiogar (PowerShell)
# 
# Este script ayuda a limpiar instancias múltiples de Supabase
# y otros problemas comunes en desarrollo.
# 
# Uso: .\scripts\cleanup.ps1

Write-Host "🧹 Iniciando limpieza de desarrollo..." -ForegroundColor Green

# Función para limpiar archivos temporales
function Cleanup-TempFiles {
    Write-Host "📁 Limpiando archivos temporales..." -ForegroundColor Yellow
    
    $tempDirs = @(
        ".next",
        "node_modules\.cache",
        ".vercel",
        "dist",
        "build"
    )
    
    foreach ($dir in $tempDirs) {
        if (Test-Path $dir) {
            Write-Host "  🗑️ Eliminando $dir..." -ForegroundColor Red
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Función para limpiar logs de desarrollo
function Cleanup-Logs {
    Write-Host "📝 Limpiando logs de desarrollo..." -ForegroundColor Yellow
    
    $logFiles = @(
        "npm-debug.log",
        "yarn-debug.log",
        "yarn-error.log",
        ".eslintcache"
    )
    
    foreach ($file in $logFiles) {
        if (Test-Path $file) {
            Write-Host "  🗑️ Eliminando $file..." -ForegroundColor Red
            Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
        }
    }
}

# Función para verificar configuración de Supabase
function Check-SupabaseConfig {
    Write-Host "🔍 Verificando configuración de Supabase..." -ForegroundColor Yellow
    
    $supabaseFile = "lib\supabase.ts"
    if (Test-Path $supabaseFile) {
        $content = Get-Content $supabaseFile -Raw
        
        # Verificar que tenga el patrón singleton
        if ($content -match "__supabaseInitialized") {
            Write-Host "  ✅ Patrón Singleton implementado" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Patrón Singleton no encontrado" -ForegroundColor Yellow
        }
        
        # Verificar configuración de auth
        if ($content -match "persistSession: true") {
            Write-Host "  ✅ Persistencia de sesión habilitada" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Persistencia de sesión no configurada" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Archivo lib\supabase.ts no encontrado" -ForegroundColor Red
    }
}

# Función para verificar dependencias
function Check-Dependencies {
    Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
    
    $packageJson = "package.json"
    if (Test-Path $packageJson) {
        $content = Get-Content $packageJson -Raw | ConvertFrom-Json
        
        # Verificar versión de Supabase
        $supabaseVersion = $content.dependencies.'@supabase/supabase-js'
        if ($supabaseVersion) {
            Write-Host "  ✅ Supabase JS: $supabaseVersion" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Supabase JS no encontrado en dependencias" -ForegroundColor Red
        }
        
        # Verificar Next.js
        $nextVersion = $content.dependencies.next
        if ($nextVersion) {
            Write-Host "  ✅ Next.js: $nextVersion" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Next.js no encontrado en dependencias" -ForegroundColor Red
        }
    }
}

# Función para generar reporte de limpieza
function Generate-CleanupReport {
    Write-Host "📊 Generando reporte de limpieza..." -ForegroundColor Yellow
    
    $report = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        cleanup = @{
            tempFiles = "Eliminados"
            logs = "Eliminados"
            supabaseConfig = "Verificado"
            dependencies = "Verificadas"
        }
        recommendations = @(
            "Reiniciar el servidor de desarrollo",
            "Limpiar caché del navegador",
            "Verificar que no haya múltiples instancias de Supabase",
            "Revisar logs de la consola del navegador"
        )
    }
    
    $report | ConvertTo-Json -Depth 3 | Out-File -FilePath "cleanup-report.json" -Encoding UTF8
    Write-Host "  📄 Reporte guardado en cleanup-report.json" -ForegroundColor Green
}

# Función para limpiar caché del navegador (instrucciones)
function Show-BrowserCacheInstructions {
    Write-Host "🌐 Instrucciones para limpiar caché del navegador:" -ForegroundColor Cyan
    Write-Host "  Chrome/Edge: Ctrl+Shift+Delete -> Seleccionar 'Todo' -> Eliminar" -ForegroundColor White
    Write-Host "  Firefox: Ctrl+Shift+Delete -> Seleccionar 'Todo' -> Eliminar" -ForegroundColor White
    Write-Host "  O usar modo incógnito para pruebas" -ForegroundColor White
}

# Función principal
function Main {
    try {
        Cleanup-TempFiles
        Cleanup-Logs
        Check-SupabaseConfig
        Check-Dependencies
        Generate-CleanupReport
        Show-BrowserCacheInstructions
        
        Write-Host "`n✅ Limpieza completada exitosamente!" -ForegroundColor Green
        Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
        Write-Host "  1. Ejecutar: npm run dev" -ForegroundColor White
        Write-Host "  2. Abrir DevTools y verificar consola" -ForegroundColor White
        Write-Host "  3. Buscar mensaje: '✅ Supabase inicializado correctamente'" -ForegroundColor White
        Write-Host "  4. Verificar que NO aparezca: 'Multiple GoTrueClient instances'" -ForegroundColor White
        
    } catch {
        Write-Host "❌ Error durante la limpieza: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar función principal
Main
