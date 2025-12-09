# Solución al Error 404 en Cloudflare Pages

## 🔴 Error Actual

```
HTTP ERROR 404
GET https://gestiogar.pages.dev/ net::ERR_HTTP_RESPONSE_CODE_FAILURE
```

## 🎯 Causa del Problema

Cloudflare Pages está buscando los archivos en la ubicación **incorrecta**. Probablemente todavía tiene configurado:

```
Build output directory: .next  ❌ INCORRECTO
```

Pero con `output: 'export'` en Next.js, los archivos se generan en:

```
Build output directory: out    ✅ CORRECTO
```

## ✅ Solución Paso a Paso

### 1. Ir a Cloudflare Pages Dashboard

```
https://dash.cloudflare.com/
→ Workers & Pages
→ Tu proyecto "gestiogar"
→ Settings
→ Builds & deployments
```

### 2. Verificar/Cambiar la Configuración

En la sección **"Build configurations"**, debe estar:

```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build:cloudflare
Build output directory: out            ← CAMBIAR ESTO
Root directory: (dejar vacío o /)
```

### 3. Clic en "Save"

Después de cambiar, haz clic en **"Save"** para guardar los cambios.

### 4. Crear un Nuevo Deploy

Hay dos opciones:

**Opción A: Retry Deployment (Rápido)**
```
1. Ve a: Deployments (pestaña)
2. Encuentra el último deployment
3. Clic en los tres puntos "..."
4. Clic en "Retry deployment"
```

**Opción B: Trigger desde Git (Recomendado)**
```
1. Haz cualquier cambio mínimo (ej: agregar espacio en README)
2. git add .
3. git commit -m "Trigger redeploy con configuración correcta"
4. git push origin main
5. Cloudflare desplegará automáticamente
```

### 5. Clear Build Cache (Opcional pero Recomendado)

```
Settings → Functions → Clear cache
```

Esto asegura que Cloudflare no use cache antiguo.

## 🔍 Verificar la Configuración Actual

### En Cloudflare Pages:

1. **Ve a tu proyecto** → Settings → Builds & deployments
2. **Busca "Build output directory"**
3. Si dice `.next` → **¡Este es el problema!**
4. Cámbialo a `out`

### Verificación de Variables de Entorno

También verifica que tengas las variables de entorno:

```
Settings → Environment variables → Production

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 📸 Captura de Pantalla de Referencia

Tu configuración debe verse así:

```
┌────────────────────────────────────────┐
│ Build configurations                    │
├────────────────────────────────────────┤
│ Framework preset:                       │
│   Next.js (Static HTML Export)         │
│                                         │
│ Build command:                          │
│   npm run build:cloudflare             │
│                                         │
│ Build output directory:                 │
│   out                              ← ✅ │
│                                         │
│ Root directory (advanced):              │
│   (empty)                               │
│                                         │
│ Environment variables:                  │
│   Production: 2 variables               │
└────────────────────────────────────────┘
```

## 🚨 Si Todavía No Funciona

### 1. Verificar el Log del Build

```
Cloudflare Dashboard
→ Deployments (pestaña)
→ Clic en el último deployment
→ Ver el log completo
```

**Busca estas líneas al final:**

```
✓ Generating static pages (32/32)
✨ Success! Uploaded 517 files (X.XX sec)
```

Si dice "Success", el build está bien.

### 2. Verificar que la carpeta `out` tiene contenido

En el log de build, busca:

```
Validating asset output directory
✨ Success! Uploaded XXX files
```

Si dice "0 files", el output directory está mal.

### 3. Estructura Esperada en `out/`

Después del build, tu carpeta `out/` debe tener:

```
out/
├── index.html           ← Página principal
├── 404.html
├── _next/
│   ├── static/
│   └── ...
├── auth/
│   ├── login/
│   │   └── index.html
│   └── register/
│       └── index.html
├── dashboard/
│   └── index.html
└── ...
```

## 🔄 Alternativa: Deploy Manual para Prueba

Si quieres probar rápidamente:

```bash
# 1. En tu proyecto local
npm run build

# 2. Verificar que out/ tiene contenido
ls out/

# 3. Subir manualmente a Cloudflare Pages
# (Usar Wrangler CLI o la interfaz web)
```

## 📝 Checklist de Verificación

- [ ] Build output directory = `out` (no `.next`)
- [ ] Build command = `npm run build:cloudflare` o `npm run build`
- [ ] Variables de entorno configuradas
- [ ] Cache limpiado
- [ ] Nuevo deployment ejecutado
- [ ] Log de build sin errores
- [ ] "Success! Uploaded XXX files" en el log

## 🎯 Próximos Pasos

1. **Ahora mismo:** Cambia el output directory a `out`
2. **Guarda los cambios**
3. **Retry deployment** o haz un push
4. **Espera 2-3 minutos**
5. **Refresca tu sitio:** https://gestiogar.pages.dev

## 💡 Tip Importante

Cada vez que cambies la configuración de build en Cloudflare, **DEBES hacer un nuevo deployment**. Los cambios de configuración no se aplican automáticamente a deployments existentes.

---

**Si después de esto sigue sin funcionar, revisa el log completo del último deployment y busca errores específicos.**

