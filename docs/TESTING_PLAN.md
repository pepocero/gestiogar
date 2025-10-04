# 🧪 GestioGar - Plan de Testing

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Estado:** Listo para testing  

---

## �targets de Testing

### Objetivos Generales
- ✅ **Funcionalidad Core:** Verificar todas las funciones principales funcionan correctamente
- ✅ **Multitenancy:** Confirmar aislamiento completo entre empresas
- ✅ **Performance:** Validar tiempos de respuesta y carga
- ✅ **Security:** Verificar autenticación y autorización
- ✅ **User Experience:** Comprobar flujos de usuario completos

---

## 🌐 Frontend Testing Checklist

### 🔐 **Authentication Flow**
```
□ Login con credenciales válidas
□ Login fallido con credenciales incorrectas  
□ Registro de nueva empresa
□ Registro con email ya existente
□ Logout exitoso con redirección
□ Session timeout automático
□ Password reset flow completo
```

### 📊 **Dashboard**
```
□ Carga correcta de estadísticas en tiempo real
□ Botón "Actualizar" funciona sin errores
□ Estados de loading se muestran correctamente
□ Acciones rápidas navegan a páginas correctas
□ Métricas muestran datos reales (no inventados)
□ Cards de estadísticas responden visualmente
```

### 👥 **Gestión de Clientes**
```
□ Crear nuevo cliente con datos completos
□ Listar clientes con paginación
□ Buscar clientes por nombre/email
□ Editar información de cliente existente
□ Eliminar cliente con confirmación
□ Validación de campos obligatorios
□ Modal de cliente funciona correctamente
```

### 🔧 **Gestión de Técnicos**
```
□ Agregar nuevo técnico
□ Subir foto del técnico
□ Asignar especialidades al técnico
□ Activar/desactivar técnico
□ Eliminar técnico con confirmación
□ Lista de técnicos muestra estados correctos
□ Modal de técnico abre/cierra correctamente
```

### 📋 **Gestión de Trabajos**
```
□ Crear nuevo trabajo
□ Asignar cliente y técnico al trabajo
□ Cambiar estado del trabajo (pending → in_progress → completed)
□ Filtrar trabajos por estado
□ Buscar trabajo por título/cliente
□ Eliminar trabajo con confirmación
□ Modal de trabajo funciona correctamente
```

### 💰 **Gestión Financiera**
```
□ Crear presupuesto desde trabajo existente
□ Generar factura desde presupuesto
□ Calcular totales automáticamente
□ Filtrar por estado (pending/paid)
□ Exportar presupuesto a PDF (si implementado)
□ Modal de presupuesto/factura funciona
```

### 🏢 **Gestión de Aseguradoras**
```
□ Agregar nueva aseguradora
□ Editar información de aseguradora
□ Eliminar aseguradora con confirmación
□ Lista muestra estados activos/inactivos
□ Búsqueda por nombre funciona
□ Modal de aseguradora abre/cierra
```

### 🧩 **Sistema de Módulos**
```
□ Acceder a /settings/modules
□ Subir módulo JSON válido
□ Instalar módulo exitosamente
□ Activar/desactivar módulo instalado
□ Eliminar módulo con confirmación
□ Lista muestra módulos instalados
□ Módulos básicos aparecen en sidebar
```

### 📱 **Navegación y Layout**
```
□ Sidebar abre/cierra en mobile
□ Header muestra usuario actual
□ Footer contiene información correcta
□ Logo lleva a página principal
□ Home button en sidebar funciona
□ Sidebar no se duplica en páginas
□ Layout responsivo en diferentes tamaños
```

### ⚙️ **Settings**
```
□ Acceder a todas las páginas de settings
□ Cambiar información de perfil
□ Actualizar datos de empresa
□ Configurar módulos avanzados
□ Settings de seguridad (placeholder)
□ Settings de notificaciones (placeholder)
□ Navegación entre tabs funciona
```

---

## 🗄️ Database Testing Checklist

### **Data Integrity**
```
□ Datos se guardan correctamente en Supabase
□ Relaciones entre tablas se mantienen
□ Triggers funcionan correctamente
□ Constraints de BD se respetan
□ Backup y restore funcional
□ Performance de consultas optimizada
```

### **Row Level Security**
```
□ Datos de una empresa no son visibles para otra
□ Usuario solo ve sus propios datos
□ Administradores ven datos de su empresa
□ Políticas RLS activas y funcionales
□ Updates respetan aislamiento por empresa
□ Deletes respetan aislamiento por empresa
```

---

## 🔍 Error Handling Testing

### **Network Errors**
```
□ Error de conexión muestra mensaje apropiado
□ Timeout de requests se maneja gracefully
□ Error 500 del servidor se muestra correctamente
□ Retry automático para requests fallidos
□ Estados offline muestran UI apropiada
```

### **Validation Errors**
```
□ Campos requeridos muestran errores claros
□ Validación de email forma correcta
□ Validación de campos numéricos funciona
□ Validación de fechas es correcta
□ Errores se limpian al corregir input
```

### **Authentication Errors**
```
□ Sesión expirada redirige a login
□ Error de autorización muestra mensaje claro
□ Token inválido se maneja correctamente
□ Refresh token fallido maneja logout
```

---

## 📱 Mobile Testing Checklist

### **Responsive Design**
```
□ Layout se adapta a pantallas móviles
□ Sidebar colapsa correctamente
□ Botones son clickeables en móvil
□ Texto es legible en todos los tamaños
□ Inputs funcionan en móvil
□ Modales se muestran correctamente
```

### **Touch Interactions**
```
□ Swipe funciona en listas
□ Tap targets son suficientemente grandes
□ Scroll funciona suavemente
□ Touch feedback es apropiado
```

---

## ⚡ Performance Testing

### **Load Times**
```
□ Página principal carga <2 segundos
□ Dashboard carga <3 segundos
□ Listas con datos cargan <2 segundos
□ Modales abren <500ms
□ Navegación entre páginas <1 segundo
```

### **Data Operations**
```
□ Crear registro <500ms
□ Leer lista de elementos <1 segundo
□ Actualizar registro <500ms
□ Eliminar registro <500ms
□ Búsqueda con filtros <1 segundo
```

---

## 🧞‍♂️ Test Data Setup

### **Datos de Prueba Requeridos**
```javascript
// Datos de empresa y usuario test
const testCompany = {
  name: "Test Company S.L.",
  email: "admin@testcompany.com",
  phone: "+34 123 456 789"
}

const testClient = {
  first_name: "José",
  last_name: "García",
  email: "jose.garcia@email.com",
  phone: "+34 987 654 321",
  address: "Calle Prueba 123, Madrid"
}

const testTechnician = {
  name: "Carlos Eléctrico",
  specialty: "electricidad",
  email: "carlos@testcompany.com",
  phone: "+34 555 123 456",
  is_active: true
}

const testJob = {
  title: "Reparación avería eléctrica",
  description: "Cambio interruptor defectuoso en salón",
  status: "pending",
  priority: "alta"
}
```

### **URLs para Testing**
```
□ http://localhost:3000/ (Landing page)
□ http://localhost:3000/auth/login (Login)
□ http://localhost:3000/dashboard (Dashboard principal)
□ http://localhost:3000/clients (Gestión clientes)
□ http://localhost:3000/technicians (Gestión técnicos)
□ http://localhost:3000/jobs (Gestión trabajos)
□ http://localhost:3000/estimates (Presupuestos)
□ http://localhost:3000/invoices (Facturas)
□ http://localhost:3000/insurance (Aseguradoras)
□ http://localhost:3000/settings (Configuración)
□ http://localhost:3000/settings/modules (Módulos)
□ http://localhost:3000/module/modulo-prueba (Módulo demo)
```

---

## 🧪 TestSprite Integration

### **Configuración TestSprite**
```bash
# En package.json agregar:
"scripts": {
  "test:e2e": "npx @testsprite/cli test --config testsprite.config.js",
  "test:api": "npx @testsprite/cli api-test",
  "test:load": "npx @testsprite/cli load-test"
}
```

### **TestSprite Config Example**
```javascript
// testsprite.config.js
module.exports = {
  projectName: 'GestioGar',
  baseUrl: 'http://localhost:3000',
  testScope: 'frontend',
  parallel: true,
  timeout: 10000,
  include: [
    '/**/*.test.js',
    '/**/*.spec.js'
  ],
  exclude: [
    '/node_modules/**',
    '/docs/**',
    '/examples/**'
  ]
}
```

---

## 📊 Test Results Format

### **Success Criteria**
- ✅ **Functional Tests:** 100% pass rate required
- ✅ **Performance Tests:** 95% meet performance thresholds  
- ✅ **Security Tests:** 100% security checks pass
- ✅ **UI Tests:** All UI elements functional
- ✅ **Mobile Tests:** Responsive design verified

### **Test Report Structure**
```
📊 Test Results Summary
├── ✅ Tests Passed: XX/XX (XX%)
├── ⚡ Performance Avg: XXXms
├── 🔒 Security Score: XX%
├── 📱 Mobile Compatibility: XX%
└── 🚫 Failed Tests: X (Details below)
```

---

## 🔧 Setup Testing Environment

### **Prerequisites**
```bash
# Ensure server is running
npm run dev

# Ensure Supabase is accessible
# Ensure test data is loaded
# Ensure authentication is working
```

### **Database Reset for Testing**
```sql
-- Reset test data after each test suite
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE users CASCADE;
-- Re-insert test company and user
```

---

**Test Commander: Ready for Testing! 🚀**

Este plan te permite probar sistemáticamente todo el proyecto GestioGar. Una vez que el TestSprite esté conectado, podemos automatizar estos tests.

