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

  // Ref para evitar múltiples cargas simultáneas del mismo perfil
  const loadingProfileRef = useRef<string | null>(null)
  
  // Versión optimizada de loadUserProfile con caché y mejor manejo de errores
  const loadUserProfile = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      // Evitar múltiples cargas simultáneas del mismo usuario
      if (loadingProfileRef.current === userId && !forceRefresh) {
        conditionalLog('debug', '🔄 Profile already loading for user:', userId)
        return
      }
      
      // Solo cargar si no está ya cargado o si es un usuario diferente, a menos que se fuerce la recarga
      if (!forceRefresh && profileRef.current && profileRef.current.id === userId) {
        conditionalLog('debug', '🔄 User profile already loaded, skipping...')
        return
      }

      // Marcar que estamos cargando este perfil
      loadingProfileRef.current = userId
      conditionalLog('debug', '🔄 Loading user profile for:', userId)
      
      // Query optimizada - incluir información de suscripción
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
      
      // Fallback: establecer perfil mínimo con datos del usuario auth para evitar loop infinito
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setProfile({
            id: authUser.id,
            email: authUser.email || undefined,
            first_name: authUser.user_metadata?.first_name,
            last_name: authUser.user_metadata?.last_name,
          })
          setCompany(null)
          console.log('✅ Fallback profile set for user:', authUser.id)
        }
      } catch (fallbackError) {
        console.error('⚠️ Error in fallback profile setup:', fallbackError)
        // Si incluso el fallback falla, no hacer nada más
        // El finally en onAuthStateChange establecerá loading=false
      }
      
      // No mostrar error toast para evitar spam
    } finally {
      // Limpiar la marca de carga cuando termine (exitoso o con error)
      if (loadingProfileRef.current === userId) {
        loadingProfileRef.current = null
      }
    }
  }, [handleSessionExpired])

  // Ref para evitar múltiples cargas simultáneas del mismo perfil
  const processingInitialSessionRef = useRef(false)
  const initialSessionHandledRef = useRef(false)

  useEffect(() => {
    let mounted = true

    // Función simple para manejar la carga del perfil cuando hay una sesión
    const handleSession = async (session: any) => {
      if (!session?.user || !mounted) {
        if (mounted) {
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
        }
        return
      }

      const userId = session.user.id

      // Evitar múltiples procesamientos simultáneos
      if (processingInitialSessionRef.current) {
        conditionalLog('debug', '🔄 Already processing session, skipping...')
        return
      }

      // Verificar si el perfil ya está cargado
      if (profileRef.current && profileRef.current.id === userId) {
        conditionalLog('debug', '✅ Profile already loaded, skipping...')
        if (mounted) {
          setUser(session.user)
          setLoading(false)
        }
        return
      }

      // Verificar si ya se está cargando este perfil
      if (loadingProfileRef.current === userId) {
        conditionalLog('debug', '🔄 Profile already loading, skipping...')
        return
      }

      processingInitialSessionRef.current = true

      try {
        if (mounted) {
          setUser(session.user)
          setLoading(true)
        }

        await loadUserProfile(userId)
      } catch (error) {
        console.warn('⚠️ Error loading profile:', error)
        // Continuar aunque falle
      } finally {
        processingInitialSessionRef.current = false
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Configurar el listener de auth state - SUPABASE YA MANEJA TODO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!mounted) return

        conditionalLog('debug', '🔄 Auth state change:', event, session?.user?.id)

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null)
            setProfile(null)
            profileRef.current = null
            setCompany(null)
            setLoading(false)
            processingInitialSessionRef.current = false
            initialSessionHandledRef.current = false
            break

          case 'INITIAL_SESSION':
            // Solo manejar INITIAL_SESSION una vez por recarga
            if (initialSessionHandledRef.current) {
              conditionalLog('debug', '🔄 INITIAL_SESSION already handled, skipping...')
              return
            }
            initialSessionHandledRef.current = true
            
            if (session?.user) {
              await handleSession(session)
            } else if (mounted) {
              setUser(null)
              setProfile(null)
              setCompany(null)
              setLoading(false)
            }
            break

          case 'SIGNED_IN':
            // Solo manejar SIGNED_IN si no es la sesión inicial (ya manejada)
            if (initialSessionHandledRef.current) {
              conditionalLog('debug', '🔄 SIGNED_IN ignored (initial session already handled)')
              return
            }
            
            if (session?.user) {
              await handleSession(session)
            }
            break

          case 'TOKEN_REFRESHED':
            // Solo actualizar el usuario si cambia, NO hacer nada más
            // NO cambiar loading aquí para evitar loops
            if (session?.user && mounted) {
              // Solo actualizar si el ID del usuario cambió
              setUser((prevUser) => {
                if (!prevUser || prevUser.id !== session.user.id) {
                  return session.user
                }
                return prevUser
              })
            }
            break

          default:
            // Para otros eventos, no hacer nada
            break
        }
      }
    )

    // Obtener sesión inicial - pero solo si INITIAL_SESSION no se dispara
    // Esperar un poco para ver si INITIAL_SESSION se dispara primero
    const initTimeout = setTimeout(() => {
      if (!mounted || initialSessionHandledRef.current) {
        return
      }

      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted || initialSessionHandledRef.current) return

        if (error) {
          console.warn('⚠️ Error getting initial session:', error)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setCompany(null)
            setLoading(false)
            initialSessionHandledRef.current = true
          }
          return
        }

        // Solo manejar si INITIAL_SESSION no se disparó
        if (session?.user) {
          conditionalLog('debug', '⚠️ INITIAL_SESSION not fired, using getSession() fallback')
          initialSessionHandledRef.current = true
          handleSession(session)
        } else if (mounted) {
          setLoading(false)
          initialSessionHandledRef.current = true
        }
      })
    }, 100) // Esperar solo 100ms - INITIAL_SESSION debería dispararse casi inmediatamente

    return () => {
      mounted = false
      processingInitialSessionRef.current = false
      clearTimeout(initTimeout)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Array vacío - solo ejecutar una vez al montar

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
      setLoading(true) // Establecer loading en true para evitar estados intermedios
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut()
      
      // Pequeño delay para asegurar que el estado se limpie completamente
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // El estado ya se limpió arriba, pero onAuthStateChange también lo manejará
      setLoading(false)
    } catch (error) {
      console.error('Error en signOut:', error)
      // Asegurarse de limpiar el estado incluso si hay error
      setUser(null)
      setProfile(null)
      profileRef.current = null
      setCompany(null)
      setLoading(false)
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

