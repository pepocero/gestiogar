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
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
          setCompany(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId)
      setProfile(userProfile)
      setCompany(userProfile?.company || null)
    } catch (error) {
      console.error('Error loading user profile:', error)
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
      setUser(null)
      setProfile(null)
      setCompany(null)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authSignOut()
      setUser(null)
      setProfile(null)
      setCompany(null)
    } catch (error) {
      throw error
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
