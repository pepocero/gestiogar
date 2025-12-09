// Sistema de logging condicional para optimizar rendimiento
// Solo muestra logs en desarrollo, no en producción

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  // Logs de información general
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  // Logs de éxito
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args)
    }
  },

  // Logs de error (siempre se muestran)
  error: (...args: any[]) => {
    console.error('❌', ...args)
  },

  // Logs de advertencia
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('⚠️', ...args)
    }
  },

  // Logs de debug (solo en desarrollo)
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔍', ...args)
    }
  },

  // Logs de módulos (solo en desarrollo)
  module: (...args: any[]) => {
    if (isDevelopment) {
      console.log('📦', ...args)
    }
  },

  // Logs de actualización (solo en desarrollo)
  update: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔄', ...args)
    }
  },

  // Logs de datos (solo en desarrollo)
  data: (...args: any[]) => {
    if (isDevelopment) {
      console.log('📊', ...args)
    }
  },

  // Logs de configuración (solo en desarrollo)
  config: (...args: any[]) => {
    if (isDevelopment) {
      console.log('⚙️', ...args)
    }
  }
}

// Función para limpiar logs en producción
export const clearLogs = () => {
  if (!isDevelopment) {
    console.clear()
  }
}

// Función para mostrar logs solo si están habilitados
export const conditionalLog = (condition: boolean, ...args: any[]) => {
  if (condition && isDevelopment) {
    console.log(...args)
  }
}
