'use client'

// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Shield, ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
          {/* Botón de volver */}
          <div className="flex items-center">
            <Link
              href="/settings"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Configuración
            </Link>
          </div>

          <div className="flex items-center mb-8">
            <Shield className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seguridad</h1>
              <p className="text-gray-600 mt-1">
                Configura las opciones de seguridad de tu cuenta
              </p>
            </div>
          </div>

          <Card className="app-card">
            <CardHeader>
              <div className="flex items-center">
                <Construction className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Sección en Desarrollo</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Construction className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Próximamente
                </h3>
                <p className="text-gray-600">
                  Las opciones de seguridad estarán disponibles en una próxima actualización
                </p>
                `<div className="mt-6 text-sm text-gray-500">
                  <p>• Cambio de contraseña</p>
                  <p>• Autenticación de dos factores</p>
                  <p>• Historial de sesiones</p>
                  <p>• Configuración de privacidad</p>
                </div>`
              </div>
            </CardBody>
          </Card>
        </div>
  )
}
