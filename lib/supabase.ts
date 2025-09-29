import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pbdsuhmwxqiwbpgyrhqt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODYyMzMsImV4cCI6MjA3NDY2MjIzM30.u5TqGGpULVAD062GT3zbfdC5RwOrj-jacJhWNSbfqus'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZHN1aG13eHFpd2JwZ3lyaHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4NjIzMywiZXhwIjoyMDc0NjYyMjMzfQ.vZDNEvaGYn4-FAvyym69OQxFZkpc4m1ufcCn45Jn3jE'

// Global instances to prevent multiple GoTrueClient instances
declare global {
  var __supabase: ReturnType<typeof createClient> | undefined
  var __supabaseAdmin: ReturnType<typeof createClient> | undefined
}

export const supabase = globalThis.__supabase ?? (globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}))

export const supabaseAdmin = globalThis.__supabaseAdmin ?? (globalThis.__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}))
