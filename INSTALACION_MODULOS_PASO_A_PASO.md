# 🔧 Instalación Paso a Paso del Sistema de Módulos

## ⚠️ **SOLUCIÓN AL ERROR DE SNIPPET**

Si recibes el error "Unable to find snippet with ID", sigue estos pasos:

### 📋 **PASO 1: Crear tabla de módulos**

**Ejecuta este SQL en Supabase Editor:**

```sql
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
```

### 📋 **PASO 2: Crear tabla de datos de módulos**

**Ejecuta este SQL:**

```sql
CREATE TABLE IF NOT EXISTS public.module_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);
```

### 📋 **PASO 3: Crear índices**

**Ejecuta este SQL:**

```sql
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
```

### 📋 **PASO 4: Habilitar RLS en módulos**

**Ejecuta este SQL:**

```sql
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

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their company modules" ON public.modules;
CREATE POLICY "Users can view their company modules" ON public.modules
    FOR SELECT USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can create modules for their company" ON public.modules;
CREATE POLICY "Users can create modules for their company" ON public.modules
    FOR INSERT WITH CHECK (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can update their company modules" ON public.modules;
CREATE POLICY "Users can update their company modules" ON public.modules
    FOR UPDATE USING (company_id = user_company_id());

DROP POLICY IF EXISTS "Users can delete their company modules" ON public.modules;
CREATE POLICY "Users can delete their company modules" ON public.modules
    FOR DELETE USING (company_id = user_company_id());
```

### 📋 Más simples, ejecuta este SQL completo de una vez:

```sql
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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_modules_company_active ON public.modules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON public.modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_data_company_module ON public.module_data(company_id, module_id);

-- Habilitar RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_data ENABLE ROW LEVEL SECURITY;

-- Crear función user_company_id si no existe
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

CREATE POLICY "Users can create module data for their company" ON public source:
CREATE POLICY "Users can create module data for their company" ON public.module_data
    FOR INSERT WITH CHECK (company_id = user_company_id());

CREATE POLICY "Users can update their company module data" ON public.module_data
    FOR UPDATE USING (company_id = user_company_id());

CREATE POLICY "Users can delete their company module data" ON public.module_data
    FOR DELETE USING (company_id = user_company_id());
```

### 📋 **PASO 5: Verificar instalación**

Después de ejecutar cualquiera de los SQL anteriores:

1. Refresca la página de configuración
2. Ve a Configuración > Módulos
3. Deberías ver la interfaz completa sin errores

### 🔧 **Si sigues teniendo problemas:**

1. **Limpia la caché** del navegador
2. **Verifica** que las tablas se crearon en Supabase
3. **Confirma** que las políticas RLS están activas
4. **Refresca** la aplicación completamente

---

**¡Una vez completado, el sistema de módulos estará funcionando!** 🎉
