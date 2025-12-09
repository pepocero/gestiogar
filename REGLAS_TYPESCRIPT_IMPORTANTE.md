# 🚨 REGLAS TYPESCRIPT CRÍTICAS - Gestiogar

## ⚠️ **IMPORTANTE: Leer ANTES de agregar código**

Estas reglas previenen errores de compilación en Vercel/producción que bloquean el deploy.

---

## 1️⃣ **Componentes Badge - Variants Válidos**

### ✅ **CORRECTO**
```typescript
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="info">Información</Badge>
<Badge variant="gray">Inactivo</Badge>
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
<Badge variant="primary">❌ NO EXISTE</Badge>
<Badge variant="secondary">❌ NO EXISTE</Badge>
<Badge color="blue">❌ Usar 'variant', no 'color'</Badge>
```

### 📋 **Variants Válidos para Badge**
```typescript
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray'
```

---

## 2️⃣ **Componentes Button - Variants Válidos**

### ✅ **CORRECTO**
```typescript
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger">Eliminar</Button>
<Button variant="success">Confirmar</Button>
<Button variant="outline">Ver más</Button>
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
<Button variant="gray">❌ NO EXISTE - usar 'outline'</Button>
<Button variant="info">❌ NO EXISTE</Button>
```

### 📋 **Variants Válidos para Button**
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
```

---

## 3️⃣ **Acceso a Objetos Dinámicos**

### ✅ **CORRECTO**
```typescript
// Opción 1: Index signature
const getTipoColor = (tipo: string) => {
  const colors: { [key: string]: string } = {
    festivo: 'success',
    vacaciones: 'info'
  }
  return colors[tipo] || 'gray'
}

// Opción 2: Type assertion
const config = statusMap[status as keyof typeof statusMap] || defaultValue
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
const getTipoColor = (tipo: string) => {
  const colors = {
    festivo: 'success',
    vacaciones: 'info'
  }
  return colors[tipo] || 'gray'  // ❌ Error: no index signature
}
```

---

## 4️⃣ **Tipos en Callbacks (map, reduce, filter)**

### ✅ **CORRECTO**
```typescript
// .map()
data.map((item: any) => ({
  id: item.id,
  name: item.name
}))

// .reduce()
data.reduce((sum: number, item: any) => sum + item.value, 0)

// .filter()
data.filter((item: any) => item.active)
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
data.map(item => ({ ... }))  // ❌ Parámetro implícito
data.reduce((sum, item) => ...)  // ❌ Parámetros implícitos
```

---

## 5️⃣ **Imports Obligatorios**

### ✅ **CORRECTO**
```typescript
// SIEMPRE importar lo que se usa
import toast from 'react-hot-toast'  // Para toast.success(), toast.error()
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
// Usar toast sin importarlo
toast.success('...')  // ❌ Error: Cannot find name 'toast'
```

---

## 6️⃣ **Props de Componentes**

### ✅ **CORRECTO - ImageEditor**
```typescript
<ImageEditor
  isOpen={showImageEditor}
  imageFile={selectedFile}
  onSave={(blob: Blob) => {
    const file = new File([blob], 'image.png', { type: 'image/png' })
    setFile(file)
  }}
  onClose={() => setShowImageEditor(false)}
/>
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
<ImageEditor
  file={selectedFile}  // ❌ Debe ser 'imageFile'
  onSave={(blob) => {
    setFile(blob)  // ❌ Blob != File
  }}
/>
```

---

## 7️⃣ **Interfaces Completas**

### ✅ **CORRECTO**
```typescript
interface UserProfile {
  id: string
  email?: string
  role?: string  // ✅ Incluir si usas profile.role
}

interface Company {
  id: string
  name: string
  website?: string  // ✅ Incluir si usas company.website
  tax_id?: string   // ✅ Incluir si usas company.tax_id
}
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
interface UserProfile {
  id: string
  email?: string
  // ❌ Falta 'role' pero el código usa profile.role
}

// Uso en el código:
<p>{profile.role}</p>  // ❌ Error: Property 'role' does not exist
```

---

## 8️⃣ **Archivos Temporales y Backup**

### ✅ **CORRECTO**
```bash
# Guardar archivos temporales en carpeta _backup/
_backup/
  AuthContext-backup.tsx
  Component-test.tsx
  page-old.tsx
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```bash
# NO crear archivos con estos sufijos en carpetas de código:
contexts/
  AuthContext-backup.tsx  ❌
  AuthContext-simple.tsx  ❌
  AuthContext-debug.tsx   ❌
  AuthContext-working.tsx ❌

app/
  temp-page.tsx  ❌
  page-test.tsx  ❌
```

### 📝 **tsconfig.json ya excluye**:
- `**/*-backup.*`
- `**/*-simple.*`
- `**/*-debug.*`
- `**/*-working.*`
- `**/*-test.*`
- `**/temp-*`
- `_backup/**/*`

---

## 9️⃣ **Conversión Blob a File**

### ✅ **CORRECTO**
```typescript
// Cuando ImageEditor retorna un Blob pero necesitas un File:
onSave={(blob: Blob) => {
  const file = new File([blob], 'filename.png', { type: 'image/png' })
  setFile(file)
}}
```

### ❌ **INCORRECTO - NO COMPILARÁ**
```typescript
onSave={(blob: Blob) => {
  setFile(blob)  // ❌ Type 'Blob' is not assignable to type 'File'
}}
```

---

## 🔟 **Validación Antes de Deploy**

### ✅ **SIEMPRE ejecutar ANTES de push:**

```bash
# 1. Limpiar build anterior
npm run cleanup:win

# 2. Build local
npm run build

# 3. Verificar que compile sin errores
# Debe mostrar: ✓ Compiled successfully

# 4. Si compila OK, hacer push
git add -A
git commit -m "mensaje"
git push origin main
```

### ❌ **NUNCA hacer push sin verificar:**
```bash
# ❌ NO HACER:
git add -A
git commit -m "cambios"
git push  # Sin verificar que compile
```

---

## 📊 **Checklist Pre-Deploy**

Antes de cada push, verificar:

- [ ] ✅ Build local exitoso (`npm run build`)
- [ ] ✅ Sin errores de TypeScript
- [ ] ✅ Sin archivos `*-backup`, `*-test`, `temp-*` en carpetas de código
- [ ] ✅ Todos los Badge usan variants válidos
- [ ] ✅ Todos los Button usan variants válidos
- [ ] ✅ Callbacks tienen tipos explícitos
- [ ] ✅ Imports completos (especialmente `toast`)
- [ ] ✅ Props de componentes correctos

---

## 🚀 **Comandos Útiles**

```bash
# Build local (detecta TODOS los errores)
npm run build

# Linting
npm run lint

# Solo verificar tipos (sin compilar)
npx tsc --noEmit

# Limpiar y rebuild
npm run cleanup:win
npm run build

# Ver archivos modificados
git status --short

# Ver último commit
git log --oneline -1
```

---

## 📖 **Referencia Rápida**

### Componentes UI - Variants

| Componente | Variants Válidos | NO Usar |
|------------|------------------|---------|
| **Badge**  | `success`, `warning`, `danger`, `info`, `gray` | `primary`, `secondary` |
| **Button** | `primary`, `secondary`, `danger`, `success`, `outline` | `gray`, `info` |

### TypeScript - Patrones

| Situación | Correcto | Incorrecto |
|-----------|----------|------------|
| Map callback | `.map((item: any) => ...)` | `.map(item => ...)` |
| Reduce callback | `.reduce((sum: number, item: any) => ...)` | `.reduce((sum, item) => ...)` |
| Object map | `const map: { [key: string]: string } = {...}` | `const map = {...}` |
| Type assertion | `map[key as keyof typeof map]` | `map[key]` |

---

## ⚡ **En Caso de Error en Vercel**

1. **Copiar el mensaje de error completo** de Vercel
2. **Buscar el archivo y línea** mencionados en el error
3. **Aplicar la regla correspondiente** de este documento
4. **Ejecutar `npm run build`** localmente para verificar
5. **Push solo si compila OK**

---

**Fecha**: 6 de octubre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ **CRÍTICO - SEGUIR SIEMPRE**  
**Autor**: Equipo Gestiogar

---

## 💡 **Recuerda**

> **"Si no compila localmente, NO compilará en Vercel"**
> 
> **SIEMPRE ejecuta `npm run build` ANTES de hacer push**


