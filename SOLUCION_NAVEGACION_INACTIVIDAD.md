# 🔄 Solución: Navegación Bloqueada Después de Inactividad

## Problema Identificado

Después de **2-3 minutos de inactividad**, al hacer clic en cualquier ítem del menú:
- ❌ La página se queda en "Cargando..."
- ❌ No carga nada hasta refrescar manualmente
- ❌ El estado de Supabase/sesión queda "trabado"

## Causa Raíz

1. **Sesión de Supabase expira** o entra en estado inconsistente
2. **Estados de React** se acumulan sin limpiar
3. **Next.js router** intenta navegación SPA pero falla
4. **No hay detección** de cuánto tiempo ha pasado sin actividad

## Solución Implementada

### 1. **Hook de Refresco Inteligente**

Creado `hooks/usePageRefresh.ts` que:
- ✅ Detecta tiempo de inactividad del usuario
- ✅ Fuerza hard refresh si ha pasado mucho tiempo
- ✅ Permite navegación normal si está activo
- ✅ Maneja visibilidad de la página (cambio de pestaña)

```typescript
export function usePageRefresh(options: UsePageRefreshOptions = {}) {
  const {
    inactivityTimeout = 300000, // 5 minutos
    loadingTimeout = 10000, // 10 segundos
    enabled = true
  } = options

  // Detecta actividad del usuario (mouse, teclado, scroll, touch)
  // Verifica inactividad cada minuto
  // Refresca automáticamente si supera el tiempo límite
}
```

### 2. **Detección de Actividad**

El hook escucha estos eventos:
- `mousedown` - Clicks del mouse
- `keydown` - Teclas presionadas
- `scroll` - Scroll en la página
- `touchstart` - Toques en pantalla táctil
- `click` - Clicks generales

### 3. **Navegación Inteligente en Sidebar**

Modificado `components/layout/Sidebar.tsx`:

```typescript
const { timeSinceLastActivity } = usePageRefresh({
  inactivityTimeout: 180000, // 3 minutos
  enabled: true
})

const handleNavClick = (e: React.MouseEvent, href: string) => {
  const inactiveTime = timeSinceLastActivity()
  
  // Si ha estado inactivo más de 2 minutos, hacer hard refresh
  if (inactiveTime > 120000) {
    e.preventDefault()
    console.log('🔄 Navegación después de inactividad, haciendo hard refresh...')
    window.location.href = href  // Hard refresh
  }
  // Si no, navegación normal de Next.js
}
```

### 4. **Aplicado a Todos los Links del Menú**

- ✅ Navegación principal (Dashboard, Trabajos, etc.)
- ✅ Módulos instalados
- ✅ Configuración y otras secciones

## Configuración

### ⚙️ **Tiempos Configurables**:

```typescript
// En usePageRefresh hook:
{
  inactivityTimeout: 180000,  // 3 minutos (detectar inactividad)
  loadingTimeout: 10000,      // 10 segundos (timeout de carga)
  enabled: true               // Habilitar/deshabilitar
}

// En handleNavClick:
if (inactiveTime > 120000) {  // 2 minutos (hard refresh)
  window.location.href = href
}
```

### 📊 **Flujo de Navegación**:

```
Usuario hace click en menú
    ↓
¿Tiempo inactivo > 2 minutos?
    ├─ SÍ → Hard Refresh (window.location.href)
    │        ✅ Refresca sesión
    │        ✅ Limpia estados
    │        ✅ Carga garantizada
    └─ NO → Navegación normal Next.js
             ✅ Rápida (SPA)
             ✅ Sin refresco
             ✅ Preserva estado
```

## Beneficios

### ✅ **Experiencia de Usuario**
- Navegación siempre funcional
- No más "Cargando..." infinito
- No requiere refresco manual

### ✅ **Rendimiento**
- Navegación rápida cuando está activo (SPA)
- Hard refresh solo cuando es necesario
- Limpieza automática de estados

### ✅ **Confiabilidad**
- Sesión siempre válida
- Estados siempre frescos
- Sin bloqueos

## Comportamiento Esperado

### 🟢 **Usuario Activo** (< 2 minutos):
```
Click en menú → Navegación SPA rápida → Carga instantánea
```

### 🟡 **Usuario Inactivo** (> 2 minutos):
```
Click en menú → Hard Refresh → Carga completa → Todo fresco
```

### 🔄 **Cambio de Pestaña**:
```
Usuario regresa después de 5 minutos → Página se refresca automáticamente
```

## Archivos Modificados

1. ✅ `hooks/usePageRefresh.ts` - Hook nuevo de detección de inactividad
2. ✅ `components/layout/Sidebar.tsx` - Integración del hook en navegación

## Uso del Hook en Otros Componentes

```typescript
import { usePageRefresh } from '@/hooks/usePageRefresh'

function MyComponent() {
  const { 
    navigateWithRefresh,  // Función de navegación inteligente
    updateActivity,       // Actualizar manualmente actividad
    timeSinceLastActivity // Obtener tiempo desde última actividad
  } = usePageRefresh({
    inactivityTimeout: 180000, // 3 minutos
    enabled: true
  })

  // Usar en navegación:
  const handleClick = (e, path) => {
    const inactive = timeSinceLastActivity()
    if (inactive > 120000) {
      e.preventDefault()
      window.location.href = path  // Hard refresh
    }
  }
}
```

## Debugging

### 🔍 **En Consola del Navegador**:

```javascript
// Ver tiempo desde última actividad:
window.__lastActivity = Date.now()  // Se actualiza automáticamente

// Forzar refresh por inactividad:
// (esperar 2 minutos y hacer click en menú)
// Verás: 🔄 Navegación después de inactividad, haciendo hard refresh...
```

## Alternativa: Siempre Hard Refresh

Si prefieres que **SIEMPRE** haga hard refresh (más lento pero más confiable):

```typescript
// En Sidebar.tsx, simplificar handleNavClick:
const handleNavClick = (e: React.MouseEvent, href: string) => {
  e.preventDefault()
  window.location.href = href  // Siempre hard refresh
}
```

**Pros**:
- ✅ Siempre fresco
- ✅ Nunca se queda cargando

**Contras**:
- ❌ Más lento (recarga completa cada vez)
- ❌ Pierde estado de la aplicación

## Recomendación

**Mantener la solución actual** (refresh solo después de inactividad):
- Mejor experiencia de usuario
- Rendimiento óptimo
- Confiable y robusto

---

**Fecha**: 6 de octubre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado  
**Autor**: Equipo Gestiogar

