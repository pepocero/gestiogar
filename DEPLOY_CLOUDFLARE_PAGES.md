# Guía de Deploy para Cloudflare Pages

## Problema Identificado

Cloudflare Pages tiene un límite de **25 MiB** por archivo individual. Durante el build de Next.js, se generan archivos de cache de webpack que superan este límite:

- `.next/cache/webpack/client-production/0.pack` (~100 MB)
- `.next/cache/webpack/server-production/0.pack` (~84 MB)
- `.next/cache/webpack/server-production/9.pack` (~38 MB)
- `node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` (~130 MB)

## Soluciones Implementadas

### 1. Archivo `.cfignore`

Se creó un archivo `.cfignore` en la raíz del proyecto que excluye:
- `node_modules/`
- `.next/` (carpeta de build completa)
- Archivos de cache
- Archivos de desarrollo y documentación

### 2. Optimización de `next.config.js`

Se agregaron las siguientes configuraciones:

```javascript
{
  output: 'standalone',
  compress: true,
  webpack: (config, { isServer }) => {
    if (process.env.NODE_ENV === 'production') {
      config.cache = false; // Deshabilitar cache en producción
    }
    return config;
  }
}
```

### 3. Scripts de Limpieza

Se crearon scripts para limpiar archivos grandes antes del deploy:

**Node.js:**
```bash
npm run clean-deploy
```

**PowerShell (Windows):**
```bash
npm run clean-deploy:win
```

**Build optimizado para Cloudflare:**
```bash
npm run build:cloudflare
```

Este comando limpia los archivos de cache y luego ejecuta el build.

## Configuración en Cloudflare Pages

### Configuración Recomendada

En la configuración de tu proyecto en Cloudflare Pages, usa:

**Build command:**
```bash
npm run build:cloudflare
```

**Build output directory:**
```
out
```

**Node version:**
```
18
```

**Environment variables:**
- Asegúrate de agregar todas las variables de entorno necesarias (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Otras variables específicas de tu proyecto

## Pasos para Deploy

### Opción 1: Deploy Automático desde Git

1. Conecta tu repositorio en Cloudflare Pages
2. Configura el build command: `npm run build:cloudflare`
3. Configura el output directory: `out`
4. Agrega las variables de entorno
5. Deploy

### Opción 2: Deploy Manual

1. Ejecuta localmente:
   ```bash
   npm run clean-deploy
   npm run build
   ```

2. Sube los archivos necesarios a Cloudflare Pages

## Verificación

Para verificar que no hay archivos grandes, ejecuta:

**PowerShell:**
```powershell
Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 25MB } | Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}} | Sort-Object SizeMB -Descending
```

**Bash/Linux:**
```bash
find . -type f -size +25M -exec ls -lh {} \; | awk '{ print $9 ": " $5 }'
```

## Troubleshooting

### Error: "File too large"

Si sigues viendo este error:

1. Verifica que `.cfignore` existe y contiene las exclusiones correctas
2. Elimina la carpeta `.next` localmente: `rm -rf .next`
3. Ejecuta `npm run build:cloudflare`
4. Intenta el deploy nuevamente

### Error: "Build failed"

1. Verifica que todas las variables de entorno están configuradas
2. Revisa los logs de build en Cloudflare Pages
3. Asegúrate de que la versión de Node.js es compatible (18+)

### Cache persistente

Si Cloudflare sigue intentando usar archivos en cache:

1. Ve a tu proyecto en Cloudflare Pages
2. Settings → Build & deployments
3. Clear cache
4. Trigger new deployment

## Archivos Importantes

- `.cfignore` - Archivos que Cloudflare Pages debe ignorar
- `next.config.js` - Configuración de Next.js optimizada
- `scripts/clean-before-deploy.js` - Script de limpieza Node.js
- `scripts/clean-before-deploy.ps1` - Script de limpieza PowerShell

## Notas Adicionales

- El archivo `.cfignore` funciona similar a `.gitignore` pero específicamente para Cloudflare Pages
- Los archivos de `node_modules` se instalan automáticamente durante el build en Cloudflare
- No es necesario subir la carpeta `.next` completa, solo los archivos del build
- La opción `output: 'standalone'` en Next.js genera un build optimizado para despliegue

