# 📅 Módulo de Días Festivos y Vacaciones

## Descripción
El módulo de Días Festivos y Vacaciones permite gestionar los días festivos de la empresa y las solicitudes de vacaciones de los empleados de manera centralizada y organizada.

## Funcionalidades Principales

### 🎉 Gestión de Días Festivos
- **Crear días festivos** nacionales, locales, de empresa y puentes
- **Repetición anual automática** para días festivos que se repiten cada año
- **Filtrado por tipo** de día festivo
- **Aplicación selectiva** a empleados específicos o todos

### 🏖️ Gestión de Vacaciones
- **Solicitudes de vacaciones** con sistema de aprobación
- **Balance de días** por empleado y año
- **Calendario de vacaciones** para visualización
- **Estados de solicitud**: pendiente, aprobada, rechazada
- **Comentarios de aprobación** para transparencia

### 📊 Reportes y Estadísticas
- **Próximos días festivos** en el dashboard
- **Solicitudes pendientes** de aprobación
- **Estadísticas de uso** de vacaciones
- **Balance anual** por empleado

## Instalación

### Paso 1: Instalar el Módulo
1. Ve a **Configuración > Módulos**
2. Selecciona la pestaña **"Tienda de Módulos"**
3. Busca **"Gestión de Días Festivos y Vacaciones"**
4. Haz clic en **"Instalar"**

### Paso 2: Crear las Tablas de Base de Datos
Después de instalar el módulo, necesitas crear las tablas en Supabase:

1. **Ve a tu proyecto en Supabase Dashboard**
2. **Abre el SQL Editor**
3. **Ejecuta el siguiente SQL:**

```sql
-- Copia y pega todo el contenido del archivo:
-- database/create_holidays_vacations_tables.sql
```

4. **Verifica que las tablas se crearon correctamente:**
   - `holidays` - Días festivos
   - `vacation_requests` - Solicitudes de vacaciones
   - `vacation_balances` - Balance de días por empleado

### Paso 3: Verificar la Instalación
1. **Refresca la página** de módulos
2. **Verifica** que el módulo aparece como "Instalado"
3. **Comprueba** que aparece en el sidebar del sistema

## Uso del Módulo

### Gestión de Días Festivos
1. **Accede** desde el sidebar: **"Días Festivos y Vacaciones > Días Festivos"**
2. **Crea nuevos días festivos** con el botón "Nuevo Día Festivo"
3. **Configura** el tipo, fecha y si se repite anualmente
4. **Filtra** por tipo usando el selector superior

### Gestión de Vacaciones
1. **Accede** desde el sidebar: **"Días Festivos y Vacaciones > Vacaciones"**
2. **Crea solicitudes** de vacaciones con fechas y motivo
3. **Aproba o rechaza** solicitudes desde la lista
4. **Visualiza** el calendario de vacaciones

### Configuración Inicial
El módulo viene con **días festivos nacionales de Colombia** preconfigurados:
- Año Nuevo
- Día de los Reyes Magos
- Día de San José
- Día del Trabajador
- Independencia de Colombia
- Batalla de Boyacá
- Día de la Raza
- Independencia de Cartagena
- Inmaculada Concepción
- Navidad

## Estructura de Base de Datos

### Tabla: `holidays`
- `id` - Identificador único
- `company_id` - ID de la empresa (multitenant)
- `nombre` - Nombre del día festivo
- `fecha` - Fecha del día festivo
- `tipo` - Tipo: festivo_nacional, festivo_local, festivo_empresa, puente
- `repetir_anual` - Si se repite cada año
- `descripcion` - Descripción opcional
- `aplica_todos` - Si aplica a todos los empleados

### Tabla: `vacation_requests`
- `id` - Identificador único
- `company_id` - ID de la empresa (multitenant)
- `employee_id` - ID del empleado
- `employee_name` - Nombre del empleado
- `fecha_inicio` - Fecha de inicio de vacaciones
- `fecha_fin` - Fecha de fin de vacaciones
- `dias_solicitados` - Número de días solicitados
- `motivo` - Motivo de las vacaciones
- `estado` - Estado: pendiente, aprobada, rechazada
- `aprobado_por` - Usuario que aprobó/rechazó
- `comentarios_aprobacion` - Comentarios del supervisor

### Tabla: `vacation_balances`
- `id` - Identificador único
- `company_id` - ID de la empresa (multitenant)
- `employee_id` - ID del empleado
- `employee_name` - Nombre del empleado
- `ano` - Año del balance
- `dias_disponibles` - Días disponibles (por defecto 15)
- `dias_usados` - Días ya utilizados
- `dias_pendientes` - Días con solicitudes pendientes
- `dias_restantes` - Días restantes (calculado automáticamente)

## Seguridad (RLS)
Todas las tablas están protegidas con **Row Level Security (RLS)**:
- Cada empresa solo puede ver sus propios datos
- Los usuarios solo pueden acceder a datos de su empresa
- Las operaciones están restringidas por empresa

## Personalización
Puedes personalizar el módulo:
- **Agregar días festivos locales** específicos de tu región
- **Modificar el balance anual** de días de vacaciones
- **Configurar aprobadores** específicos por departamento
- **Agregar tipos de días festivos** adicionales

## Soporte
Para soporte técnico o preguntas sobre este módulo:
- **Documentación**: Revisa este archivo
- **Logs**: Revisa la consola del navegador para información detallada
- **Base de datos**: Verifica que las tablas estén creadas correctamente

## Changelog

### v1.0.0
- ✅ Gestión completa de días festivos
- ✅ Sistema de solicitudes de vacaciones
- ✅ Balance de días por empleado
- ✅ Calendario de vacaciones
- ✅ Integración con dashboard
- ✅ Seguridad multitenant
- ✅ Días festivos nacionales preconfigurados




