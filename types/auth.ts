// types/auth.ts
// Tipos de autenticación para Gestiogar

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    [key: string]: any
  }
  app_metadata?: {
    [key: string]: any
  }
  aud?: string
  created_at?: string
  [key: string]: any
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

export interface AuthError {
  message: string
  status?: number
  [key: string]: any
}

