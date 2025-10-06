'use client'

import React from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Bell, ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsSettingsPage() {
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

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="text-gray-600 mt-2">
          Configura cómo recibes las notificaciones del sistema
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Configuración de Notificaciones
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-gray-600">
              Esta funcionalidad estará disponible próximamente. 
              Podrás configurar:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Notificaciones por email</li>
              <li>Alertas en tiempo real</li>
              <li>Resúmenes diarios y semanales</li>
              <li>Notificaciones móviles</li>
            </ul>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Construction className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  En Desarrollo
                </h3>
                <p className="text-blue-700 text-sm">
                  Estamos trabajando en esta funcionalidad.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
