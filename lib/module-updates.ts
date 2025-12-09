// Configuración centralizada de módulos y sus versiones
// Este archivo debe ser actualizado cada vez que se modifique un módulo

export interface ModuleUpdate {
  slug: string
  version: string
  config: any
  changelog?: string[]
}

export const MODULE_UPDATES: ModuleUpdate[] = [
  {
    slug: 'holidays-vacations',
    version: '1.1.0',
    config: {
      title: 'Días Festivos y Vacaciones',
      description: 'Administra los días festivos y vacaciones de tu equipo',
      icon: 'Calendar',
      fields: [
        {
          name: 'tecnico',
          label: 'Técnico',
          type: 'select',
          required: true,
          dynamic: true,
          source: 'technicians',
          options: [
            { value: 'todos', label: 'Todos los técnicos' }
          ]
        },
        {
          name: 'tipo',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'festivo', label: 'Día Festivo Nacional' },
            { value: 'local', label: 'Día Festivo Local' },
            { value: 'empresa', label: 'Día Festivo de Empresa' },
            { value: 'vacaciones', label: 'Vacaciones' }
          ]
        },
        {
          name: 'nombre',
          label: 'Nombre del Día Festivo',
          type: 'text',
          required: true
        },
        {
          name: 'fecha_inicio',
          label: 'Fecha de Inicio',
          type: 'date',
          required: true
        },
        {
          name: 'fecha_fin',
          label: 'Fecha de Fin',
          type: 'date',
          required: false
        },
        {
          name: 'repetir_anual',
          label: 'Repetir Anualmente',
          type: 'boolean',
          required: false
        },
        {
          name: 'descripcion',
          label: 'Descripción',
          type: 'textarea',
          required: false
        }
      ]
    },
    changelog: [
      'v1.1.0 - Agregado campo dinámico de técnicos',
      'v1.1.0 - Agregado tipo "Vacaciones"',
      'v1.1.0 - Agregado campo de fecha fin',
      'v1.1.0 - Mejorada la interfaz de usuario'
    ]
  },
  {
    slug: 'vehicle-management',
    version: '1.2.1',
    config: {
      title: 'Vehículos',
      description: 'Gestiona tu flota de vehículos de servicio',
      icon: 'Truck',
      fields: [
        {
          name: 'marca',
          label: 'Marca',
          type: 'text',
          required: true
        },
        {
          name: 'modelo',
          label: 'Modelo',
          type: 'text',
          required: true
        },
        {
          name: 'placa',
          label: 'Placa',
          type: 'text',
          required: true
        },
        {
          name: 'año',
          label: 'Año',
          type: 'number',
          required: true
        },
        {
          name: 'tipo_combustible',
          label: 'Tipo de Combustible',
          type: 'select',
          required: true,
          options: [
            { value: 'gasolina', label: 'Gasolina' },
            { value: 'diesel', label: 'Diésel' },
            { value: 'electrico', label: 'Eléctrico' },
            { value: 'hibrido', label: 'Híbrido' }
          ]
        },
        {
          name: 'tecnico',
          label: 'Técnico Asignado',
          type: 'select',
          required: true,
          dynamic: true,
          source: 'technicians',
          options: [
            { value: 'sin_asignar', label: 'Sin asignar' }
          ]
        }
      ]
    },
    changelog: [
      'v1.2.1 - Agregado campo "Técnico Asignado" obligatorio',
      'v1.2.1 - Campo dinámico que se llena desde la tabla technicians',
      'v1.2.1 - Opción "Sin asignar" para vehículos no asignados'
    ]
  }
  // Aquí se pueden agregar más módulos y sus actualizaciones
]

// Función para obtener la configuración más reciente de un módulo
export function getLatestModuleConfig(slug: string): ModuleUpdate | null {
  return MODULE_UPDATES.find(update => update.slug === slug) || null
}

// Función para obtener todas las actualizaciones disponibles
export function getAllModuleUpdates(): ModuleUpdate[] {
  return MODULE_UPDATES
}
