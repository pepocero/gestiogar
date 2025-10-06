'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // TEMPORAL: Permitir acceso a todas las rutas sin verificación de auth
  // TODO: Restaurar verificación de auth cuando middleware esté listo
  
  return (
    <Layout>
      {children}
    </Layout>
  )
}

