import { supabase, supabaseAdmin } from './supabase'
import { User } from '@supabase/supabase-js'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  tax_id?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  company_id: string
  email: string
  first_name: string
  last_name: string
  role: 'owner' | 'admin' | 'manager' | 'employee'
  phone?: string
  avatar_url?: string
  profile_photo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  company?: Company
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  company: Company | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
}

// Función para crear una nueva empresa y usuario propietario
export async function createCompanyAndOwner(
  companyData: {
    name: string
    slug: string
    address?: string
    phone?: string
    email?: string
    website?: string
    tax_id?: string
  },
  userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }
) {
  try {
    // 1. Crear la empresa usando el service role (bypass RLS)
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([companyData])
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      throw companyError
    }

    // 2. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) {
      // Si falla la creación del usuario, eliminar la empresa
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw authError
    }

    if (!authData.user) {
      // Si no se creó el usuario, eliminar la empresa
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw new Error('No se pudo crear el usuario')
    }

    // 3. Crear el perfil del usuario usando supabaseAdmin (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          company_id: company.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          role: 'owner',
        },
      ])
      .select()
      .single()

    if (profileError) {
      // Si falla la creación del perfil, eliminar empresa
      console.error('Error creating user profile:', profileError)
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw profileError
    }

    // 4. Cerrar sesión automáticamente después de crear el usuario
    // No cerrar sesión aquí para evitar conflictos con onAuthStateChange
    // await supabase.auth.signOut()

    return {
      company,
      user: authData.user,
      profile,
    }
  } catch (error) {
    console.error('Error creating company and owner:', error)
    throw error
  }
}

// Función para obtener el perfil completo del usuario
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('Loading user profile for:', userId)
    
    // OPTIMIZACIÓN: Usar join para evitar múltiples consultas
    // Esto evita el timeout causado por la función user_company_id()
    const { data: result, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', userId)
      .single()

    // Si falla con admin, intentar con cliente normal pero más rápido
    if (error) {
      console.log('Admin query failed, trying normal client...')
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Both queries failed:', userError)
        return null
      }

      // Solo obtener company si user.company_id existe
      if (!user.company_id) {
        console.log('User has no company_id, incomplete profile')
        return null
      }

      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', user.company_id)
        .single()

      if (companyError) {
        console.error('Error fetching company:', companyError)
        return null
      }

      return {
        ...user,
        company: company
      }
    }

    // Si el join funcionó, usar los datos
    const user = result
    const company = (result as any).company

    if (!user.company_id) {
      console.log('User has no company_id, incomplete profile')
      return null
    }

    if (!company) {
      console.error('Company not found in join result')
      return null
    }

    return {
      id: user.id,
      company_id: user.company_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      company: company
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Función para actualizar el perfil del usuario
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Obtener la empresa actualizada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', data.company_id)
      .single()

    if (companyError) {
      console.error('Error fetching company after update:', companyError)
      return null
    }

    return {
      ...data,
      company: company
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return null
  }
}

// Función para actualizar los datos de la empresa
export async function updateCompany(
  companyId: string,
  updates: Partial<Company>
): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateCompany:', error)
    return null
  }
}

// Función para verificar si un slug de empresa está disponible
export async function isCompanySlugAvailable(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error && error.code === 'PGRST116') {
      // No se encontró la empresa, el slug está disponible
      return true
    }

    if (error) {
      console.error('Error checking slug availability:', error)
      return false
    }

    // Se encontró una empresa con este slug
    return false
  } catch (error) {
    console.error('Error in isCompanySlugAvailable:', error)
    return false
  }
}

// Función para generar un slug único
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Eliminar guiones múltiples
    .trim()

  let slug = baseSlug
  let counter = 1
  let attempts = 0
  const maxAttempts = 10 // Limitar intentos para evitar bucles infinitos

  while (!(await isCompanySlugAvailable(slug)) && attempts < maxAttempts) {
    slug = `${baseSlug}-${counter}`
    counter++
    attempts++
  }

  if (attempts >= maxAttempts) {
    // Si llegamos al límite, agregar timestamp para garantizar unicidad
    slug = `${baseSlug}-${Date.now()}`
  }

  return slug
}

// Función para iniciar sesión
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

// Función para cerrar sesión
export async function signOut() {
  try {
    // Verificar si hay una sesión activa antes de intentar cerrar sesión
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } else {
      console.log('No active session found, clearing local state')
    }
  } catch (error) {
    console.error('Error signing out:', error)
    // No relanzar el error si es AuthSessionMissingError
    if (error instanceof Error && error.message.includes('Auth session missing')) {
      console.log('Session already expired, continuing with logout')
      return
    }
    throw error
  }
}

// Función para restablecer contraseña
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

// Función para actualizar contraseña
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating password:', error)
    throw error
  }
}
