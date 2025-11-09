import { createClient } from '@supabase/supabase-js'

// Usar variables de entorno de Cloudflare Pages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbdsuhmwxqiwbpgyrhqt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODYyMzMsImV4cCI6MjA3NDY2MjIzM30.u5TqGGpULVAD062GT3zbfdC5RwOrj-jacJhWNSbfqus'
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4NjIzMywiZXhwIjoyMDc0NjYyMjMzfQ.vZDNEvaGYn4-FAvyym69OQxFZkpc4m1ufcCn45Jn3jE'

// Global instances to prevent multiple GoTrueClient instances
declare global {
  var __supabase: any | undefined
  var __supabaseAdmin: any | undefined
  var __supabaseInitialized: boolean | undefined
}

// Almacenamiento en memoria para instancias que no deben persistir sesión
function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    }
  }
}

// Función para crear el cliente con configuración optimizada
function createSupabaseClient(url: string, key: string, options: any = {}) {
  const isBrowser = typeof window !== 'undefined'

  const defaultAuthOptions = {
    flowType: 'pkce',
    debug: false,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(isBrowser
      ? {
          storage: window.localStorage,
          storageKey: 'supabase.auth.token'
        }
      : {})
  }

  const finalAuthOptions = {
    ...defaultAuthOptions,
    ...(options?.auth || {})
  }

  if (!isBrowser && finalAuthOptions.storage === undefined) {
    delete finalAuthOptions.storage
  }

  return createClient(url, key, {
    ...options,
    auth: finalAuthOptions
  })
}

// Función para inicializar Supabase solo una vez
function initializeSupabase() {
  if (typeof window === 'undefined') {
    // En el servidor, crear instancias nuevas cada vez
    return {
      supabase: createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // No persistir en servidor
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: createMemoryStorage(),
          storageKey: 'supabase.server.auth.token'
        }
      }),
      supabaseAdmin: createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: createMemoryStorage(),
          storageKey: 'supabase.server.admin.token'
        }
      })
    }
  }

  // En el cliente, usar singleton pattern ESTRICTO
  if (!globalThis.__supabaseInitialized) {
    // Limpiar cualquier instancia previa
    if (globalThis.__supabase) {
      try {
        globalThis.__supabase.removeAllChannels?.()
      } catch (e) {
        // Ignorar errores de limpieza
      }
    }

    globalThis.__supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token'
      }
    })
    
    globalThis.__supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: createMemoryStorage(),
        storageKey: 'supabase.admin.token'
      }
    })
    
    globalThis.__supabaseInitialized = true
    
    // Marcar en window para debugging
    if (process.env.NODE_ENV === 'development') {
      (window as any).__supabaseInstanceCount = 1
    }
  } else {
    // Incrementar contador de advertencia en desarrollo
    if (process.env.NODE_ENV === 'development') {
      (window as any).__supabaseInstanceCount = ((window as any).__supabaseInstanceCount || 1) + 1
      if ((window as any).__supabaseInstanceCount > 1) {
        console.warn('⚠️ Intento de crear múltiples instancias de Supabase detectado y prevenido')
      }
    }
  }

  return {
    supabase: globalThis.__supabase,
    supabaseAdmin: globalThis.__supabaseAdmin
  }
}

// Inicializar y exportar las instancias
const { supabase, supabaseAdmin } = initializeSupabase()

export { supabase, supabaseAdmin }
