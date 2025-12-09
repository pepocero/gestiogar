import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbdsuhmwxqiwbpgyrhqt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODYyMzMsImV4cCI6MjA3NDY2MjIzM30.u5TqGGpULVAD062GT3zbfdC5RwOrj-jacJhWNSbfqus'
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4NjIzMywiZXhwIjoyMDc0NjYyMjMzfQ.vZDNEvaGYn4-FAvyym69OQxFZkpc4m1ufcCn45Jn3jE'

const browserKey = supabaseServiceKey || supabaseAnonKey

declare global {
  var __supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | undefined
  var __supabaseAdminClient: ReturnType<typeof createBrowserSupabaseAdminClient> | undefined
}

const isBrowser = typeof window !== 'undefined'

function createBrowserSupabaseClient() {
  const client = createClient(supabaseUrl, browserKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token'
    }
  })

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const currentCount = (window as any).__supabaseInstanceCount ?? 0
    const newCount = currentCount + 1
    ;(window as any).__supabaseInstanceCount = newCount
    if (newCount > 1) {
      console.warn('⚠️ Se ha creado una nueva instancia de Supabase en el navegador')
    }
  }

  return client
}

function createBrowserSupabaseAdminClient() {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'supabase.admin.token'
    }
  })

  return client
}

function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

function createServerSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

const supabase = isBrowser
  ? (globalThis.__supabaseClient ??= createBrowserSupabaseClient())
  : createServerSupabaseClient()

const supabaseAdmin = isBrowser
  ? supabase
  : createServerSupabaseAdminClient()

export { supabase, supabaseAdmin }

// Helper para detectar errores de autenticación
export const isAuthError = (error: any): boolean => {
  if (!error) return false
  const errorCode = error.code || error.status
  const errorMessage = (error.message || '').toLowerCase()
  
  // Códigos de error de Supabase/PostgREST relacionados con autenticación
  return (
    errorCode === 401 ||
    errorCode === 'PGRST301' ||
    errorCode === 'PGRST302' ||
    errorMessage.includes('jwt') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('unauthorized')
  )
}

// Helper para obtener builders sin tipado estricto generado (evita errores TS con `never`)
export const supabaseTable = (table: string) => (supabase.from(table) as any)
export const supabaseAdminTable = (table: string) => (supabaseAdmin.from(table) as any)
