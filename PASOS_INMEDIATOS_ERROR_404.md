# ⚡ SOLUCIÓN RÁPIDA AL ERROR 404

## 🎯 El Problema

Tu sitio da error 404 porque **Cloudflare está buscando los archivos en `.next/` pero los archivos están en `out/`**.

## ✅ Solución en 3 Pasos (5 minutos)

### PASO 1: Cambiar Configuración en Cloudflare

1. **Abre:** https://dash.cloudflare.com/
2. **Clic en:** "Workers & Pages" (menú izquierdo)
3. **Clic en:** Tu proyecto "gestiogar"
4. **Clic en:** Pestaña "Settings" (arriba)
5. **Clic en:** "Builds & deployments" (menú lateral)
6. **Busca:** "Build output directory"
7. **Cambia:** De `.next` a `out`
8. **Clic en:** "Save" (guardar)

### PASO 2: Limpiar Cache

Mientras estás en Settings:

1. **Clic en:** "Functions" (menú lateral)
2. **Clic en:** "Clear cache" (si aparece)

### PASO 3: Hacer Nuevo Deploy

Tienes 2 opciones:

**Opción A - Desde Cloudflare (más rápido):**
```
1. Pestaña "Deployments"
2. Último deployment → tres puntos "..."
3. "Retry deployment"
4. Esperar 2-3 minutos
```

**Opción B - Desde Git:**
```bash
# En tu terminal
git add .
git commit -m "Fix: actualizar configuración para Cloudflare"
git push origin main
# Cloudflare desplegará automáticamente
```

## ⏱️ Tiempo de Espera

- **Build:** 2-3 minutos
- **Propagación:** 30-60 segundos
- **Total:** ~3-5 minutos

## ✅ Verificar que Funcionó

Después de 3-5 minutos:

1. Abre: https://gestiogar.pages.dev
2. Refresca con Ctrl+F5 (o Cmd+Shift+R en Mac)
3. Debería aparecer tu sitio ✅

## 🔍 Si Todavía Sale Error 404

Ve a Cloudflare Pages → Deployments → Último deployment → **Ver el log**

Busca al final del log:

### ✅ Correcto (debe decir algo como):
```
✓ Generating static pages (32/32)
✨ Success! Uploaded 517 files
Deploying to Cloudflare's network...
✨ Success! Your site was deployed!
```

### ❌ Incorrecto (si dice):
```
Error: No files found in output directory
```
**Solución:** El output directory todavía está mal configurado.

## 📸 Configuración Correcta

Debe verse así:

```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build:cloudflare
Build output directory: out          ← ESTO ES CRUCIAL
```

## 💡 Importante

**El cambio de "Build output directory" NO se aplica automáticamente** a deployments antiguos. Por eso necesitas hacer un **nuevo deployment** (Paso 3).

---

## 🆘 Si Sigue Sin Funcionar

Comparte:
1. Captura de pantalla de tu configuración (Settings → Builds & deployments)
2. Las últimas 50 líneas del log del último deployment
3. Te ayudaré a diagnosticar el problema específico

