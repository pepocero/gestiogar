@echo off
echo Arreglando duplicados de Layout...

REM Lista de archivos a limpiar
set files=clients jobs technicians insurance reports invoices materials suppliers estimates appointments communications

for %%f in (%files%) do (
    echo Procesando app\%%f\page.tsx...
    
    REM Reemplazar import de Layout
    powershell -Command "(Get-Content 'app\%%f\page.tsx') -replace 'import \{ Layout \} from ''@/components/layout/Layout''', '// Layout se aplica automáticamente' | Set-Content 'app\%%f\page.tsx'"
    
    REM Reemplazar protectedRoute y Layout wrappers
    powershell -Command "(Get-Content 'app\%%f\page.tsx') -replace '<ProtectedRoute>[\r\n\s]*<Layout>\s*<div className=\"space-y-6\">', '<div className=\"space-y-6\">' | Set-Content 'app\%%f\page.tsx'"
    powershell -Command "(Get-Content 'app\%%f\page.tsx') -replace '</div>\s*</Layout>\s*</ProtectedRoute>', '</div>' | Set-Content 'app\%%f\page.tsx'"
)

REM Limpiar también module/slug
echo Procesando app\module\[slug]\page.tsx...
powershell -Command "(Get-Content 'app\module\[slug]\page.tsx') -replace 'import \{ Layout \} from ''@/components/layout/Layout''', '// Layout se aplica automáticamente' | Set-Content 'app\module\[slug]\page.tsx'"
powershell -Command "(Get-Content 'app\module\[slug]\page.tsx') -replace '<ProtectedRoute>[\r\n\s]*<Layout>\s*<div className=\"space-y-6\">', '<div className=\"space-y-6\">' | Set-Content 'app\module\[slug]\page.tsx'"
powershell -Command "(Get-Content 'app\module\[slug]\page.tsx') -replace '</div>\s*</Layout>\s*</ProtectedRoute>', '</div>' | Set-Content 'app\module\[slug]\page.tsx'"

REM Limpiar settings page
echo Procesando app\settings\page.tsx...
powershell -Command "(Get-Content 'app\settings\page.tsx') -replace 'import \{ Layout \} from ''@/components/layout/Layout''', '// Layout se aplica automáticamente' | Set-Content 'app\settings\page.tsx'"
powershell -Command "(Get-Content 'app\settings\page.tsx') -replace '<ProtectedRoute>[\r\n\s]*<Layout>\s*<div className=\"space-y-6\">', '<div className=\"space-y-6\">' | Set-Content 'app\settings\page.tsx'"
powershell -Command "(Get-Content 'app\settings\page.tsx') -replace '</div>\s*</Layout>\s*</ProtectedRoute>', '</div>' | Set-Content 'app\settings\page.tsx'"

echo ¡Limpieza completa!
