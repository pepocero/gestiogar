import { supabase, supabaseAdmin } from '@/lib/supabase'

// Hook para obtener la instancia de Supabase de forma segura
export function useSupabase() {
  return {
    supabase,
    supabaseAdmin
  }
}

// Función para obtener Supabase de forma segura (para uso fuera de componentes)
export function getSupabase() {
  return {
    supabase,
    supabaseAdmin
  }
}

// Función para verificar si Supabase está inicializado correctamente
export function isSupabaseInitialized(): boolean {
  if (typeof window === 'undefined') {
    return true // En el servidor siempre está inicializado
  }
  
  return !!(globalThis as any).__supabaseInitialized
}
