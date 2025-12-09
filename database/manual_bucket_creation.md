# Creación Manual del Bucket profile-photos

Si el script SQL no funciona, puedes crear el bucket manualmente desde el dashboard de Supabase.

## Pasos para crear el bucket manualmente:

### 1. **Ir al Dashboard de Supabase**
- Abrir tu proyecto en [supabase.com](https://supabase.com)
- Navegar a **Storage** en el menú lateral

### 2. **Crear nuevo bucket**
- Hacer clic en **"New bucket"**
- **Nombre del bucket**: `profile-photos`
- **Public bucket**: ✅ **Marcar como público**
- **File size limit**: `2 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

### 3. **Configurar políticas RLS**
Después de crear el bucket, ejecutar este script en el SQL Editor:

```sql
-- Políticas para el bucket profile-photos
CREATE POLICY "Authenticated users can upload profile photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Public can view profile photos" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can update profile photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can delete profile photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'profile-photos');
```

### 4. **Verificar la creación**
- El bucket `profile-photos` debe aparecer en la lista de buckets
- Debe estar marcado como **público**
- Debe tener el límite de 2MB configurado

### 5. **Probar la funcionalidad**
- Intentar subir una foto de perfil desde la interfaz
- Verificar que la URL generada funcione en el navegador
- Confirmar que la imagen se muestre en la tabla de técnicos

## Troubleshooting

### Error: "Bucket already exists"
- El bucket ya existe, solo necesitas configurar las políticas
- Ejecutar solo la parte de políticas del script

### Error: "Permission denied"
- Verificar que tienes permisos de administrador en el proyecto
- Intentar crear el bucket desde el dashboard en lugar del SQL

### Error: "Policy already exists"
- Las políticas ya están configuradas
- Verificar que el bucket sea público en la configuración
