'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, supabaseTable, isAuthError } from '@/lib/supabase'
import type { AuthUser } from '@/types/auth'
import toast from 'react-hot-toast'
import { PERFORMANCE_CONFIG, conditionalLog } from '@/lib/performance'
import type { CompanySubscription } from '@/lib/subscription'

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_id?: string
  profile_photo_url?: string
  job_title?: string
  role?: string
}

interface Company {
  id: string
  name: string
  slug: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  website?: string
  tax_id?: string
  subscription_plan?: 'free' | 'pro'
  subscription_status?: 'active' | 'cancelled' | 'expired'
  subscription_started_at?: string | null
  subscription_ends_at?: string | null
  paypal_subscription_id?: string | null
  paypal_customer_id?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  company: Company | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Ref para evitar re-crear loadUserProfile cuando profile cambia
  const profileRef = useRef<UserProfile | null>(null)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // Función para limpiar sesión y redirigir al login
  const handleSessionExpired = useCallback(async () => {
    console.warn('⚠️ Session expired, signing out...')
    setUser(null)
    setProfile(null)
    profileRef.current = null
    setCompany(null)
    
    // Solo redirigir si no estamos ya en la página de login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      await supabase.auth.signOut()
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
      window.location.href = '/auth/login'
    } else {
      await supabase.auth.signOut()
    }
  }, [])

  // Versión optimizada de loadUserProfile con caché y mejor manejo de errores
  const loadUserProfile = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      // Solo cargar si no está ya cargado o si es un usuario diferente, a menos que se fuerce la recarga
      if (!forceRefresh && profileRef.current && profileRef.current.id === userId) {
        conditionalLog('debug', '🔄 User profile already loaded, skipping...')
        return
      }

      conditionalLog('debug', '🔄 Loading user profile for:', userId)
      
      // Query optimizada con timeout - incluir información de suscripción
      const { data: userData, error } = await supabaseTable('users')
        .select(`
          *,
          company:companies(
            id,
            name,
            slug,
            address,
            phone,
            email,
            logo_url,
            website,
            tax_id,
            subscription_plan,
            subscription_status,
            subscription_started_at,
            subscription_ends_at,
            paypal_subscription_id,
            paypal_customer_id
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        // Si es un error de autenticación, la sesión expiró
        if (isAuthError(error)) {
          await handleSessionExpired()
          return
        }
        
        console.warn('⚠️ Could not load user profile:', error.message)
        // Si no puede cargar el perfil, intentar usar el usuario auth y luego obtener el perfil mínimo (incluye company_id)
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        // Si también falla getUser, la sesión expiró
        if (authError || !authUser) {
          await handleSessionExpired()
          return
        }
        
        // Intentar obtener el perfil mínimo desde la tabla users para resolver company_id
        try {
          const { data: minimalProfile, error: minimalError } = await supabaseTable('users')
            .select('id, email, first_name, last_name, phone, company_id, role, profile_photo_url')
            .eq('id', userId)
            .single()

          if (!minimalError && minimalProfile) {
            setProfile(minimalProfile)

            if (minimalProfile.company_id) {
              const { data: companyData, error: companyError } = await supabaseTable('companies')
                .select(`
                  id,
                  name,
                  slug,
                  address,
                  phone,
                  email,
                  logo_url,
                  website,
                  tax_id,
                  subscription_plan,
                  subscription_status,
                  subscription_started_at,
                  subscription_ends_at,
                  paypal_subscription_id,
                  paypal_customer_id
                `)
                .eq('id', minimalProfile.company_id)
                .single()

              if (!companyError && companyData) {
                setCompany(companyData)
              } else {
                console.warn('⚠️ Could not load company for user:', companyError?.message)
                setCompany(null)
              }
            } else {
              setCompany(null)
            }

            return
          }
        } catch (e) {
          console.warn('⚠️ Error loading minimal profile:', e)
        }

        // Fallback final: datos básicos del usuario auth (sin empresa)
        setProfile({
          id: authUser.id,
          email: authUser.email || undefined,
          first_name: authUser.user_metadata?.first_name,
          last_name: authUser.user_metadata?.last_name,
        })
        setCompany(null)
        return
      }

      conditionalLog('debug', '✅ User profile loaded successfully')
      setProfile(userData)

      // Resolver company de forma robusta (join puede venir como objeto, array o null)
      const companyFromJoin = Array.isArray((userData as any).company)
        ? (userData as any).company?.[0]
        : (userData as any).company

      if (companyFromJoin?.id) {
        setCompany(companyFromJoin)
        return
      }

      // Fallback: si tenemos company_id, cargar la empresa directamente
      const companyId = (userData as any).company_id
      if (companyId) {
        const { data: companyData, error: companyError } = await supabaseTable('companies')
          .select(`
            id,
            name,
            slug,
            address,
            phone,
            email,
            logo_url,
            website,
            tax_id,
            subscription_plan,
            subscription_status,
            subscription_started_at,
            subscription_ends_at,
            paypal_subscription_id,
            paypal_customer_id
          `)
          .eq('id', companyId)
          .single()

        if (!companyError && companyData) {
          setCompany(companyData)
        } else {
          console.warn('⚠️ Could not load company for user:', companyError?.message)
          setCompany(null)
        }
      } else {
        setCompany(null)
      }
      
    } catch (error: any) {
      console.warn('⚠️ Error loading user profile:', error)
      
      // Si es un error de autenticación, la sesión expiró
      if (isAuthError(error)) {
        await handleSessionExpired()
        return
      }
      
      // No mostrar error toast para evitar spam
    }
  }, [handleSessionExpired])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Si hay error al obtener la sesión, limpiar estado
        if (error) {
          console.warn('⚠️ Error getting session:', error)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setCompany(null)
            setLoading(false)
          }
          return
        }
        
        if (session?.user && mounted) {
          setUser(session.user)
          // Cargar perfil con timeout para evitar que se quede colgado
          try {
            await Promise.race([
              loadUserProfile(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout loading profile')), 10000)
              )
            ])
          } catch (profileError) {
            console.warn('⚠️ Error or timeout loading profile:', profileError)
            // Continuar aunque falle la carga del perfil
          }
        } else if (mounted) {
          // No hay sesión, limpiar estado
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de auth con verificación de sesión expirada
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        conditionalLog('debug', '🔄 Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          profileRef.current = null
          setCompany(null)
          setLoading(false)
          // No mostrar toast aquí porque handleLogout ya lo muestra
          // Evitar doble mensaje
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Mantener loading=true hasta que el perfil/empresa estén listos
          setLoading(true)
          setUser(session.user)
          try {
          // Solo cargar perfil si no está ya cargado (usar profileRef para evitar problemas de closures)
          if (!profileRef.current || profileRef.current.id !== session.user.id) {
            await loadUserProfile(session.user.id)
            }
          } finally {
            setLoading(false)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refrescado automáticamente
          conditionalLog('debug', '🔄 Token refreshed successfully')
          // Verificar que la sesión sigue válida después del refresh
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()
          if (error || !currentSession) {
            // Si después del refresh no hay sesión, limpiar estado
            console.warn('⚠️ Session invalid after token refresh')
            await handleSessionExpired()
          }
        }
      }
    )

    // DESACTIVADO: Verificación periódica innecesaria con Supabase
    // Supabase maneja automáticamente el refresh de tokens y detecta sesiones expiradas
    // a través de onAuthStateChange. No necesitamos polling manual.
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile, handleSessionExpired])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  const signOut = async () => {
    try {
      // Limpiar estado inmediatamente para una respuesta más rápida
      setUser(null)
      setProfile(null)
      profileRef.current = null
      setCompany(null)
      
      // Cerrar sesión en Supabase
    await supabase.auth.signOut()
      // El estado ya se limpió arriba, pero onAuthStateChange también lo manejará
    } catch (error) {
      console.error('Error en signOut:', error)
      // Asegurarse de limpiar el estado incluso si hay error
      setUser(null)
      setProfile(null)
      profileRef.current = null
      setCompany(null)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabaseTable('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      // Si es un error de autenticación, la sesión expiró
      if (isAuthError(error)) {
        await handleSessionExpired()
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }
      throw error
    }

    // Recargar perfil
    await loadUserProfile(user.id)
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    // Limpiar el caché antes de recargar
    profileRef.current = null
    await loadUserProfile(user.id, true)
  }

  const value = {
    user,
    profile,
    company,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
