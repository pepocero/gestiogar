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
  X,
  Clock,
  Truck,
  Receipt,
  Building,
  Calculator,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useModules } from '@/contexts/ModulesContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { usePageRefresh } from '@/hooks/usePageRefresh'
// import { useAdvancedModules } from '@/contexts/AdvancedModulesContext' // Temporalmente deshabilitado

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Trabajos', href: '/jobs', icon: Wrench },
  { name: 'Presupuestos', href: '/estimates', icon: FileText },
  { name: 'Facturas', href: '/invoices', icon: DollarSign },
  { name: 'Contabilidad', href: '/accounting', icon: Calculator },
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
  const { modules } = useModules()
  const { sidebarOpen, isDesktop } = useSidebar()
  const { navigateWithRefresh, timeSinceLastActivity } = usePageRefresh({
    inactivityTimeout: 180000, // 3 minutos
    enabled: true
  })
  // Temporalmente deshabilitado - módulos avanzados
  const advancedSidebarItems: any[] = []

  // Función para manejar clicks en el menú
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const inactiveTime = timeSinceLastActivity()
    
    // Si ha estado inactivo más de 2 minutos, hacer hard refresh
    if (inactiveTime > 120000) { // 2 minutos
      e.preventDefault()
      console.log('🔄 Navegación después de inactividad, haciendo hard refresh...')
      window.location.href = href
    }
    // Si no, dejar que Next.js maneje la navegación normalmente
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirigir a la página de bienvenida después de cerrar sesión
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      // Redirigir a la página de bienvenida incluso si hay error
      window.location.href = '/'
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
            {/* Mostrar nombre de empresa solo cuando el sidebar esté visible */}
            {(isDesktop || sidebarOpen) && (
              <>
                <h1 className="text-lg font-semibold text-gray-900">
                  {company?.name || 'Gestiogar'}
                </h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </>
            )}
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
        {/* Navegación principal */}
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              onClick={(e) => {
                handleNavClick(e, item.href)
                onClose && onClose()
              }}
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

        {/* Módulos dinámicos básicos */}
        {modules.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Módulos
            </div>
            {modules.map((module) => {
              const isActive = pathname === `/module/${module.slug}` || pathname.startsWith(`/module/${module.slug}/`)
              
              // Mapear iconos según el slug del módulo
              const getIconComponent = (slug: string) => {
                const iconMap: { [key: string]: any } = {
                  'horarios-empleados': Clock,
                  'vehiculos-servicio': Truck,
                  'gastos-operativos': Receipt,
                  'contactos-proveedores': Building,
                  'inventario-herramientas': Wrench,
                  'holidays-vacations': Calendar,
                  'vehicle-management': Truck,
                  'expense-tracker': Receipt,
                  'gestion-inventario': Package,
                }
                return iconMap[slug] || Package
              }
              
              const IconComponent = getIconComponent(module.slug)
              
              return (
                <Link
                  key={module.id}
                  href={`/module/${module.slug}`}
                  prefetch={false}
                  onClick={(e) => {
                    handleNavClick(e, `/module/${module.slug}`)
                    onClose && onClose()
                  }}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <IconComponent
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    )} 
                  />
                  {module.name}
                </Link>
              )
            })}
          </>
        )}

        {/* Debug: Mostrar información si no hay módulos */}
        {modules.length === 0 && company?.id && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Módulos
            </div>
            <div className="px-3 py-2 text-xs text-gray-400">
              No hay módulos instalados
            </div>
            <div className="px-3 py-1 text-xs text-gray-400">
              <Link href="/debug-modules" className="text-blue-500 hover:text-blue-600">
                Debug módulos
              </Link>
            </div>
          </>
        )}

        {/* Módulos avanzados */}
        {advancedSidebarItems.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Módulos Avanzados
            </div>
            {advancedSidebarItems.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              // Mapear iconos según el nombre del icono del item
              const getIconComponent = (iconName: string) => {
                const iconMap: { [key: string]: any } = {
                  'Wrench': Wrench,
                  'Clock': Clock,
                  'Truck': Truck,
                  'Receipt': Receipt,
                  'Building': Building,
                  'Package': Package,
                  'Users': Users,
                  'Settings': Settings,
                  'FileText': FileText,
                  'BarChart3': BarChart3,
                  'Phone': Phone,
                }
                return iconMap[iconName] || Package
              }
              
              const IconComponent = getIconComponent(item.icon)
              
              return (
                <Link
                  key={`advanced-${index}`}
                  href={item.href}
                  prefetch={false}
                  onClick={() => onClose && onClose()}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <IconComponent
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    )} 
                  />
                  {item.title}
                  {item.badge && (
                    <span className="ml-auto bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </>
        )}
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
