# GestioGar - Sistema de Gestión para Empresas de Reparaciones del Hogar

GestioGar es una aplicación web multitenant desarrollada para empresas de reparaciones del hogar que trabajan con aseguradoras. Permite gestionar presupuestos, trabajos, técnicos, clientes y aseguradoras de forma eficiente.

## Características Principales

### 🏢 Multitenant
- Cada empresa tiene su propio espacio aislado
- Datos completamente separados entre empresas
- Personalización de logos y configuración por empresa

### 🔐 Autenticación y Seguridad
- Sistema de registro de empresas con propietario
- Autenticación segura con Supabase Auth
- Roles de usuario (owner, admin, manager, employee)
- Row Level Security (RLS) para aislamiento de datos

### 📊 Dashboard Completo
- Estadísticas en tiempo real
- Resumen de trabajos, presupuestos y facturas
- Métricas de rendimiento y ingresos
- Trabajos recientes y citas del día

### 🛠️ Gestión de Trabajos
- Creación y seguimiento de órdenes de trabajo
- Asignación de técnicos
- Estados de trabajo (pendiente, programado, en progreso, completado)
- Prioridades (normal, urgente, emergencia)
- Tipos de trabajo (reparación, reforma, emergencia)

### 💰 Sistema de Presupuestos
- Creación de presupuestos detallados
- Items de mano de obra y materiales
- Estados de presupuesto (borrador, enviado, aprobado, rechazado)
- Cálculo automático de totales
- Validez de presupuestos

### 🏢 Gestión de Aseguradoras
- Registro de aseguradoras con las que se trabaja
- Información de contacto y términos de pago
- Portal web y API endpoints
- Gestión de relaciones comerciales

### 👥 Gestión de Clientes
- Base de datos de clientes
- Clientes directos y de aseguradoras
- Historial de trabajos por cliente
- Información de contacto completa

### 🔧 Gestión de Técnicos
- Registro de técnicos y especialidades
- Asignación de trabajos
- Certificaciones y licencias
- Gestión de horarios y disponibilidad

### 📦 Gestión de Materiales
- Inventario de materiales y productos
- Control de stock y reposición
- Precios de costo y venta
- Categorización por tipo de trabajo

### 📅 Programación de Citas
- Calendario de citas y trabajos
- Asignación automática de técnicos
- Recordatorios y notificaciones
- Optimización de rutas

### 💳 Facturación
- Generación de facturas
- Estados de pago
- Seguimiento de cobros
- Integración con aseguradoras

## Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Tailwind CSS, Headless UI
- **Iconos**: Lucide React
- **Formularios**: React Hook Form
- **Notificaciones**: React Hot Toast
- **Fechas**: date-fns

## Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd gestiogar
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://liqxrhrwiasewfvasems.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXhyaHJ3aWFzZXdmdmFzZW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTY5NjksImV4cCI6MjA3Mzc3Mjk2OX0.iAP60WkDkxftBLNIAcTWwFmNOsrsZDY2gH9sAGxe6Ss
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXhyaHJ3aWFzZXdmdmFzZW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5Njk2OSwiZXhwIjoyMDczNzcyOTY5fQ.jMa4iEvjjmN2VDhT-j7vWQhLMVn1aJ0CEiRzXDVJPGs
```

### 4. Configurar la base de datos
Ejecutar el script SQL en Supabase para crear las tablas y políticas RLS:

```bash
# Copiar el contenido de database/schema.sql y ejecutarlo en el SQL Editor de Supabase
```

### 5. Ejecutar la aplicación
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### 1. Registro de Empresa
- Acceder a `/auth/register`
- Completar información de la empresa y del propietario
- El sistema creará automáticamente la empresa y el usuario propietario

### 2. Configuración Inicial
- Acceder a `/settings` para personalizar la empresa
- Subir logo de la empresa
- Configurar información de contacto

### 3. Gestión de Aseguradoras
- Ir a `/insurance` para agregar aseguradoras
- Configurar términos de pago y contactos
- Establecer endpoints de API si es necesario

### 4. Gestión de Clientes
- Acceder a `/clients` para registrar clientes
- Diferenciar entre clientes directos y de aseguradoras
- Mantener información de contacto actualizada

### 5. Gestión de Técnicos
- Ir a `/technicians` para registrar técnicos
- Especificar especialidades y certificaciones
- Configurar tarifas por hora

### 6. Creación de Trabajos
- Acceder a `/jobs` para crear órdenes de trabajo
- Asignar técnicos y programar fechas
- Seguir el estado del trabajo hasta su finalización

### 7. Presupuestos
- Ir a `/estimates` para crear presupuestos
- Agregar items de mano de obra y materiales
- Enviar a clientes y hacer seguimiento de aprobación

## Estructura del Proyecto

```
gestiogar/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── jobs/              # Gestión de trabajos
│   ├── estimates/         # Gestión de presupuestos
│   ├── insurance/         # Gestión de aseguradoras
│   ├── settings/          # Configuración
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   └── layout/           # Componentes de layout
├── contexts/             # Contextos de React
├── lib/                  # Utilidades y configuración
├── database/             # Scripts de base de datos
└── public/               # Archivos estáticos
```

## Funcionalidades por Módulo

### Dashboard
- Estadísticas generales de la empresa
- Trabajos recientes
- Citas del día
- Ingresos del mes
- Trabajos pendientes y completados

### Trabajos
- Creación de órdenes de trabajo
- Asignación de técnicos
- Seguimiento de estados
- Programación de fechas
- Gestión de prioridades

### Presupuestos
- Creación de presupuestos detallados
- Items de mano de obra y materiales
- Estados de aprobación
- Validez de presupuestos
- Cálculo automático de totales

### Aseguradoras
- Registro de aseguradoras
- Información de contacto
- Términos de pago
- Portal web y API
- Gestión de relaciones

### Clientes
- Base de datos de clientes
- Información de contacto
- Historial de trabajos
- Clientes directos y de aseguradoras

### Técnicos
- Registro de técnicos
- Especialidades y certificaciones
- Asignación de trabajos
- Gestión de disponibilidad

### Configuración
- Información de la empresa
- Logo y personalización
- Perfil del usuario
- Configuración del sistema

## Seguridad

- **Row Level Security (RLS)**: Cada empresa solo puede acceder a sus propios datos
- **Autenticación**: Supabase Auth con JWT tokens
- **Autorización**: Roles de usuario con permisos específicos
- **Validación**: Validación de datos en frontend y backend
- **Sanitización**: Limpieza de inputs para prevenir inyecciones

## Escalabilidad

- **Multitenant**: Soporte para múltiples empresas
- **Base de datos**: PostgreSQL con índices optimizados
- **Caché**: Optimización de consultas
- **Storage**: Supabase Storage para archivos
- **CDN**: Distribución global de contenido

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas, contactar a través de:
- Email: soporte@gestiogar.com
- Documentación: [docs.gestiogar.com](https://docs.gestiogar.com)

## Roadmap

### Próximas Funcionalidades
- [ ] App móvil para técnicos
- [ ] Integración con APIs de aseguradoras
- [ ] Sistema de notificaciones push
- [ ] Reportes avanzados y analytics
- [ ] Integración con sistemas de facturación
- [ ] Gestión de inventario en tiempo real
- [ ] Optimización de rutas con GPS
- [ ] Sistema de garantías
- [ ] Portal del cliente
- [ ] Integración con WhatsApp Business
