// Configuración de rendimiento para la aplicación
export const PERFORMANCE_CONFIG = {
  // Configuración de caché
  CACHE: {
    // Tiempo de vida del caché en milisegundos
    STALE_TIME: 30000, // 30 segundos
    // Intervalo de refetch en milisegundos
    REFETCH_INTERVAL: 300000, // 5 minutos
    // Tiempo máximo de espera para requests
    REQUEST_TIMEOUT: 10000, // 10 segundos
  },
  
  // Configuración de sesión
  SESSION: {
    // Intervalo de verificación de sesión en milisegundos
    CHECK_INTERVAL: 60000, // 1 minuto
    // Tiempo antes de mostrar warning de sesión expirada
    WARNING_TIME: 300000, // 5 minutos
  },
  
  // Configuración de logs
  LOGGING: {
    // Solo mostrar logs en desarrollo
    ENABLED: process.env.NODE_ENV === 'development',
    // Nivel de log mínimo
    MIN_LEVEL: 'error', // 'debug', 'info', 'warn', 'error'
  },
  
  // Configuración de Supabase
  SUPABASE: {
    // Configuración de conexión
    CONNECTION_POOL_SIZE: 10,
    // Timeout de conexión
    CONNECTION_TIMEOUT: 5000,
    // Reintentos automáticos
    AUTO_RETRY: true,
    MAX_RETRIES: 3,
    // Configuración para evitar múltiples instancias
    SINGLETON_MODE: true,
    // Verificar inicialización
    CHECK_INITIALIZATION: true,
  }
}

// Función para verificar si estamos en desarrollo
export const isDevelopment = () => process.env.NODE_ENV === 'development'

// Función para verificar si estamos en producción
export const isProduction = () => process.env.NODE_ENV === 'production'

// Función para logging condicional
export const conditionalLog = (level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]) => {
  if (!PERFORMANCE_CONFIG.LOGGING.ENABLED) return
  
  const levels = ['debug', 'info', 'warn', 'error']
  const currentLevel = levels.indexOf(level)
  const minLevel = levels.indexOf(PERFORMANCE_CONFIG.LOGGING.MIN_LEVEL)
  
  if (currentLevel >= minLevel) {
    console[level](...args)
  }
}
