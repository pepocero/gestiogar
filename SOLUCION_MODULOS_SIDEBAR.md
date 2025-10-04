# 🔧 SOLUCIÓN: Módulos no aparecen en el Sidebar

## 📋 Problema Identificado

Los módulos instalados no aparecen en el sidebar porque las tablas `modules` y `module_data` no existen en la base de datos de Supabase.

## ✅ Solución Paso a Paso

### 1. Crear las Tablas de Módulos

Ejecuta el siguiente SQL en **Supabase Dashboard > SQL Editor**:

```sql
-- =====================================================
-- SCRIPT COMPLETO PARA CREAR TABLAS DE MÓDULOS
-- Gestiogar - Sistema Multitenant
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de módulos
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    description TEXT,
    icon VARCHAR(100) DEFAULT 'Package',
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, slug)
);

-- Crear tabla de datos de módulos
CREATE TABLE IF NOT EXISTS public.module_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);

-- Habilitar RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Crear función user_company_id
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM auth.users 
    WHERE auth.uid() = id
  );
END;
$$;

-- Políticas para modules
CREATE POLICY "Users can view their company modules" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "Users can create modules for their company" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company modules" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "Users can delete their company modules" ON public.modules
    FOR DELETE USING (company_id = user_company_id());

-- Políticas para module_data
CREATE POLICY "Users can view their company module data" ON public.module_data
    FOR SELECT USING (company_id = user_company_id());

CREATE POLICY "Users can create module data for their company" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company module data" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "Users can delete their company module data" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers
CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON public.modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_data_updated_at 
    BEFORE UPDATE ON public.module_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Verificar la Instalación

Después de ejecutar el SQL, verifica que las tablas se crearon correctamente:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('modules', 'module_data');

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('modules', 'module_data');
```

### 3. Probar el Sistema

1. **Reinicia la aplicación** (refresca la página)
2. **Ve a Configuración > Módulos** para instalar un módulo
3. **Verifica que aparezca en el sidebar** después de la instalación

### 4. Debug si es Necesario

Si aún no funciona, visita `/debug-modules` en la aplicación para:
- Ver información detallada del contexto
- Ejecutar tests de conectividad
- Verificar el estado de las tablas

## 🎯 Archivos Creados/Modificados

### Nuevos Archivos:
- `database/CREATE_MODULES_TABLES_COMPLETE.sql` - Script SQL completo
- `app/debug-modules/page.tsx` - Página de debug
- `app/api/create-modules-tables/route.ts` - API para verificar tablas
- `examples/modulo-inventario.json` - Módulo de ejemplo

### Archivos Modificados:
- `contexts/ModulesContext.tsx` - Mejorado logging y manejo de errores
- `lib/modules.ts` - Mejorado logging en getModules()
- `components/layout/Sidebar.tsx` - Agregado debug info y enlace

## 🔍 Verificación Final

Una vez ejecutado el SQL, deberías ver:

1. **En el sidebar**: Sección "Módulos" con los módulos instalados
2. **En la consola**: Logs detallados del proceso de carga
3. **En `/debug-modules`**: Tests exitosos

## 📞 Si Aún No Funciona

1. Verifica que el usuario tenga permisos de administrador
2. Revisa los logs de la consola del navegador
3. Verifica que `company_id` esté correctamente configurado
4. Asegúrate de que las políticas RLS estén activas

---

**✅ Una vez completados estos pasos, el sistema de módulos debería funcionar correctamente y los módulos instalados aparecerán en el sidebar.**
