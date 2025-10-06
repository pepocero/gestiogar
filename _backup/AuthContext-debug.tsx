'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_id: string | null
  company?: {
    id: string
    name: string
    address: string | null
    phone: string | null
    email: string | null
    logo_url: string | null
  } | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  company: UserProfile['company']
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<UserProfile['company']>(null)
  const [loading, setLoading] = useState(true)

  // Versión simplificada y más robusta de loadUserProfile
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔍 [DEBUG] Loading user profile for:', userId)
      
      // Intentar obtener usuario directamente sin joins complejos
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.log('❌ [DEBUG] User not found:', userError.message)
        return null
      }

      if (!userData) {
        console.log('❌ [DEBUG] No user data returned')
        return null
      }

      console.log('✅ [DEBUG] User found:', userData.email)

      // Si no tiene company_id, crear un perfil básico
      if (!userData.company_id) {
        console.log('⚠️ [DEBUG] User has no company_id - creating basic profile')
        return {
          ...userData,
          company: null
        }
      }

      // Obtener company si tiene company_id
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .single()

      if (companyError) {
        console.log('⚠️ [DEBUG] Company not found:', companyError.message)
        // Usar usuario sin company en lugar de fallar
        return {
          ...userData,
          company: null
        }
      }

      console.log('✅ [DEBUG] Company found:', companyData.name)
      
      const completeProfile = {
        ...userData,
        company: companyData
      }

      return completeProfile

    } catch (error) {
      console.error('❌ [DEBUG] Exception in loadUserProfile:', error)
      return null
    }
  }

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
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // El estado se actualizará automáticamente por onAuthStateChange
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🚀 [DEBUG] Initializing auth...')
        
        // Obtener sesión inicial
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          console.log('✅ [DEBUG] Initial session found:', session.user.id)
          setUser(session.user)
          
          const profileData = await loadUserProfile(session.user.id)
          if (profileData && mounted) {
            setProfile(profileData)
            setCompany(profileData.company || null)
            console.log('✅ [DEBUG] Profile loaded successfully')
          } else {
            console.log('⚠️ [DEBUG] Could not load profile, but continuing...')
          }
        } else {
          console.log('ℹ️ [DEBUG] No initial session')
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error initializing auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🏁 [DEBUG] Auth initialization complete')
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('🔄 [DEBUG] Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCompany(null)
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user)
            
            const profileData = await loadUserProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
              setCompany(profileData.company || null)
              console.log('🎉 [DEBUG] Profile loaded on auth change')
            } else {
              console.log('⚠️ [DEBUG] Could not load profile on auth change')
            }
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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

