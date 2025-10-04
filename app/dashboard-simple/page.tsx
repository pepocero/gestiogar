'use client'

import React, { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { BarChart3, Users, ClipboardList, DollarSign, Wrench, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardSimplePage() {
  const router = useRouter()
  const { user, profile, company, loading } = useAuth()

  // Datos de ejemplo SIN consultas a base de datos
  const stats = {
    activeJobs: 5,
    totalClients: 23,
    monthlyRevenue: 12500,
    pendingEstimates: 8,
    totalTechnicians: 3,
    upcomingAppointments: 12
  }

  const recentActivity = [
    { id: '1', type: 'job', title: 'Reparación de tubería', client: 'Juan Pérez', amount: 150 },
    { id: '2', type: 'estimate', title: 'Estimación de obra', client: 'María García', amount: null },
    { id: '3', type: 'invoice', title: 'Factura #001', client: 'Carlos López', amount: 280 }
  ]

  // Funciones de acciones rápidas
  const handleNewJob = () => {
    router.push('/jobs')
    toast.success('Redirigiendo a Trabajos...')
  }

  const handleNewClient = () => {
    router.push('/clients')
    toast.success('Redirigiendo a Clientes...')
  }

  const handleViewReports = () => {
    router.push('/reports')
    toast.success('Redirigiendo a Reportes...')
  }

  const handleNewEstimate = () => {
    router.push('/estimates')
    toast.success('Redirigiendo a Presupuestos...')
  }

  const handleManageTechnicians = () => {
    router.push('/technicians')
    toast.success('Redirigiendo a Técnicos...')
  }

  // Estado de debug
  console.log('🔍 [DASHBOARD SIMPLE] Loading:', loading)
  console.log('🔍 [DASHBOARD SIMPLE] User:', user?.id)
  console.log('🔍 [DASHBOARD SIMPLE] Profile:', profile?.id)
  console.log('🔍 [DASHBOARD SIMPLE] Company:', company?.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Simple 
            {loading && <span className="text-sm text-gray-500 ml-2">(Cargando...)</span>}
          </h1>
          <p className="text-gray-600">
            {company ? `Empresa: ${company.name}` : 'Sin empresa asignada'}
          </p>
        </div>
        <Button disabled={loading}>
          Datos Estáticos
        </Button>
      </div>

      {/* Debug Info */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-2">Estado de Debug:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Loading:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${loading ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {loading ? 'SÍ' : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Usuario:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user ? user.email : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Perfil:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${profile ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {profile ? profile.first_name : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Empresa:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${company ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {company ? company.name : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trabajos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.monthlyRevenue.toLocaleString('es-ES')}</p>
              </div>  
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Presupuestos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingEstimates}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              className="justify-start" 
              onClick={handleNewJob}
              disabled={loading}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Nuevo Trabajo
            </Button>
            <Button 
              className="justify-start" 
              variant="outline"
              onClick={handleNewClient}
              disabled={loading}
            >
              <Users className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
            <Button 
              className="justify-start" 
              variant="outline"
              onClick={handleViewReports}
              disabled={loading}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Reportes
            </Button>
            <Button 
              className="justify-start" 
              variant="outline"
              onClick={handleNewEstimate}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
            <Button 
              className="justify-start" 
              variant="outline"
              onClick={handleManageTechnicians}
              disabled={loading}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Gestionar Técnicos
            </Button>
          </div>
        </div>
      </Card>

      <div className="text-center pt-8">
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ← Volver al Dashboard Principal
        </a>
      </div>
    </div>
  )
}

