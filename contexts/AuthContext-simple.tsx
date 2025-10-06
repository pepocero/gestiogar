'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types/auth'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_id?: string
  profile_photo_url?: string
  job_title?: string
}

interface Company {
  id: string
  name: string
  slug: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Versión simplificada de loadUserProfile sin timeouts complejos
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading user profile for:', userId)
      
      // Query directa simple sin timeout
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('⚠️ Could not load user profile:', error.message)
        // Si no puede cargar el perfil, usar datos básicos del usuario auth
        const authUser = (await supabase.auth.getUser()).data.user
        if (authUser) {
          setProfile({
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name,
            last_name: authUser.user_metadata?.last_name,
          })
        }
        return
      }

      console.log('✅ User profile loaded successfully')
      setProfile(userData)
      setCompany(userData.company || null)
      
    } catch (error) {
      console.warn('⚠️ Error loading user profile:', error)
      // No mostrar error toast para evitar spam
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Obtener sesión inicial
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Solo escuchar cambios de auth, sin verificación periódica
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('🔄 Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCompany(null)
          toast.success('Sesión cerrada')
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // Solo cargar perfil si no está ya cargado
          if (!profile || profile.id !== session.user.id) {
            await loadUserProfile(session.user.id)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
    await supabase.auth.signOut()
    // El estado se actualizará automáticamente por onAuthStateChange
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Recargar perfil
    await loadUserProfile(user.id)
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

