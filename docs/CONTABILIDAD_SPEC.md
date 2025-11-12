# 📘 Especificación Sección Contabilidad

## Objetivo
Ofrecer a cada empresa un área nativa para controlar su contabilidad básica: registrar movimientos, estimar impuestos, comparar presupuestos contra resultados y generar reportes financieros sin depender de módulos externos.

## Alcance inicial
1. **Dashboard financiero**
   - KPIs rápidos (ingresos, gastos, margen, flujo de caja, impuestos estimados).
   - Gráficos de evolución mensual y distribución por categoría.
   - Alertas por facturas vencidas, gastos recurrentes y previsiones negativas.

2. **Movimientos contables (Libro diario simplificado)**
   - Alta/edición de movimientos con clasificación (`income`, `expense`, `tax`, `transfer`, `adjustment`).
   - Campos clave: fecha, categoría, subcategoría, importes neto/bruto, impuesto, método de pago, estado (`pending`, `paid`, `cancelled`), referencias a facturas o trabajos, notas y adjuntos.
   - Importación masiva (CSV) como evolución futura.

3. **Gestión de impuestos**
   - Registro de IVA/IGIC y retenciones asociadas a cada movimiento.
   - Estimaciones automáticas por periodo (mensual/trimestral) a partir de los movimientos.
   - Calendario de vencimientos configurable.

4. **Presupuesto y forecast**
   - Presupuestos mensuales por categoría.
   - Forecast de flujo de caja usando ingresos pendientes y gastos programados.
   - Comparativa presupuesto vs real y variaciones porcentuales.

5. **Reportes**
   - Estado de resultados (P&L), balance simplificado y flujo de caja.
   - Reportes por aseguradora/cliente, por centro de costo y por técnico.
   - Exportación PDF/CSV y envíos programados (futuro).

6. **Permisos y auditoría**
   - Roles específicos (Contable, Dirección) heredando el sistema de roles existente.
   - Registro de quién crea/edita cada movimiento.

## Diseño de datos
### Tabla `accounting_transactions`
| Campo | Tipo | Detalle |
| --- | --- | --- |
| `id` | uuid (PK) | generado por defecto |
| `company_id` | uuid | FK → `companies.id`, filtra por inquilino |
| `date` | date | fecha del movimiento |
| `type` | text | `income` \| `expense` \| `tax` \| `transfer` \| `adjustment` |
| `category` | text | categoría principal (ej. Ventas aseguradoras) |
| `sub_category` | text | subcategoría opcional |
| `amount` | numeric(12,2) | importe total (positivo) |
| `currency` | text | por defecto `EUR` |
| `tax_rate` | numeric(5,2) | porcentaje de impuesto |
| `tax_amount` | numeric(12,2) | valor calculado del impuesto |
| `net_amount` | numeric(12,2) | base imponible |
| `payment_method` | text | transferencia, efectivo, tarjeta, etc. |
| `status` | text | `pending` \| `paid` \| `cancelled` |
| `due_date` | date | vencimiento para cobranzas/pagos |
| `related_invoice_id` | uuid | referencia opcional a `invoices.id` |
| `related_job_id` | uuid | referencia opcional a `jobs.id` |
| `notes` | text | observaciones |
| `attachments` | jsonb | metadatos de archivos almacenados en Supabase Storage |
| `metadata` | jsonb | etiquetas/centros de costo flexibles |
| `created_by` | uuid | usuario que creó el registro |
| `created_at` | timestamptz | por defecto `now()` |
| `updated_at` | timestamptz | actualizado automáticamente |

### Relaciones futuras
- `accounting_budgets` (presupuestos por categoría y mes).
- `accounting_tax_obligations` (vencimientos fiscales).
- `accounting_cashflow_events` (proyecciones).

## Reglas RLS
- Política `select/insert/update/delete` que garantice `company_id = auth.company_id()` usando la función que ya aplica el resto de secciones.
- `created_by` se asigna con el usuario autenticado.

## Servicios auxiliares
- Utilidades en `lib/accounting.ts` para listar, crear, actualizar y eliminar movimientos.
- Funciones de agregación (sumas por tipo, por periodo, cálculo de IVA).
- Validadores (Schema/Zod) para asegurar integridad antes de enviar datos.

## UI propuesta (Next.js / Tailwind)
- Página principal `/accounting` con tabs (`Resumen`, `Movimientos`, `Presupuestos`, `Reportes`, `Impuestos`).
- Tabla filtrable de movimientos con paginación y exportación (CSV futuro).
- Formularios modales para crear/editar movimientos, reutilizando componentes `Modal`, `Input`, `Select`, `DatePicker` existentes.
- Widgets KPI y gráficos (usando patrones de `Dashboard`/`Reports`).
- Logs de depuración controlados por `NODE_ENV` para evitar spinners infinitos; reutilizar el guard `if (!company?.id) return` antes de cada fetch.

## Fase inicial (MVP)
1. Crear migraciones para `accounting_transactions` con RLS.
2. Implementar `AccountingContext` y helpers en `lib/accounting.ts`.
3. Construir `/accounting` con resumen + tabla de movimientos + modal de alta.
4. Integrar nuevo item en el sidebar.
5. Añadir datos demo en empresa de ejemplo.
6. Validar flujos (carga, creación, edición) asegurando performance y logs.

## Evolución
- Presupuestos, forecast y calendario fiscal tras validar la primera iteración.
- Imports CSV, almacenamiento de adjuntos, automatización de reportes y conexión bancaria como backlog.

