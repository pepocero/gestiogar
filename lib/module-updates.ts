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
