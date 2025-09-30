import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pbdsuhmwxqiwbpgyrhqt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODYyMzMsImV4cCI6MjA3NDY2MjIzM30.u5TqGGpULVAD062GT3zbfdC5RwOrj-jacJhWNSbfqus'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4NjIzMywiZXhwIjoyMDc0NjYyMjMzfQ.vZDNEvaGYn4-FAvyym69OQxFZkpc4m1ufcCn45Jn3jE'

// Global instances to prevent multiple GoTrueClient instances
declare global {
  var __supabase: any | undefined
  var __supabaseAdmin: any | undefined
}

// Función para crear el cliente con configuración optimizada
function createSupabaseClient(url: string, key: string, options: any) {
  return createClient(url, key, {
    ...options,
    auth: {
      ...options.auth,
      // Configuración adicional para evitar múltiples instancias
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
      // Evitar múltiples instancias
      debug: false
    }
  })
}

export const supabase = globalThis.__supabase ?? (globalThis.__supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}))

export const supabaseAdmin = globalThis.__supabaseAdmin ?? (globalThis.__supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}))
