# Configuración de Fotos de Perfil para Técnicos

Este documento explica cómo configurar las políticas de almacenamiento para las fotos de perfil de los técnicos con seguridad multitenant.

## Estructura de Archivos

Los archivos se almacenan en Supabase Storage con la siguiente estructura:
```
profile-photos/
└── technicians/
    └── {company_id}/
        └── technician-{technician_id}-{timestamp}.{extension}
```

Ejemplo:
```
profile-photos/technicians/123e4567-e89b-12d3-a456-426614174000/technician-456-1234567890.jpg
```

## Scripts de Configuración

### 1. Limpiar Políticas Existentes (Opcional)
```sql
-- Ejecutar si hay conflictos con políticas existentes
\i database/cleanup_storage_policies.sql
```

### 2. Configurar Políticas Multitenant
```sql
-- Configurar el bucket y las políticas RLS
\i database/setup_profile_photos_storage_policies.sql
```

### 3. Verificar Configuración
```sql
-- Verificar que todo esté configurado correctamente
\i database/verify_storage_policies.sql
```

## Políticas de Seguridad

Las políticas implementadas garantizan que:

1. **Solo usuarios autenticados** pueden acceder al bucket
2. **Cada empresa solo puede acceder** a sus propios archivos
3. **La estructura de carpetas** se respeta (`technicians/{company_id}/`)
4. **Operaciones permitidas**: INSERT, SELECT, UPDATE, DELETE
5. **Validación de tipos**: Solo imágenes (JPEG, PNG, GIF, WebP)
6. **Límite de tamaño**: Máximo 2MB por archivo

## Funcionamiento

### Subida de Archivos
- El usuario debe estar autenticado
- El archivo se sube a `technicians/{company_id}/`
- Se valida el tipo y tamaño del archivo (máximo 2MB)
- Se genera un nombre único con timestamp

### Acceso a Archivos
- Solo usuarios de la misma empresa pueden ver los archivos
- Las URLs públicas funcionan solo para archivos de la empresa del usuario
- No se puede acceder a archivos de otras empresas

### Actualización/Eliminación
- Solo se pueden modificar archivos de la propia empresa
- Se mantiene la misma estructura de carpetas
- Se respetan las validaciones de tipo y tamaño (máximo 2MB)

## Troubleshooting

### Error: "permission denied for schema storage"
- Verificar que el usuario tenga permisos de administrador en Supabase
- Ejecutar los scripts desde el SQL Editor del dashboard de Supabase

### Error: "bucket does not exist"
- El script crea automáticamente el bucket si no existe
- Verificar que se ejecutó `setup_profile_photos_storage_policies.sql`

### Error: "policy already exists"
- Ejecutar primero `cleanup_storage_policies.sql`
- Luego ejecutar `setup_profile_photos_storage_policies.sql`

### Las fotos no se muestran
- Verificar que las políticas de SELECT estén activas
- Comprobar que la URL pública se genera correctamente
- Verificar que el archivo esté en la carpeta correcta de la empresa

## Verificación Manual

Para verificar que las políticas funcionan:

1. **Como usuario de la empresa A**: Subir una foto de técnico
2. **Como usuario de la empresa B**: Intentar acceder a la URL de la foto de la empresa A
3. **Resultado esperado**: El usuario B no debería poder ver la foto

## Mantenimiento

- Las políticas se aplican automáticamente a nuevos archivos
- No se requiere mantenimiento adicional
- Los archivos se eliminan automáticamente cuando se elimina un técnico (si se implementa la lógica de cascada)
