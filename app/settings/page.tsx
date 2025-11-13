'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
// Layout ya se aplica automáticamente en ProtectedLayout
import { 
  User, 
  Building2, 
  Shield, 
  Bell, 
  Package,
  Settings as SettingsIcon,
  LogOut,
  Crown
} from 'lucide-react'

export default function SettingsPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada correctamente')
      router.push('/auth/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }
  const settingsItems = [
    {
      title: 'Perfil de Usuario',
      description: 'Configura tu información personal y preferencias',
      icon: User,
      href: '/settings/profile',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Empresa',
      description: 'Gestiona la información de tu empresa y logo',
      icon: Building2,
      href: '/settings/company',
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Módulos',
      description: 'Gestiona módulos adicionales y expande las funcionalidades',
      icon: Package,
      href: '/settings/modules',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Seguridad',
      description: 'Configura contraseñas y opciones de seguridad',
      icon: Shield,
      href: '/settings/security',
      color: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Notificaciones',
      description: 'Configura cómo recibes las notificaciones',
      icon: Bell,
      href: '/settings/notifications',
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Suscripción',
      description: 'Gestiona tu plan y límites de uso',
      icon: Crown,
      href: '/settings/subscription',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
          <div className="flex items-center mb-8">
            <div className="flex items-center">
              <SettingsIcon className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                <p className="text-gray-600 mt-1">
                  Administra tu cuenta y configuración del sistema
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="app-card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <div className="p-6">
                    <div className={`flex items-center justify-center w-12 h-12 ${item.color} rounded-lg mb-4`}>
                      <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="app-card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acceso Rápido
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/settings/profile" className="text-primary-600 hover:text-primary-700 font-medium">
                  → Editar Perfil
                </Link>
                <Link href="/settings/modules" className="text-primary-600 hover:text-primary-700 font-medium">
                  → Gestionar Módulos
                </Link>
                <Link href="/settings/company" className="text-primary-600 hover:text-primary-700 font-medium">
                  → Configurar Empresa
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 font-medium text-left"
                >
                  → Cerrar Sesión
                </button>
              </div>
            </div>
          </Card>
        </div>
  )
}