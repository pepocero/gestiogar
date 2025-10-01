'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { 
  UserProfile, 
  Company, 
  getUserProfile, 
  updateUserProfile,
  signIn as authSignIn,
  signOut as authSignOut,
  resetPassword,
  updatePassword
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  company: Company | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de seguridad para evitar que se quede cargando indefinidamente
    const safetyTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 30000) // 30 segundos máximo

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Si hay una sesión, establecer el usuario y cargar perfil
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id, true) // true = es carga inicial
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCompany(null)
          setLoading(false)
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id, false)
        } else if (event === 'INITIAL_SESSION') {
          // Para la sesión inicial, solo establecer el usuario si existe
          if (session?.user) {
            setUser(session.user)
            await loadUserProfile(session.user.id, false)
          } else {
            setUser(null)
            setProfile(null)
            setCompany(null)
          }
        } else {
          setUser(null)
          setProfile(null)
          setCompany(null)
        }
        
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string, isInitialLoad = false) => {
    try {
      // Timeout más largo para evitar errores en páginas complejas
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading user profile')), 30000)
      )
      
      const userProfile = await Promise.race([
        getUserProfile(userId),
        timeoutPromise
      ]) as UserProfile | null
      
      setProfile(userProfile)
      setCompany(userProfile?.company || null)
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Solo resetear el estado si es la carga inicial, no en recargas automáticas
      if (isInitialLoad) {
        setProfile(null)
        setCompany(null)
      } else {
        // En recargas automáticas, mantener el estado actual si hay un error
        console.warn('Failed to refresh user profile, keeping current state')
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await authSignIn(email, password)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authSignOut()
      // El estado se limpiará automáticamente en onAuthStateChange
    } catch (error) {
      console.error('Error in signOut:', error)
      // Forzar limpieza en caso de error
      setUser(null)
      setProfile(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authSignOut()
      // El estado se limpiará automáticamente en onAuthStateChange
    } catch (error) {
      console.error('Error in logout:', error)
      // Forzar limpieza en caso de error
      setUser(null)
      setProfile(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
    } catch (error) {
      throw error
    }
  }

  const handleUpdatePassword = async (newPassword: string) => {
    try {
      await updatePassword(newPassword)
    } catch (error) {
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const updatedProfile = await updateUserProfile(user.id, updates)
      if (updatedProfile) {
        setProfile(updatedProfile)
        setCompany(updatedProfile.company || null)
      }
      return updatedProfile
    } catch (error) {
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    company,
    loading,
    signIn,
    signOut,
    logout,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
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
