# GestioGar - Product Requirements Document (PRD)

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Estado:** Implementación Activa

---

## 📋 Executive Summary

**GestioGar** es una plataforma SaaS multitenant desarrollada para empresas de reparaciones del hogar que operan con aseguradoras. El sistema centraliza la gestión de clientes, técnicos, trabajos, presupuestos, facturas y comunicaciones en una solución integrada moderna.

### Stack Tecnológico
- **Frontend:** Next.js 14, TypeScript, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL), Row Level Security
- **Auth:** Supabase Auth, JWT tokens
- **Deployment:** Vercel/Netlify compatible

---

## 🎯 Product Vision & Objectives

### Visión
Ser la plataforma SaaS líder en España para la gestión digital de empresas de reparaciones del hogar, facilitando la integración con aseguradoras y mejorando significativamente la eficiencia operativa.

### Objetivos Principales
- ✅ **Modernización:** Digitalizar procesos manuales de gestión empresarial
- ✅ **Integración:** Facilitar conexión con sistemas de aseguradoras
- ✅ **Escalabilidad:** Soporte multitenant para empresas de diferentes tamaños
- 🎯 **Eficiencia:** Reducir tiempo de gestión administrativa en un 60%
- 🎯 **Colaboración:** Mejorar comunicación entre técnicos, clientes y aseguradoras

---

## 👥 Target Users & Personas

### 🏢 Propietarios de Empresas
- **Necesidades:** Supervisión completa de operaciones, métricas financieras, gestión de recursos
- **Pain Points:** Visibilidad limitada de procesos, dificultad para escalar
- **Goals:** Control y crecimiento empresarial

### 👨‍💼 Administradores  
- **Necesidades:** Crear presupuestos, gestionar citas, comunicación con clientes
- **Pain Points:** Procesos repetitivos, pérdida de información, falta de automatización
- **Goals:** Eficiencia administrativa y satisfacción del cliente

### 🔧 Técnicos
- **Necesidades:** Acceso a trabajos asignados, historial de clientes, herramientas de comunicación
- **Pain Points:** Información dispersa, falta de contexto, comunicación limitada
- **Goals:** Optimización del tiempo de campo y calidad de servicio

### 👤 Clientes
- **Necesidades:** Seguimiento del estado de trabajos, comunicación transparente, facturación clara
- **Pain Points:** Falta de transparencia, comunicación escasa, procesos lentos
- **Goals:** Confianza y satisfacción en el servicio

---

## 🚀 Core Features

### Módulo Principal (ALTA PRIORIDAD ✅)

#### 📋 Gestión de Trabajos
- **Estado:** ✅ Implementado
- **Funcionalidades:**
  - Creación de nuevos trabajos con asignación de técnicos
  - Seguimiento del ciclo de vida completo (pending → in_progress → completed)
  - Gestión de materiales y proveedores asociados
  - Actualización de estado en tiempo real
  - Historial completo de cambios y actividades

#### 💰 Gestión Financiera  
- **Estado:** ✅ Implementado
- **Funcionalidades:**
  - Creación y gestión de presupuestos detallados
  - Generación automática de facturas desde trabajos completados
  - Cálculo automático de costes (mano de obra + materiales)
  - Seguimiento de pagos y estados financieros
  - Integración con dashboard para métricas de ingresos

#### 👥 Gestión de Clientes
- **Estado:** ✅ Implementado  
- **Funcionalidades:**
  - Base de datos centralizada de clientes
  - Información completa de contacto y ubicación
  - Historial de trabajos realizados
  - Seguimiento de relación cliente-aseguradora
  - Comunicaciones integradas

#### 🔧 Gestión de Técnicos
- **Estado:** ✅ Implementado
- **Funcionalidades:**
  - Registro y gestión de técnicos con especialidades
  - Asignación automática de trabajos por especialidad/proximidad
  - Gestión de horarios y disponibilidad
  - Evaluación de rendimiento y métricas
  - Sistema de calificaciones

#### 🏢 Gestión de Aseguradoras
- **Estado:** ✅ Implementado
- **Funcionalidades:**
  - Base de datos de aseguradoras y contacto
  - Gestión de pólizas y casos de seguro
  - Automatización de comunicaciones
  - Reportes específicos para aseguradoras
  - Procesos de autorización de trabajos

#### 📊 Dashboard & Reportes
- **Estado:** ✅ Implementado con datos reales
- **Funcionalidades:**
  - Estadísticas en tiempo real (trabajos activos, ingresos mensuales, clientes totales)
  - Métricas de rendimiento por técnico
  - Análisis de actividad reciente
  - Acciones rápidas para navegación
  - Visualización de estado del sistema

### Módulo Avanzado (MEDIA PRIORIDAD 🔧)

#### 🧩 Sistema de Módulos
- **Estado:** ✅ Implementado como framework extensible
- **Arquitectura:**
  - Sistema de módulos basado en PrestaShop design patterns
  - Hooks y eventos personalizables
  - Sistema de servicios modulares
  - Carga dinámica de componentes
  - Administración via interface web

#### 🔗 API & Integraciones
- **Estado:** 🚧 En desarrollo
- **Funcionalidades planificadas:**
  - API RESTful completa con Swagger
  - Webhooks para eventos del sistema
  - Integración con sistemas de aseguradoras
  - Conectores para contabilidad (Factusol, ContaPlus)
  - Webhooks para módulos de terceros

#### 📱 Módulos Especializados
- **Estado:** ✅ Framework implementado, módulos demo creados
- **Módulos disponibles:**
  - Inventario de herramientas con mantenimiento
  - Gestión de proyectos constructivos
  - Módulo de equipamiento especializado
  - Sistema de gestión de usuarios avanzado

---

## 🛠️ Technical Architecture

### Arquitectura General
```
Frontend (Next.js 14) 
    ↓
Protected Routes & Auth
    ↓  
API Layer & Business Logic
    ↓
Supabase (PostgreSQL)
    ↓
Security Layer (RLS)
```

### Stack Técnico Detallado

#### Frontend
- **Next.js 14** con App Router para SSR/SSG
- **TypeScript** para type safety completo
- **Tailwind CSS** para diseño responsive moderno
- **Lucide Icons** para iconografía consistente
- **React Hook Form** para gestión de formularios
- **React Hot Toast** para notificaciones
- **Context API** para estado global (Auth, Modules)

#### Backend
- **Supabase** como Backend-as-a-Service
- **PostgreSQL** con Row Level Security para multitenancy
- **Real-time subscriptions** para updates en vivo
- **Edge Functions** para lógica compleja
- **Storage** para archivos y recursos multimedia
- **Triggers & Functions** para automatización

#### Authentication & Security
- **Supabase Auth** con JWT tokens
- **Row Level Security (RLS)** para aislamiento multi-tenant
- **SSL/TLS encryption** end-to-end
- **Session management** con refresh tokens
- **Role-based permissions** granulares

### Estructura de Base de Datos

#### Tablas Principates
```sql
-- Core Tables
companies (multitenant isolation)
users (linked to companies)
clients (per company scope)
technicians (per company scope) 
jobs (with full lifecycle tracking)
estimates (with PDF generation)
invoices (with payment tracking)
materials (inventory management)
suppliers (vendor management)
insurance_companies (external partnerships)
appointments (scheduling system)

-- Module System
modules (dynamic module registry)
module_data (module-specific data storage)

-- Advanced Module System  
advanced_modules (file-based module system)
module_hooks (event system)
module_services (business logic)
```

#### Relaciones Clave
- `users` → `companies` (1:N relationship)
- `jobs` → `clients` + `technicians` (many-to-many)
- `estimates` → `jobs` (1:1 relationship) 
- `invoices` → `jobs` (1:N relationship)
- RLS policies en todas las tablas con función `user_company_id()`

---

## 📊 Success Metrics & KPIs

### Métricas Técnicas
- **Uptime:** 99.5% objetivo (Supabase SLA)
- **Response Time:** <200ms promedio para operaciones CRUD
- **Concurrent Users:** S滴orte hasta 1000 usuarios por empresa
- **Data Security:** 0 brechas de seguridad por incidentes

### Métricas de Negocio  
- **Reducerción tiempo administrativo:** 60% objetivo
- **Incrementar productividad técnicos:** 30% objetivo
- **Satisfacción cliente:** 90% objetivo (NPS score)
- **Tiempo de onboarding:** <2 horas para usuarios nuevos

### Métricas de Producto
- **Feature Adoption:** 80% usar funciones core en 30 días
- **User Retention:** 95% usuarios activos después de 30 días
- **Module Usage:** 40% empresas usando módulos avanzados
- **API Usage:** Tracking completo de endpoints para optimization

---

## 🔄 User Journey & Flows

### Primary User Flow: Nuevo Trabajo
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │───▶│  Nuevo Trabajo  │───▶│ Datos del Cliente│
│   (Overview)    │    │   (Creación)    │    │   (Formulario)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │                       │
         │                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Seguimiento    │◀───│ Asignar Técnico │◀───│ Asignar Material│
│   (Estado)      │    │  (Especialista) │    │   (Inventario)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technical Flow: Dashboard Data Loading
```typescript
// 1. Component mount
useEffect(() => {
  loadDashboardData()
}, [])

// 2. Data fetching (parallel execution)
const [statsData, activityData] = await Promise.all([
  getDashboardStats(),    // Multiple Supabase queries
  getRecentActivity()     // JOINs with clients table
])

// 3. State update & rendering
setStats(statsData)
setRecentActivity(activityData)
setLoading(false)
```

---

## 📅 Development Roadmap

### Fase 1: MVP CORE ✅ COMPLETADA
**Período:** Noviembre - Diciembre 2024
- ✅ Sistema multitenant completamente configurado
- ✅ Autenticación y autorización implementada
- ✅ Gestión completa de datos (CRUD operations)
- ✅ Dashboard funcional con estadísticas reales
- ✅ Arquitectura modular implementada
- ✅ Módulos avanzados con framework PrestaShop-style
- ✅ Acciones rápidas funcionales con navegación

### Fase 2: Funcionalidades Extendidas
**Período:** Q1 2025 (Enero - Marzo)

#### Mobile Application 📱
- App móvil para técnicos (React Native)
- Funcionalidades offline
- Geolocalización para trabajos
- Captura de fotos y evidencias
- Firma digital de completado

#### Advanced Notifications 📧  
- Sistema de notificaciones push
- Email templates automatizados
- SMS integration para clientes
- Webhooks para sistemas externos
- Preference center para usuarios

#### Insurance Integration 🔌
- API integrations con principales aseguradoras (Mapfre, MAPFRE, Zurich)
- Document management automatizado
- Electronic signature integration
- Claims processing automation
- Realtime status updates

#### Advanced Analytics 📊
- Business intelligence dashboard
- Predictive analytics para tendencias
- Custom report builder
- Data export en múltiples formatos
- Integration con herramientas BI

### Fase 3: Escalabilidad & Enterprise
**Período:** Q2 2025 (Abril - Junio)

#### Platform Expansion 🚀
- White-label solutions para grandes empresas
- Custom module development para Enterprise
- Multi-region deployment
- Advanced audit trails
- Compliance automation (LOPD-GDD)

#### API Ecosystem 🔗
- Public API v2 con rate limiting
- Developer portal y documentation
- SDK para integrations
- Marketplace de módulos de terceros
- Community-driven extensions

---

## 🔐 Security & Compliance

### Security Architecture

#### Multitenancy Security
```sql
-- Row Level Security Implementation
CREATE POLICY "company_isolation" ON jobs
  FOR ALL TO authenticated 
  USING (company_id = user_company_id());

CREATE POLICY "company_isolation" ON clients
  FOR ALL TO authenticated 
  USING (company_id = user_company_id());
```

#### Data Protection
- **Encryption at rest:** Supabase encryption + database-level encryption
- **Encryption in transit:** TLS 1.3 para todas las comunicaciones
- **Data isolation:** Row Level Security en todas las tablas sensibles
- **Access controls:** JWT-based authentication con refresh tokens
- **Audit logging:** Log completo de todas las operaciones sensibles

#### Authentication Security
- Password requirements + complexity validation
- Session timeout configurables (30 minutes default)
- MFA implementation (phone + email verification)
- Password reset con seguridad mejorada
- Login attempt limiting y protection anti-brute force

### Compliance Framework

#### GDPR/LOPD-GDD Compliance ✅
- **Data minimization:** Solo se recopilan datos necesarios
- **Purpose limitation:** Datos solo para funciones específicas
- **Storage limitation:** Retención configurable por tipo de dato
- **Consent management:** Centro de preferencias de usuario
- **Data portability:** Export completo de datos por usuario
- **Right to deletion:** Soft delete con purga según regulaciones

#### Industry Compliance
- **ISO 27001:** Information Security Management
- **SOC 2 Type II:** Service Organization Control
- **Spanish Cybersecurity Framework:** Cumplimiento con ENS
- **Insurance regulations:** Adaptación a normativas sectoriales

---

## 💰 Business Model & Monetization

### SaaS Subscription Model

#### Plan Tarifario Estructurado
```
Plan Básico (€29/mes)
├── Hasta 3 técnicos
├── Funcionalidades core completas
├── Dashboard y reportes básicos
├── Support email estándar
└── 5GB storage

Plan Profesional (€79/mes)  
├── Hasta 15 técnicos
├── Todos los módulos avanzados
├── Analytics avanzados
├── Integraciones con aseguradoras
├── API access incluido
├── Support prioritario
└── 50GB storage

Plan Enterprise (Custom pricing)
├── Técnicos ilimitados
├── Módulos custom development
├── White-label options
├── Dedicated support
├── SLA garantizado 99.9%
├── On-premise deployment options
└── Storage ilimitado
```

#### Revenue Projections
```
Year 1 (2025):
├── Target: 50 empresas activas
├── Average: Plan Profesional (€79/mes)
├── Monthly Revenue: €3,950
└── Annual Revenue: €47,400

Year 2 (2026):
├── Target: 150 empresas activas  
├── Average: Mix Plan Profesional + Enterprise
├── Monthly Revenue: €12,000
└── Annual Revenue: €144,000

Year 3 (2027):
├── Target: 300 empresas activas
├── Focus: Enterprise customers (30%)
├── Monthly Revenue: €28,000
└── Annual Revenue: €336,000
```

#### Monetization Strategies
- **Subscription tiers** escalables según necesidad
- **Module marketplace** con revenue sharing (70/30)
- **Training & certification** programs
- **Consultation services** para implementations grandes
- **White-label licensing** para partners grandes
- **API usage billing** para integrations profundas

---

## 🔧 Technical Requirements

### Development Requirements
```
Languages: TypeScript, SQL, JavaScript
Frameworks: Next.js 14+, Supabase
Databases: PostgreSQL (Supabase)
Cloud: Vercel/Supabase cloud infrastructure
Monitoring: Supabase built-in + custom analytics
Testing: Jest, Cypress, Playwright
Documentation: TypeDoc, Storybook
```

### Performance Requirements
- **Page Load Time:** <2 segundos para páginas dinámicas
- **Database Queries:** <100ms para operaciones simples
- **File Uploads:** <5 segundos para documentos hasta 10MB
- **Concurrent Users:** S滴orte mínimo 100 usuarios simultáneos
- **Data Sync:** <5 segundos para updates en tiempo real
- **Mobile Performance:** PWA score >90

### Scalability Requirements
- **User Growth:** Architecture preparada para 10x growth
- **Data Volume:** Optimization para millones de registros
- **Regional Expansion:** Multi-region ready desde día 1
- **Integration Volume:** Capacity para 50+ integrations
- **Module Complexity:** Framework extensible para módulos complejos

---

## 📧 Support & Maintenance

### Support Structure
```
Level 1 Support (Response <4h):
├── User documentation y troubleshooting básico
├── Account management y billing questions  
├── Basic technical issues resolution
└── Feature request collection

Level 2 Support (Response <24h):
├── Technical issues escalation
├── Integration support básico
├── Training y onboarding assistance
└── Bug triage y reporting

Level 3 Support (Response <48h):
├── Complex technical issues
├── Custom development requests
├── Architecture consulting
└── Enterprise-level support
```

### Maintenance Schedule
- **Security Updates:** Automáticos + monthly security reviews
- **Feature Releases:** Bi-weekly releases con changelog
- **Breaking Changes:** 30 días notice minimum
- **Database Maintenance:** Durante ventanas programadas (madrugada ES)
- **System Monitoring:** 24/7 automated monitoring con alerts

---

## 📄 Appendix: Technical Specifications

### API Endpoints Documentation
```typescript
// Core CRUD Operations
GET    /api/jobs              // Listar trabajos con filtros
POST   /api/jobs              // Crear nuevo trabajo  
PUT    /api/jobs/:id          // Actualizar trabajo
DELETE /api/jobs/:id          // Eliminar trabajo

// Dashboard Analytics
GET    /api/stats/dashboard   // Estructísticas dashboard
GET    /api/stats/recent      // Actividad reciente

// Module System
GET    /api/modules           // Listar módulos disponibles
POST   /api/modules/install   // Instalar módulo nuevo
PUT    /api/modules/:id       // Actualizar módulo
DELETE /api/modules/:id       // Desinstalar módulo
```

### Database Schema Overview
```sql
-- Core business entities
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin'
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  technician_id UUID REFERENCES technicians(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Security Model
```typescript
// Authentication flow
interface AuthContext {
  user: User | null
  company: Company | null  
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

// Authorization checks
const requireCompany = () => {
  const { company } = useAuth()
  if (!company) throw new Error('Company required')
  return company
}
```

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** Diciembre 2024
- **Document Type:** Technical PRD
- **Target Audience:** Development team, stakeholders
- **Next Review:** Marzo 2025

---

*Este documento técnico es la especificación completa para el desarrollo y mantenimiento de GestioGar. Para la versión ejecutiva en HTML, consulte `docs/prd.html`.*
