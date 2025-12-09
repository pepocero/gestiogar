# 🔧 Solución para Error 406 en Registro

## ❌ Problema

Al registrar un nuevo usuario, aparecen errores 406 (Not Acceptable) y el dashboard se queda cargando:

```
GET /rest/v1/companies?select=id&slug=eq.ferreteria-cacho 406
GET /rest/v1/users?select=*&id=eq.d00ddac6-... 406
Error fetching user: Cannot coerce the result to a single JSON object
```

## 🔍 Causa

El error 406 ocurre cuando:
1. Las políticas RLS están mal configuradas
2. La función `user_company_id()` no existe o no funciona
3. PostgREST no puede acceder a las tablas

## ✅ Solución (Ejecutar en orden)

### PASO 1: Verificar y crear la función `user_company_id()`

**Ejecuta este script primero:**

📄 `database/verify_user_company_id_function.sql`

```sql
-- Crear o reemplazar la función
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
$$;
```

### PASO 2: Actualizar políticas RLS de `users`

**Ejecuta este script segundo:**

📄 `database/fix_users_rls_policies.sql`

Esto eliminará las políticas antiguas (`public`) y creará nuevas (`authenticated`).

### PASO 3: Forzar recarga del schema de PostgREST

**Ejecuta este script tercero:**

```sql
NOTIFY pgrst, 'reload schema';
```

### PASO 4: Verificar las políticas

**Ejecuta para verificar:**

```sql
-- Ver políticas de users
SELECT 
    policyname, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- Deberías ver:
-- 1. Authenticated users can view their company users (SELECT, authenticated)
-- 2. Authenticated users can insert users for their company (INSERT, authenticated)
-- 3. Users can update their own profile (UPDATE, authenticated)
```

### PASO 5: Verificar políticas de `companies`

```sql
-- Ver políticas de companies
SELECT 
    policyname, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'companies';

-- Debe permitir SELECT con user_company_id()
```

## 🚨 Si los errores 406 persisten

### Opción A: Deshabilitar RLS temporalmente (NO RECOMENDADO)

**Solo para debugging:**

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Probar registro
-- Luego volver a habilitar:

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
```

### Opción B: Política temporal más permisiva

```sql
-- Crear política temporal para INSERT en users (solo durante setup)
CREATE POLICY "Allow service role and new users insert"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- IMPORTANTE: Eliminar esta política después de que el registro funcione
-- DROP POLICY "Allow service role and new users insert" ON public.users;
```

### Opción C: Verificar que el service role está configurado correctamente

En `lib/supabase.ts`, verifica que:

```typescript
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabaseAdmin = globalThis.__supabaseAdmin ?? (
  globalThis.__supabaseAdmin = createSupabaseClient(
    supabaseUrl, 
    supabaseServiceKey,  // ← Debe ser el SERVICE_ROLE key
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
)
```

## 🎯 Orden de Ejecución Recomendado

1. ✅ Ejecutar `verify_user_company_id_function.sql`
2. ✅ Ejecutar `fix_users_rls_policies.sql`
3. ✅ Ejecutar `NOTIFY pgrst, 'reload schema';`
4. ✅ Refrescar la app en el navegador (Ctrl+Shift+R)
5. ✅ Intentar registrar nuevo usuario

## 📝 Nota Importante

**El service role bypasea RLS automáticamente**, por lo que las políticas RLS no afectan a `supabaseAdmin`. El problema actual es que:

1. El cliente normal (`supabase`) intenta verificar el slug
2. Las políticas RLS bloquean la consulta
3. Obtienes error 406

**Solución:** Las políticas deben permitir ciertas consultas durante el proceso de registro.

---

**Ejecuta los scripts en orden y luego intenta registrar de nuevo.** 🚀
