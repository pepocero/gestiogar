// Script de diagnóstico para verificar múltiples instancias de Supabase
export function diagnoseSupabaseInstances() {
  if (typeof window === 'undefined') {
    console.log('🔍 Diagnóstico ejecutándose en el servidor')
    return
  }

  console.log('🔍 Diagnóstico de instancias de Supabase:')
  
  // Verificar variables globales
  const hasGlobalSupabase = !!(globalThis as any).__supabaseClient
  const hasGlobalSupabaseAdmin = !!(globalThis as any).__supabaseAdminClient
  const isInitialized = hasGlobalSupabase
  
  console.log('📊 Estado de inicialización:')
  console.log('  - __supabase:', hasGlobalSupabase ? '✅ Presente' : '❌ Ausente')
  console.log('  - __supabaseAdmin:', hasGlobalSupabaseAdmin ? '✅ Presente' : '❌ Ausente')
  console.log('  - __supabaseInitialized:', isInitialized ? '✅ Inicializado' : '❌ No inicializado')
  
  // Verificar localStorage
  const authToken = localStorage.getItem('supabase.auth.token')
  console.log('🔑 Token de autenticación:', authToken ? '✅ Presente' : '❌ Ausente')
  
  // Verificar si hay múltiples listeners de auth
  const authListeners = (window as any).__supabaseAuthListeners || 0
  console.log('👂 Listeners de auth:', authListeners)
  
  // Verificar rendimiento
  const startTime = performance.now()
  const { supabase } = require('@/lib/supabase')
  const endTime = performance.now()
  
  console.log('⏱️ Tiempo de acceso a Supabase:', `${(endTime - startTime).toFixed(2)}ms`)
  
  // Verificar configuración
  console.log('⚙️ Configuración de Supabase:')
  console.log('  - URL:', supabase.supabaseUrl)
  console.log('  - Storage:', supabase.auth.getSession() ? '✅ Configurado' : '❌ No configurado')
  
  return {
    hasGlobalSupabase,
    hasGlobalSupabaseAdmin,
    isInitialized,
    hasAuthToken: !!authToken,
    authListeners,
    accessTime: endTime - startTime
  }
}

// Función para limpiar instancias múltiples (solo para desarrollo)
export function cleanupSupabaseInstances() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Limpieza solo disponible en desarrollo')
    return
  }

  console.log('🧹 Limpiando instancias de Supabase...')
  
  // Limpiar variables globales
  delete (globalThis as any).__supabaseClient
  delete (globalThis as any).__supabaseAdminClient
  
  // Limpiar localStorage
  localStorage.removeItem('supabase.auth.token')
  
  console.log('✅ Limpieza completada')
}
