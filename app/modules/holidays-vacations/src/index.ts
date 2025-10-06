// app/modules/holidays-vacations/src/index.ts
// Este archivo es parte del sistema legacy de módulos y no se usa actualmente
// Se mantiene para compatibilidad pero no se exporta

/* 
import { Module } from '@/types/modules/module'
import { HolidaysService } from './services/holidaysService'
import { VacationsService } from './services/vacationsService'
import { useHolidays } from './hooks/useHolidays'
import { useVacations } from './hooks/useVacations'

const module: Module = {
  name: 'holidays-vacations',
  version: '1.0.0',
  
  // Servicios principales del módulo
  services: {
    holiday: HolidaysService,
    vacation: VacationsService
  },
  
  // Hooks disponibles
  hooks: {
    useHolidays,
    useVacations
  },
  
  // Middlewares de hook
  middleware: {
    'sidebar_menu': () => ({
      title: 'Días Festivos y Vacaciones',
      icon: 'Calendar',
      href: '/holidays',
      badge: 'pending_vacations_count',
      children: [
        {
          title: 'Días Festivos',
          href: '/holidays',
          icon: 'Calendar'
        },
        {
          title: 'Vacaciones',
          href: '/vacations',
          icon: 'Plane'
        },
        {
          title: 'Calendario',
          href: '/vacations/calendario',
          icon: 'Calendar'
        }
      ]
    }),
    
    'dashboard_widgets': () => ({
      component: 'HolidaysWidget',
      priority: 3,
      props: {
        title: 'Próximos Días Festivos',
        showNext: 3
      }
    }),
    
    'after_create_holiday': (data) => {
      console.log('Nuevo día festivo creado:', data)
      // Aquí se puede agregar lógica adicional como notificaciones
    },
    
    'before_delete_holiday': (id) => {
      // Lógica antes de eliminar día festivo
      return true // Permitir eliminación
    },

    'vacation_request_created': (data) => {
      console.log('Nueva solicitud de vacaciones:', data)
      // Notificar a supervisores sobre nueva solicitud
    },

    'vacation_request_approved': (data) => {
      console.log('Solicitud de vacaciones aprobada:', data)
      // Actualizar calendario y notificar al empleado
    }
  },
  
  // Inicialización del módulo
  init: () => {
    console.log('Módulo Días Festivos y Vacaciones inicializado')
    
    // Crear días festivos nacionales por defecto si no existen
    const defaultHolidays = [
      { nombre: 'Año Nuevo', fecha: '2024-01-01', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Día de los Reyes Magos', fecha: '2024-01-06', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Día de San José', fecha: '2024-03-19', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Jueves Santo', fecha: '2024-03-28', tipo: 'festivo_nacional', repetir_anual: false },
      { nombre: 'Viernes Santo', fecha: '2024-03-29', tipo: 'festivo_nacional', repetir_anual: false },
      { nombre: 'Día del Trabajador', fecha: '2024-05-01', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Día de la Madre', fecha: '2024-05-12', tipo: 'festivo_nacional', repetir_anual: false },
      { nombre: 'Día del Padre', fecha: '2024-06-16', tipo: 'festivo_nacional', repetir_anual: false },
      { nombre: 'San Pedro y San Pablo', fecha: '2024-06-29', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Independencia de Colombia', fecha: '2024-07-20', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Batalla de Boyacá', fecha: '2024-08-07', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Asunción de la Virgen', fecha: '2024-08-19', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Día de la Raza', fecha: '2024-10-14', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Todos los Santos', fecha: '2024-11-04', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Independencia de Cartagena', fecha: '2024-11-11', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Inmaculada Concepción', fecha: '2024-12-08', tipo: 'festivo_nacional', repetir_anual: true },
      { nombre: 'Navidad', fecha: '2024-12-25', tipo: 'festivo_nacional', repetir_anual: true }
    ]

    // Esta lógica se ejecutará cuando el módulo se instale por primera vez
    // Los días festivos se crearán automáticamente
  }
}

export default module
*/

// Export vacío para evitar errores de compilación
export default {}

