'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, company } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Botón de menú móvil */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Breadcrumb o título de página */}
          <div className="ml-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {company?.name || 'GestioGar'}
            </h1>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar trabajos, clientes, presupuestos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
            <Bell className="h-6 w-6" />
          </button>

          {/* Perfil del usuario */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role}
              </p>
            </div>
            
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
