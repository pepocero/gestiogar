# 🚀 GUÍA COMPLETA DEL SISTEMA DE MÓDULOS GESTIOGAR

## 📋 ÍNDICE
1. [Introducción al Sistema](#introducción-al-sistema)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Tipos de Módulos](#tipos-de-módulos)
4. [Estructura de un Módulo](#estructura-de-un-módulo)
5. [Sistema de Hooks](#sistema-de-hooks)
6. [Tienda de Módulos](#tienda-de-módulos)
7. [Creación de Nuevos Módulos](#creación-de-nuevos-módulos)
8. [Ejemplos Completos](#ejemplos-completos)
9. [Reglas y Convenciones](#reglas-y-convenciones)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 INTRODUCCIÓN AL SISTEMA

El sistema de módulos de Gestiogar es una plataforma multitenant que permite a cada empresa instalar y gestionar módulos adicionales de manera independiente. Cada módulo instalado es **completamente aislado por empresa** (multitenant).

### Características Principales:
- ✅ **Multitenant**: Cada empresa solo ve sus propios módulos y datos
- ✅ **Instalación Simple**: Un clic desde la tienda de módulos
- ✅ **Sistema de Hooks**: Integración automática con sidebar, dashboard, etc.
- ✅ **Base de Datos Segura**: RLS (Row Level Security) por empresa
- ✅ **Extensible**: Fácil creación de nuevos módulos
- ✅ **Tienda Integrada**: Marketplace de módulos disponible

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Tablas Principales del Sistema

#### Tabla: `modules`
```sql
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name CHARACTER VARYING(255) NOT NULL,
  slug CHARACTER VARYING(255) NOT NULL,
  version CHARACTER VARYING(50) NOT NULL DEFAULT '1.0.0',
  description TEXT NULL,
  icon CHARACTER VARYING(100) NULL DEFAULT 'Package',
  is_active BOOLEAN NULL DEFAULT true,
  config JSONB NULL DEFAULT '{}',
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_company_id_slug_key UNIQUE (company_id, slug),
  CONSTRAINT modules_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id)
);
```

**Campos importantes:**
- `company_id`: ID de la empresa (multitenant)
- `slug`: Identificador único del módulo (ej: "holidays-vacations")
- `config`: Configuración JSON completa del módulo
- `is_active`: Estado de activación del módulo

#### Tabla: `module_data`
```sql
CREATE TABLE public.module_data (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  module_id UUID NOT NULL,
  data JSONB NULL DEFAULT '{}',
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  
  CONSTRAINT module_data_pkey PRIMARY KEY (id),
  CONSTRAINT module_data_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT module_data_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT module_data_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
);
```

**Uso:**
- Almacena datos específicos de cada módulo
- Cada registro está asociado a un módulo específico
- Datos en formato JSONB para flexibilidad

### Índices y Triggers
```sql
-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules USING btree (company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data USING btree (company_id, module_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_data_updated_at BEFORE UPDATE ON module_data FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Seguridad (RLS)
Todas las tablas tienen **Row Level Security** habilitado:
- Cada empresa solo puede ver sus propios módulos
- Los datos están completamente aislados por `company_id`
- Las operaciones están restringidas automáticamente

---

## 🔧 TIPOS DE MÓDULOS

### 1. Módulos Básicos (JSON)
- **Estructura**: Solo archivo JSON con manifest
- **Funcionalidad**: Formularios dinámicos simples
- **Base de datos**: Usa solo `modules` y `module_data`
- **Instalación**: Desde archivo JSON

### 2. Módulos Avanzados (Archivos + Hooks)
- **Estructura**: Directorio completo con archivos TypeScript
- **Funcionalidad**: Lógica compleja, servicios, componentes React
- **Base de datos**: Puede crear sus propias tablas específicas
- **Instalación**: Desde la tienda o archivo JSON

### 3. Módulos Híbridos
- **Combinan**: Estructura JSON + funcionalidad avanzada
- **Ventajas**: Fácil instalación + capacidades extendidas
- **Ejemplo**: Módulo de Días Festivos y Vacaciones

---

## 📦 ESTRUCTURA DE UN MÓDULO

### Manifest.json (Configuración Base)
```json
{
  "name": "Nombre del Módulo",
  "slug": "slug-del-modulo",
  "version": "1.0.0",
  "description": "Descripción breve del módulo",
  "author": "Nombre del Autor",
  "icon": "Calendar",
  "category": "recursos-humanos",
  "dependencies": ["users", "companies"],
  "permissions": [
    "read_entity",
    "write_entity", 
    "delete_entity"
  ],
  "routes": [
    {
      "path": "/ruta",
      "component": "ComponenteReact",
      "title": "Título de la Página"
    }
  ],
  "hooks": [
    "sidebar_menu",
    "dashboard_widgets", 
    "after_create_entity"
  ],
  "database": {
    "create_tables": true,
    "tables": [
      "tabla1",
      "tabla2"
    ]
  },
  "fields": [
    {
      "name": "campo1",
      "label": "Etiqueta del Campo",
      "type": "text",
      "required": true,
      "validation": "required|min:2|max:50"
    }
  ],
  "displayName": "Nombre para Mostrar",
  "displayDescription": "Descripción para mostrar al usuario"
}
```

### Campos Requeridos en el Manifest
- **`name`**: Nombre único del módulo
- **`slug`**: Identificador único (snake-case)
- **`version`**: Versión semántica
- **`description`**: Descripción breve
- **`fields`**: Array de campos del formulario
- **`displayName`**: Título para mostrar en la interfaz

### Tipos de Campos Soportados
```json
{
  "name": "texto_simple",
  "type": "text",
  "required": true
}

{
  "name": "email",
  "type": "email",
  "required": true
}

{
  "name": "numero",
  "type": "number",
  "required": true
}

{
  "name": "fecha",
  "type": "date",
  "required": true
}

{
  "name": "seleccion",
  "type": "select",
  "required": true,
  "options": [
    {"value": "opcion1", "label": "Opción 1"},
    {"value": "opcion2", "label": "Opción 2"}
  ]
}

{
  "name": "booleano",
  "type": "boolean",
  "required": false
}

{
  "name": "descripcion",
  "type": "textarea",
  "required": false
}
```

### Iconos Disponibles
Puedes usar cualquier icono de [Lucide React](https://lucide.dev/icons):
- `Calendar` - Calendario/citas
- `Users` - Usuarios/personas
- `FileText` - Documentos
- `DollarSign` - Finanzas
- `Wrench` - Herramientas/trabajos
- `Building` - Empresas/lugares
- `Package` - Módulo genérico
- `Truck` - Vehículos
- `Receipt` - Facturas/gastos

---

## 🔌 SISTEMA DE HOOKS

### Hooks Disponibles
```typescript
// Sidebar y navegación
'sidebar_menu' → Agrega elementos al menú lateral
'header_actions' → Agrega botones al header

// Dashboard
'dashboard_widgets' → Agrega widgets automáticos

// Eventos de datos
'after_create' → Después de crear registro
'before_save' → Antes de guardar
'after_update' → Después de actualizar
'before_delete' → Antes de eliminar

// Formularios
'form_fields' → Modifica campos del formulario
'form_validation' → Validación personalizada

// Tablas
'table_actions' → Acciones adicionales en tablas
'table_columns' → Columnas adicionales
```

### Implementación de Hooks
```typescript
// En el manifest del módulo
"hooks": ["sidebar_menu", "dashboard_widgets"]

// En el código del módulo
middleware: {
  'sidebar_menu': () => ({
    title: 'Mi Módulo',
    icon: 'Package',
    href: '/mi-modulo',
    badge: 'count_data'
  }),
  
  'dashboard_widgets': () => ({
    component: 'MiWidget',
    priority: 2,
    props: {
      title: 'Estadísticas de Mi Módulo'
    }
  })
}
```

---

## 🛒 TIENDA DE MÓDULOS

### Funcionalidades
- **Catálogo de módulos**: Lista de módulos disponibles
- **Instalación con un clic**: Instalación automática
- **Información detallada**: Descripción, características, ratings
- **Detección de instalados**: Evita instalaciones duplicadas
- **Categorización**: Por tipo de funcionalidad

### Ubicación
- **Ruta**: `Configuración > Módulos > Tienda de Módulos`
- **Pestañas**: "Módulos Instalados" y "Tienda de Módulos"
- **Filtros**: Por categoría y estado

### Módulos Disponibles
1. **🎉 Días Festivos y Vacaciones** - Gestión de días festivos y solicitudes de vacaciones
2. **🚚 Gestión de Vehículos** - Control de flota de vehículos de servicio
3. **💰 Control de Gastos** - Gestión de gastos operativos

---

## 🏗️ CREACIÓN DE NUEVOS MÓDULOS

### Paso 1: Diseño del Módulo
1. **Define la funcionalidad** que necesitas
2. **Identifica las entidades** (tablas de datos)
3. **Diseña los campos** del formulario
4. **Planifica las rutas** y componentes
5. **Determina los hooks** necesarios

### Paso 2: Crear el Manifest
```json
{
  "name": "Mi Nuevo Módulo",
  "slug": "mi-nuevo-modulo",
  "version": "1.0.0",
  "description": "Descripción de mi módulo",
  "author": "Tu Nombre",
  "icon": "Package",
  "category": "categoria",
  "fields": [
    {
      "name": "campo1",
      "label": "Campo 1",
      "type": "text",
      "required": true
    }
  ],
  "displayName": "Mi Nuevo Módulo",
  "displayDescription": "Descripción para el usuario"
}
```

### Paso 3: Módulo Básico (Solo JSON)
1. **Crea el archivo JSON** con el manifest
2. **Guárdalo** como `mi-modulo.json`
3. **Instálalo** desde Configuración > Módulos > Instalar Módulo
4. **El módulo aparecerá** automáticamente en el sidebar

### Paso 4: Módulo Avanzado (Con Archivos)
1. **Crea la estructura de directorios**:
```
app/modules/mi-modulo/
├── manifest.json
├── src/
│   ├── index.ts
│   ├── types/
│   ├── services/
│   ├── hooks/
│   └── components/
```

2. **Implementa los servicios**:
```typescript
// src/services/miServicio.ts
import { supabase } from '@/lib/supabase'

export class MiServicio {
  static async getAll() {
    const { data, error } = await supabase
      .from('module_data')
      .select('*')
      .eq('module_id', 'mi-modulo-id')
    
    if (error) throw error
    return data || []
  }
}
```

3. **Crea los hooks personalizados**:
```typescript
// src/hooks/useMiModulo.ts
import { useState, useEffect } from 'react'
import { MiServicio } from '../services/miServicio'

export function useMiModulo() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  const refreshData = async () => {
    try {
      setLoading(true)
      const result = await MiServicio.getAll()
      setData(result)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshData()
  }, [])
  
  return { data, loading, refreshData }
}
```

4. **Implementa los componentes React**:
```typescript
// src/components/MiLista.tsx
import { Card, Button, Table } from '@/components/ui'
import { useMiModulo } from '../hooks/useMiModulo'

export function MiLista() {
  const { data, loading } = useMiModulo()
  
  return (
    <Card>
      <div className="p-6">
        <h1>Mi Módulo</h1>
        <Table>
          {/* Tabla con datos */}
        </Table>
      </div>
    </Card>
  )
}
```

### Paso 5: Módulo con Tablas Específicas
Si tu módulo necesita tablas específicas:

1. **Crea el archivo SQL**:
```sql
-- database/create_mi_modulo_tables.sql
CREATE TABLE IF NOT EXISTS mi_tabla (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    campo1 VARCHAR(100) NOT NULL,
    campo2 TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE mi_tabla ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view mi_tabla from their company" ON mi_tabla
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );
```

2. **Actualiza el manifest**:
```json
{
  "database": {
    "create_tables": true,
    "tables": ["mi_tabla"]
  }
}
```

3. **Ejecuta el SQL** en Supabase Dashboard

### Paso 6: Agregar a la Tienda
Para que tu módulo aparezca en la tienda:

1. **Agrega el módulo** al array `AVAILABLE_MODULES` en `app/settings/modules/page.tsx`
2. **Incluye toda la información**: nombre, descripción, características, manifest
3. **El módulo estará disponible** para instalación desde la tienda

---

## 📋 EJEMPLOS COMPLETOS

### Ejemplo 1: Módulo Básico - Gestión de Productos
```json
{
  "name": "Gestión de Productos",
  "slug": "gestion-productos",
  "version": "1.0.0",
  "description": "Gestiona el catálogo de productos y servicios",
  "author": "Gestiogar Team",
  "icon": "Gift",
  "category": "inventario",
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre del Producto",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripción",
      "type": "textarea",
      "required": false
    },
    {
      "name": "precio",
      "label": "Precio",
      "type": "number",
      "required": true
    },
    {
      "name": "categoria",
      "label": "Categoría",
      "type": "select",
      "required": true,
      "options": [
        {"value": "herramientas", "label": "Herramientas"},
        {"value": "materiales", "label": "Materiales"},
        {"value": "servicios", "label": "Servicios"}
      ]
    },
    {
      "name": "activo",
      "label": "Producto Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "displayName": "Productos",
  "displayDescription": "Administra tu catálogo de productos y servicios"
}
```

### Ejemplo 2: Módulo Avanzado - Sistema de Tickets
```typescript
// manifest.json
{
  "name": "Sistema de Tickets",
  "slug": "sistema-tickets",
  "version": "1.0.0",
  "description": "Gestión de tickets de soporte y incidencias",
  "author": "Gestiogar Team",
  "icon": "Ticket",
  "category": "soporte",
  "hooks": ["sidebar_menu", "dashboard_widgets"],
  "database": {
    "create_tables": true,
    "tables": ["tickets", "ticket_comments"]
  },
  "fields": [
    {
      "name": "titulo",
      "label": "Título del Ticket",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripción",
      "type": "textarea",
      "required": true
    },
    {
      "name": "prioridad",
      "label": "Prioridad",
      "type": "select",
      "required": true,
      "options": [
        {"value": "baja", "label": "Baja"},
        {"value": "media", "label": "Media"},
        {"value": "alta", "label": "Alta"},
        {"value": "critica", "label": "Crítica"}
      ]
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "select",
      "required": true,
      "options": [
        {"value": "abierto", "label": "Abierto"},
        {"value": "en_progreso", "label": "En Progreso"},
        {"value": "cerrado", "label": "Cerrado"}
      ]
    }
  ],
  "displayName": "Tickets",
  "displayDescription": "Gestiona tickets de soporte y incidencias"
}

// src/services/ticketsService.ts
import { supabase } from '@/lib/supabase'

export class TicketsService {
  static async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  static async create(ticket: any) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  static async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
```

---

## 📏 REGLAS Y CONVENCIONES

### Estructura de Nombres
- **Slug**: snake-case ASCII (`mi-modulo-ejemplo`)
- **Componentes**: PascalCase (`MiLista`, `MiFormulario`)
- **Servicios**: PascalCase + Service (`MiServicio`)
- **Hooks**: camelCase con `use` prefix (`useMiModulo`)
- **Archivos**: PascalCase para componentes, camelCase para otros

### Rutas
- Siempre bajo `/module/{slug}/` para módulos avanzados
- Usar estructura jerárquica lógica
- Ejemplos:
  - `/module/mi-modulo/`
  - `/module/mi-modulo/nuevo`
  - `/module/mi-modulo/editar/{id}`

### Permisos
- Seguir convención: `{action}_{entity}`
- Ejemplos: `read_tickets`, `write_tickets`, `delete_tickets`

### Base de Datos
- **Tablas en plural lowercase**: `tickets`, `ticket_comments`
- **Siempre incluir campos**: `id`, `created_at`, `updated_at`, `company_id`
- **Usar índices** para campos de búsqueda frecuente
- **RLS obligatorio** para todas las tablas

### Validación
- **Definir reglas** en el manifest
- **Usar sintaxis** estilo Laravel: `required|min:2|max:50`
- **Validar** en frontend y backend

### Versionado
- **Versión semántica**: `1.0.0`, `1.1.0`, `2.0.0`
- **MAJOR**: Cambios incompatibles (ej: `1.0.0` → `2.0.0`)
- **MINOR**: Nuevas funcionalidades compatibles (ej: `1.0.0` → `1.1.0`)
- **PATCH**: Corrección de bugs (ej: `1.0.0` → `1.0.1`)

#### Sistema de Actualización Automática
- **Archivo de configuración**: `lib/module-updates.ts`
- **Actualización automática**: Botón "🔄 Actualizar Módulo" en cada módulo
- **Comparación inteligente**: Solo actualiza si hay cambios reales
- **Changelog**: Registro de cambios por versión

#### Proceso de Actualización de Módulos
1. **Modificar el módulo** en el código
2. **Actualizar la versión** en `lib/module-updates.ts`
3. **Agregar changelog** con los cambios realizados
4. **Los usuarios** pueden actualizar desde la interfaz

---

## 🔄 SISTEMA DE ACTUALIZACIÓN DE MÓDULOS

### Arquitectura del Sistema

#### Archivo de Configuración Centralizada
```typescript
// lib/module-updates.ts
export interface ModuleUpdate {
  slug: string
  version: string
  config: any
  changelog?: string[]
}

export const MODULE_UPDATES: ModuleUpdate[] = [
  {
    slug: 'holidays-vacations',
    version: '1.1.0',
    config: { /* configuración actualizada */ },
    changelog: [
      'v1.1.0 - Agregado campo dinámico de técnicos',
      'v1.1.0 - Agregado tipo "Vacaciones"',
      'v1.1.0 - Mejorada la interfaz de usuario'
    ]
  }
]
```

#### Funciones de Comparación
```typescript
// Comparación de versiones semánticas
const compareVersions = (version1: string, version2: string): number => {
  // Compara versiones como 1.0.0 vs 1.1.0
  // Retorna: 1 (v1 > v2), -1 (v1 < v2), 0 (iguales)
}

// Incremento automático de versión
const incrementVersion = (currentVersion: string, type: 'patch' | 'minor' | 'major'): string => {
  // Incrementa automáticamente la versión según el tipo de cambio
}
```

### Proceso de Actualización

#### Para Desarrolladores:
1. **Modificar el módulo** en el código fuente
2. **Actualizar `lib/module-updates.ts`**:
   - Incrementar la versión
   - Actualizar la configuración
   - Agregar changelog
3. **Commit y deploy** del código actualizado

#### Para Usuarios:
1. **Acceder al módulo** desde el sidebar
2. **Hacer clic** en "🔄 Actualizar Módulo"
3. **Sistema verifica** si hay actualizaciones disponibles
4. **Si hay cambios**: Actualiza automáticamente
5. **Si no hay cambios**: Muestra mensaje informativo

### Tipos de Cambios y Versionado

#### PATCH (1.0.0 → 1.0.1)
- Corrección de bugs
- Mejoras menores de UI
- Optimizaciones de rendimiento
- Cambios en textos o etiquetas

#### MINOR (1.0.0 → 1.1.0)
- Nuevas funcionalidades
- Nuevos campos en formularios
- Nuevas opciones en selects
- Mejoras significativas de UI

#### MAJOR (1.0.0 → 2.0.0)
- Cambios incompatibles
- Eliminación de campos
- Cambios en estructura de datos
- Refactoring completo

### Ejemplo Práctico

#### Antes de la Actualización:
```typescript
// Módulo instalado con versión 1.0.0
{
  version: '1.0.0',
  config: {
    fields: [
      { name: 'tipo', type: 'select', options: ['festivo', 'local'] }
    ]
  }
}
```

#### Después de la Actualización:
```typescript
// Módulo actualizado a versión 1.1.0
{
  version: '1.1.0',
  config: {
    fields: [
      { name: 'tecnico', type: 'select', dynamic: true, source: 'technicians' },
      { name: 'tipo', type: 'select', options: ['festivo', 'local', 'vacaciones'] },
      { name: 'fecha_fin', type: 'date', required: false }
    ]
  }
}
```

### Beneficios del Sistema

#### Para Desarrolladores:
- ✅ **Control de versiones** centralizado
- ✅ **Changelog automático** para cada actualización
- ✅ **Comparación inteligente** de configuraciones
- ✅ **Deploy simplificado** sin intervención manual

#### Para Usuarios:
- ✅ **Actualizaciones automáticas** con un clic
- ✅ **Feedback claro** sobre el estado de actualización
- ✅ **No interrupciones** innecesarias
- ✅ **Historial de cambios** visible en consola

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### Error: "Manifest inválido: faltan campos requeridos"
**Solución**: Verificar que el manifest incluya todos los campos requeridos:
- `name`, `slug`, `version`, `description`, `fields`, `displayName`

#### Error: "Could not find the table"
**Solución**: 
1. Verificar que las tablas `modules` y `module_data` existan
2. Ejecutar el SQL de creación de tablas en Supabase

#### Módulo no aparece en el sidebar
**Solución**:
1. Verificar que `is_active` sea `true`
2. Comprobar que el hook `sidebar_menu` esté implementado
3. Refrescar la página

#### Datos no se guardan
**Solución**:
1. Verificar políticas RLS en Supabase
2. Comprobar que `company_id` se esté enviando correctamente
3. Revisar logs de la consola del navegador

#### Error de permisos
**Solución**:
1. Verificar que el usuario tenga permisos de administrador
2. Comprobar que `company_id` coincida con el usuario
3. Revisar políticas de RLS

### Debugging
1. **Consola del navegador**: Revisar errores JavaScript
2. **Network tab**: Verificar requests a la API
3. **Supabase Dashboard**: Revisar logs de la base de datos
4. **RLS policies**: Verificar políticas de seguridad

### Logs Útiles
```javascript
// En el código del módulo
console.log('🔄 Loading module data:', data)
console.log('✅ Module operation successful:', result)
console.log('❌ Module error:', error)
```

---

## 🎯 MEJORES PRÁCTICAS

### Desarrollo
1. **Empezar simple**: Crear módulo básico primero, luego agregar complejidad
2. **Testing**: Probar en entorno de desarrollo antes de producción
3. **Documentación**: Documentar todas las funcionalidades
4. **Versionado**: Usar versionado semántico consistente

### Seguridad
1. **RLS obligatorio**: Todas las tablas deben tener RLS
2. **Validación**: Validar datos en frontend y backend
3. **Permisos**: Implementar sistema de permisos granular
4. **Auditoría**: Mantener logs de operaciones importantes

### Performance
1. **Índices**: Crear índices para campos de búsqueda frecuente
2. **Paginación**: Implementar paginación para listas grandes
3. **Lazy loading**: Cargar datos bajo demanda
4. **Caching**: Implementar caché para datos frecuentes

### UX/UI
1. **Consistencia**: Seguir patrones de diseño existentes
2. **Responsive**: Asegurar compatibilidad móvil
3. **Loading states**: Mostrar estados de carga
4. **Error handling**: Manejar errores de manera elegante

---

## 📞 SOPORTE Y RECURSOS

### Documentación
- **Esta guía**: Documentación completa del sistema
- **Ejemplos**: Archivos en `/examples/` para módulos básicos
- **Módulos demo**: `/app/modules/` para ejemplos avanzados

### Archivos Importantes
- **Schema de tablas**: Este documento incluye el schema completo
- **Tipos TypeScript**: `/types/module.ts` y `/types/modules/`
- **Contextos React**: `/contexts/ModulesContext.tsx`

### Comunidad
- **Issues**: Reportar problemas en el repositorio
- **Feature requests**: Solicitar nuevas funcionalidades
- **Documentación**: Contribuir mejorando esta guía

---

**🎉 ¡El sistema de módulos de Gestiogar está diseñado para ser potente, seguro y fácil de usar. Esta guía te permitirá crear módulos increíbles que se integren perfectamente con el sistema!**

