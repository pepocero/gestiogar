'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { BarChart3, Users, ClipboardList, DollarSign, Wrench, TrendingUp, AlertCircle } from 'lucide-react'
import { getDashboardStats, getRecentActivity } from '@/lib/stats'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface DashboardStats {
  activeJobs: number
  totalClients: number
  monthlyRevenue: number
  pendingEstimates: number
  totalTechnicians: number
  upcomingAppointments: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    pendingEstimates: 0,
    totalTechnicians: 0,
    upcomingAppointments: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity()
      ])
      
      if (statsData) {
        setStats(statsData)
      }
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Vista general de tu empresa</p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

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
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.activeJobs}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalClients}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `€${stats.monthlyRevenue.toLocaleString('es-ES')}`}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.pendingEstimates}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'job' ? 'bg-blue-100' :
                        activity.type === 'estimate' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        {activity.type === 'job' ? (
                          <ClipboardList className="h-4 w-4 text-blue-600" />
                        ) : activity.type === 'estimate' ? (
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">
                          {activity.type === 'job' ? 'Trabajo' : 
                           activity.type === 'estimate' ? 'Presupuesto' : 'Factura'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.title} - {activity.client}
                        </p>
                      </div>
                      <div className="ml-auto text-xs text-gray-500">
                        {activity.amount ? `€${activity.amount.toLocaleString()}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Status Overview */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estado General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {loading ? '...' : stats.totalTechnicians}
                  </div>
                  <div className="text-sm text-gray-600">Técnicos Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {loading ? '...' : stats.upcomingAppointments}
                  </div>
                  <div className="text-sm text-gray-600">Citas Próximas</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={handleNewJob}
                  disabled={loading}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Nuevo Trabajo
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleNewClient}
                  disabled={loading}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleViewReports}
                  disabled={loading}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Reportes
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleNewEstimate}
                  disabled={loading}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
                <Button 
                  className="w-full justify-start" 
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

          {/* System Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Activo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Actualización:</span>
                  <span className="font-medium text-blue-600">
                    {loading ? 'Cargando...' : new Date().toLocaleTimeString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* System Health */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Sistema Principal</span>
                  </div>
                  <span className="text-xs text-green-600">Operativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Módulos Avanzados</span>
                  </div>
                  <span className="text-xs text-blue-600">Activo</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Base de Datos</span>
                  </div>
                  <span className="text-xs text-green-600">Conectada</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
   </div>
  )
}