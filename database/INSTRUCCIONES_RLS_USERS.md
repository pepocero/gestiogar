# 🔒 Instrucciones para Corregir RLS de la Tabla Users

## ⚠️ Problema Actual

Las políticas RLS actuales de la tabla `users` están configuradas para `public` en lugar de `authenticated`, lo que puede causar problemas de seguridad y conflictos durante el registro.

### Políticas actuales (INCORRECTAS):
- ❌ `Allow insert for authenticated users` - Applied to: **public**
- ❌ `Users can update own profile` - Applied to: **public**
- ❌ `Users can view company users` - Applied to: **public**

## ✅ Solución

### Paso 1: Ir a Supabase Dashboard

1. Abre tu proyecto en Supabase
2. Ve a **Authentication** → **Policies**
3. Busca la tabla `users`

### Paso 2: Ejecutar el Script SQL

1. Ve a **SQL Editor**
2. Abre el archivo `database/fix_users_rls_policies.sql`
3. Copia todo el contenido
4. Pégalo en el editor SQL de Supabase
5. Haz clic en **Run** (Ejecutar)

### Paso 3: Verificar las Nuevas Políticas

Después de ejecutar el script, deberías ver estas políticas:

#### ✅ SELECT Policy
```
Name: Authenticated users can view their company users
Command: SELECT
Applied to: authenticated
Using: (company_id = user_company_id())
```

#### ✅ INSERT Policy
```
Name: Authenticated users can insert users for their company
Command: INSERT
Applied to: authenticated
With check: (company_id = user_company_id())
```

#### ✅ UPDATE Policy
```
Name: Users can update their own profile
Command: UPDATE
Applied to: authenticated
Using: (id = auth.uid())
With check: (id = auth.uid())
```

## 🔑 Notas Importantes

### Service Role (supabaseAdmin)
- ✅ **Bypasea automáticamente RLS**
- Se usa para crear usuarios durante el registro
- Se usa en `lib/auth.ts` función `createCompanyAndOwner`

### Usuario Normal (supabase)
- ❌ **Sujeto a RLS**
- Solo puede ver/modificar datos de su empresa
- Solo puede actualizar su propio perfil

## 🧪 Testing

Después de aplicar las políticas:

1. **Registro de usuario nuevo**:
   - Debería funcionar sin errores
   - El usuario se crea correctamente
   - El perfil se asocia a la empresa

2. **Login**:
   - Debería funcionar normalmente
   - El usuario ve solo su información

3. **Actualizar perfil**:
   - Los usuarios pueden actualizar su propio perfil
   - No pueden modificar perfiles de otros

## 🚨 Si el Script Falla

Si el script da error, ejecuta manualmente:

```sql
-- 1. Eliminar políticas antiguas
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view company users" ON public.users;
```

Luego ejecuta las políticas nuevas una por una desde el script.

## ✨ Resultado Esperado

Después de ejecutar el script:
- ✅ Registro de usuarios funcionando
- ✅ Multi-tenant seguro
- ✅ Usuarios solo ven su empresa
- ✅ Sin errores 403/406

---

**¿Listo?** Ejecuta el script `fix_users_rls_policies.sql` en Supabase y prueba registrar un nuevo usuario. 🚀
