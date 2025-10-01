'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Home,
  Users,
  Building2,
  Wrench,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  User,
  Package,
  Phone,
  BarChart3,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Trabajos', href: '/jobs', icon: Wrench },
  { name: 'Presupuestos', href: '/estimates', icon: FileText },
  { name: 'Facturas', href: '/invoices', icon: DollarSign },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Técnicos', href: '/technicians', icon: User },
  { name: 'Aseguradoras', href: '/insurance', icon: Building2 },
  { name: 'Proveedores', href: '/suppliers', icon: Package },
  { name: 'Materiales', href: '/materials', icon: Package },
  { name: 'Citas', href: '/appointments', icon: Calendar },
  { name: 'Comunicaciones', href: '/communications', icon: Phone },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { company, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-full">
      {/* Logo y nombre de la empresa */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-12 h-12 rounded-lg object-cover shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">
                {company?.name?.charAt(0) || 'G'}
              </span>
            </div>
          )}
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {company?.name || 'GestioGar'}
            </h1>
            <p className="text-xs text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
        
        {/* Botón cerrar en móvil */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose && onClose()}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Usuario y cerrar sesión */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleSignOut}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
