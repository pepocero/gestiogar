# 🚀 Instrucciones Rápidas: Crear Tablas para Módulo de Días Festivos

## ⚡ Pasos Rápidos (2 minutos)

### 1. Ve a Supabase Dashboard
- Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
- Haz clic en **"SQL Editor"** en el menú lateral

### 2. Ejecuta el SQL
- Copia **TODO** el contenido del archivo: `database/create_holidays_vacations_tables.sql`
- Pégalo en el editor SQL
- Haz clic en **"Run"**

### 3. Verifica la Instalación
- Ve a **Configuración > Módulos** en tu aplicación
- Verifica que el módulo aparece como **"Instalado"**
- Comprueba que aparece en el **sidebar** del sistema

## ✅ ¿Qué se Crea?

El SQL crea automáticamente:
- **3 tablas nuevas**: `holidays`, `vacation_requests`, `vacation_balances`
- **Políticas de seguridad** multitenant (RLS)
- **Índices** para optimizar consultas
- **Triggers** para cálculos automáticos
- **Días festivos nacionales** de Colombia preconfigurados

## 🔒 Seguridad
- ✅ **Multitenant**: Cada empresa solo ve sus datos
- ✅ **Row Level Security**: Protección automática por empresa
- ✅ **Triggers**: Cálculos automáticos de días restantes

## 🎯 Después de Instalar
1. **Días festivos**: Se crean automáticamente los días nacionales de Colombia
2. **Sidebar**: Aparece la nueva sección "Días Festivos y Vacaciones"
3. **Dashboard**: Se muestra widget con próximos días festivos
4. **Funcionalidad**: Ya puedes crear días festivos y solicitudes de vacaciones

## 🆘 Si Hay Problemas
- **Error de permisos**: Verifica que tienes permisos de administrador en Supabase
- **Tablas ya existen**: El SQL usa `CREATE TABLE IF NOT EXISTS`, es seguro ejecutarlo varias veces
- **Módulo no aparece**: Refresca la página después de crear las tablas

## 📞 Soporte
- **Documentación completa**: `docs/MODULO_DIAS_FESTIVOS_VACACIONES.md`
- **Archivo SQL**: `database/create_holidays_vacations_tables.sql`

---
**¡Listo! Tu módulo de días festivos y vacaciones estará funcionando en menos de 2 minutos.** 🎉

