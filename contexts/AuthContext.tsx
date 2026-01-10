'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseTable, isAuthError } from '@/lib/supabase'
import type { AuthUser } from '@/types/auth'

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

  // Cargar perfil y empresa del usuario - NUNCA FALLA
  const loadUserProfile = async (userId: string) => {
    try {
      // Estrategia 1: Intentar con join completo
      try {
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

        if (!error && userData) {
          setProfile(userData)

          // Resolver company del join
          const companyFromJoin = Array.isArray((userData as any).company)
            ? (userData as any).company?.[0]
            : (userData as any).company

          if (companyFromJoin?.id) {
            setCompany(companyFromJoin)
            return // Éxito completo
          }

          // Si no hay company en el join pero hay company_id, intentar cargarla
          if (userData.company_id) {
            try {
              const { data: companyData } = await supabaseTable('companies')
                .select('*')
                .eq('id', userData.company_id)
                .single()

              if (companyData) {
                setCompany(companyData)
              }
            } catch (companyError) {
              console.warn('Error loading company separately:', companyError)
              // Continuar sin company
            }
          }
          return // Éxito con perfil (puede que sin company)
        }

        // Si hay error de autenticación, cerrar sesión
        if (error && isAuthError(error)) {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
          return
        }
      } catch (joinError) {
        console.warn('Join query failed, trying fallback:', joinError)
      }

      // Estrategia 2: Cargar usuario sin join
      try {
        const { data: userData, error: userError } = await supabaseTable('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (!userError && userData) {
          setProfile(userData)

          // Intentar cargar company si existe company_id
          if (userData.company_id) {
            try {
              const { data: companyData } = await supabaseTable('companies')
                .select('*')
                .eq('id', userData.company_id)
                .single()

              if (companyData) {
                setCompany(companyData)
              }
            } catch (companyError) {
              console.warn('Error loading company:', companyError)
              // Continuar sin company
            }
          }
          return // Éxito con perfil básico
        }

        if (userError && isAuthError(userError)) {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
          return
        }
      } catch (userError) {
        console.warn('User query failed, trying minimal profile:', userError)
      }

      // Estrategia 3: Crear perfil mínimo desde auth user
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && authUser.id === userId) {
          const minimalProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || undefined,
            first_name: authUser.user_metadata?.first_name,
            last_name: authUser.user_metadata?.last_name,
          }
          setProfile(minimalProfile)
          setCompany(null)
          console.log('✅ Created minimal profile from auth user')
          return // Éxito con perfil mínimo
        }
      } catch (authError) {
        console.warn('Error getting auth user:', authError)
      }

      // Si llegamos aquí, no pudimos cargar nada pero NO fallamos
      // Mantener el estado actual y continuar
      console.warn('⚠️ Could not load profile, but continuing anyway')
      
    } catch (error) {
      // Cualquier error inesperado - NO fallar, solo loguear
      console.error('Unexpected error in loadUserProfile:', error)
      // NO lanzar error, NO bloquear el flujo
    }
  }

  // Escuchar cambios de autenticación - SUPABASE MANEJA TODO
  useEffect(() => {
    // Establecer loading inicial
    setLoading(true)

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadUserProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setUser(null)
        setProfile(null)
        setCompany(null)
        setLoading(false)
      }
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
          return
        }

        if (session.user) {
          setUser(session.user)
          
          // NO bloquear el acceso esperando el perfil
          // Permitir que el usuario acceda inmediatamente
          setLoading(false)
          
          // Cargar perfil en background sin bloquear
          loadUserProfile(session.user.id).catch((error) => {
            console.error('Error loading profile:', error)
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCompany(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuario no autenticado')

    const { error } = await supabaseTable('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      if (isAuthError(error)) {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setCompany(null)
      }
      throw error
    }

    if (user.id) {
      await loadUserProfile(user.id)
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    await loadUserProfile(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        company,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
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
