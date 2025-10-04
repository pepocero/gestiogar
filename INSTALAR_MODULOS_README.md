# 🚀 Instalación del Sistema de Módulos

Para que el sistema de módulos funcione correctamente, necesitas ejecutar el script SQL en Supabase.

## ⚠️ **PASO REQUERIDO ANTES DE CONTINUAR**

### 1. Ejecutar Script SQL en Supabase

**Opción A: Desde el Dashboard de Supabase**
1. Ve a tu proyecto en Supabase
2. Haz clic en "SQL Editor" en el menú lateral
3. Copia y pega todo el contenido del archivo `database/create_modules_tables.sql`
4. Haz clic en "Run" para ejecutar el script

**Opción B: Desde la Terminal (si tienes psql instalado)**
```bash
psql -h [tu-host] -p 5432 -d postgres -f database/create_modules_tables.sql
```

### 2. Verificar la Instalación

Una vez ejecutado el script, deberías ver estas tablas creadas:
- ✅ `public.modules`
- ✅ `public.module_data`

Y estas políticas RLS:
- ✅ Políticas para `modules`
- ✅ Políticas para `module_data`

## 🎯 **¿Cómo usar el sistema?**

### Para Administradores:
1. Ve a `Configuración` en el sidebar
2. Hacer clic en "Módulos"
3. Instalar módulos desde archivos JSON

### Para Desarrolladores:
1. Revisa `docs/MODULO_DEVELOPER_GUIDE.md`
2. Usa los ejemplos en `examples/`
3. Crea tu módulo siguiendo la estructura JSON

## 📁 **Archivos de Ejemplo Incluidos**

- `examples/example-module-products.json` - Gestión de productos
- `examples/example-module-projects.json` - Proyectos especiales
- `examples/example-module-equipment.json` - Inventario de equipos

## 🔧 **Solución de Problemas**

Si ves el error: `Could not find the table 'public.modules'`
- Significa que las tablas no se han creado
- Ejecuta el script SQL de arriba

Si el sidebar de "Configuración" no funciona:
- Refresca la página después de crear las tablas
- Limpia la caché del navegador

## 📞 **Soporte**

Si tienes problemas con la instalación, revisa:
1. ¿Se ejecutó correctamente el script SQL?
2. ¿Las tablas aparecen en el esquema `public`?
3. ¿Los errores de consola siguen apareciendo?

---

**¡Una vez completado este paso, el sistema de módulos estará completamente funcional!** 🎉
