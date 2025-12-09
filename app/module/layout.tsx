'use client'

import React from 'react'

interface ModuleLayoutProps {
  children: React.ReactNode
}

export default function ModuleLayout({ children }: ModuleLayoutProps) {
  // No envolver con Layout adicional ya que el ProtectedLayout ya lo incluye
  return <>{children}</>
}