# Solución: Error de Autenticación en Cloudflare Pages

## 🔴 Síntoma

- Sitio carga correctamente
- Al hacer clic en "Iniciar Sesión" aparece: **"Sesión expirada. Redirigiendo al login..."**
- Se queda cargando y no redirige
- No hay errores en consola

## 🎯 Causa del Problema

**Las variables de entorno de Supabase NO están configuradas en Cloudflare Pages.**

Sin estas variables, Supabase no puede inicializarse, por lo que:
1. La verificación de sesión falla
2. El AuthContext detecta "sesión expirada"
3. Muestra el toast pero no puede redirigir porque el cliente de Supabase no está configurado

## ✅ Solución: Configurar Variables de Entorno

### PASO 1: Obtener tus Variables de Supabase

Ve a tu proyecto en Supabase:

1. **Abre:** https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Clic en:** Settings (⚙️ en el menú lateral)
4. **Clic en:** API

Copia estas 2 variables:

```
Project URL:
https://xxxxxxxxx.supabase.co

Project API keys → anon public:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### PASO 2: Agregar Variables en Cloudflare Pages

1. **Ve a:** https://dash.cloudflare.com/
2. **Workers & Pages** → Tu proyecto "gestiogar"
3. **Clic en:** Settings (pestaña superior)
4. **Clic en:** "Environment variables" (menú lateral)
5. **En la sección "Production"**, clic en **"Add variable"**

Agrega estas 2 variables:

#### Variable 1:
```
Variable name: NEXT_PUBLIC_SUPABASE_URL
Value: https://tu-proyecto.supabase.co
```
(Reemplaza con tu URL real de Supabase)

#### Variable 2:
```
Variable name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Pega tu anon key completa de Supabase)

**IMPORTANTE:** Asegúrate de que el "Environment" sea **"Production"** (no Preview).

### PASO 3: Guardar y Re-Desplegar

1. **Clic en "Save"** después de agregar cada variable

2. **Ir a la pestaña "Deployments"**

3. **Buscar el último deployment** y hacer clic en los tres puntos "..."

4. **Clic en "Retry deployment"** o "Redeploy"

5. **Esperar 2-3 minutos** mientras se re-construye con las variables

### PASO 4: Verificar

1. Espera a que el deployment termine (Status: Success)
2. Abre tu sitio: https://gestiogar.pages.dev
3. **Refresca con Ctrl+F5**
4. Haz clic en "Iniciar Sesión"
5. Debería llevarte a `/auth/login` correctamente ✅

## 🔍 Verificar Variables de Entorno

Para verificar que las variables están configuradas:

1. Cloudflare Pages → Settings → Environment variables
2. En "Production" deberías ver:
   ```
   NEXT_PUBLIC_SUPABASE_URL          ✅
   NEXT_PUBLIC_SUPABASE_ANON_KEY     ✅
   ```

## 🐛 Si Sigue Sin Funcionar

### Verificación 1: Comprobar en Consola del Navegador

1. Abre tu sitio: https://gestiogar.pages.dev
2. **F12** para abrir DevTools
3. **Pestaña Console**
4. Escribe:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

**Si dice `undefined`:**
- Las variables NO se aplicaron correctamente
- Necesitas hacer un nuevo deployment

**Si muestra la URL:**
- Las variables están correctas ✅

### Verificación 2: Revisar Network Tab

1. **F12** → Pestaña **Network**
2. Haz clic en "Iniciar Sesión"
3. **Busca requests a Supabase:**
   - Deberías ver requests a `*.supabase.co`
   - Si NO ves ninguna, las variables no están configuradas

### Verificación 3: Revisar Storage en el Navegador

1. **F12** → Pestaña **Application** (Chrome) o **Storage** (Firefox)
2. **Local Storage** → https://gestiogar.pages.dev
3. Busca claves que empiecen con `sb-`
4. Si NO hay nada, Supabase no se está inicializando

## 🔄 Problema con Middleware

**Importante:** Con `output: 'export'`, el middleware de Next.js **NO se ejecuta** en producción.

Esto significa:
- ❌ No hay redirección automática server-side
- ✅ La autenticación se maneja 100% client-side
- ✅ El AuthContext en React se encarga de todo

Esto es **normal y esperado** con sitios estáticos.

## 📝 Variables de Entorno Necesarias

Solo necesitas estas 2 variables:

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anónima | Supabase Dashboard → Settings → API → anon public |

**NOTA:** El prefijo `NEXT_PUBLIC_` es crucial porque permite que estas variables estén disponibles en el navegador.

## ✅ Checklist de Verificación

- [ ] Variables agregadas en Cloudflare Pages
- [ ] Environment = "Production"
- [ ] Deployment reejecutado después de agregar variables
- [ ] Deployment Status = "Success"
- [ ] Sitio refrescado con Ctrl+F5
- [ ] Console.log muestra las variables correctamente
- [ ] Network tab muestra requests a Supabase

## 🎯 Resultado Esperado

Después de configurar las variables:

1. ✅ Página de inicio carga
2. ✅ Clic en "Iniciar Sesión" → Redirige a `/auth/login`
3. ✅ Formulario de login visible
4. ✅ Puedes iniciar sesión con: `demo@demo.com` / `demodemo`
5. ✅ Redirige al dashboard después del login

---

## 🆘 Ayuda Adicional

Si después de configurar las variables sigue sin funcionar:

1. **Comparte:**
   - Captura de pantalla de tus Environment variables (oculta el valor completo de la key)
   - Console output cuando haces clic en "Iniciar Sesión"
   - Network tab mostrando las requests

2. **Verifica en local:**
   ```bash
   # Asegúrate de que funciona localmente
   npm run dev
   # Abre http://localhost:3000
   # Prueba el login
   ```

Si funciona en local pero no en Cloudflare, definitivamente es un problema con las variables de entorno.

