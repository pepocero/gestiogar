'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { BarChart3, Users, ClipboardList, DollarSign, Wrench, TrendingUp } from 'lucide-react'
import { getDashboardStats, getRecentActivity } from '@/lib/stats'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const { company } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    pendingEstimates: 0,
    totalTechnicians: 0,
    upcomingAppointments: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar datos una sola vez cuando company esté disponible
  useEffect(() => {
    if (!company?.id) return

    let mounted = true
    setLoading(true)

    Promise.all([
      getDashboardStats(company.id),
      getRecentActivity(company.id)
    ])
      .then(([statsData, activityData]) => {
        if (!mounted) return
        if (statsData) setStats(statsData)
        setRecentActivity(activityData || [])
      })
      .catch((error) => {
        console.error('Error loading dashboard:', error)
        if (!error?.message?.includes('session') && !error?.message?.includes('auth')) {
          toast.error('Error al cargar datos')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [company?.id])

  const handleNewJob = () => router.push('/jobs')
  const handleNewClient = () => router.push('/clients')
  const handleViewReports = () => router.push('/reports')
  const handleNewEstimate = () => router.push('/estimates')
  const handleManageTechnicians = () => router.push('/technicians')

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Vista general de tu empresa</p>
        </div>
      </div>

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
                <p className="text-2xl font-bold text-gray-900">
                  €{stats.monthlyRevenue.toLocaleString('es-ES')}
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
                <p className="text-2xl font-bold text-gray-900">{stats.pendingEstimates}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start" onClick={handleNewJob}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Nuevo Trabajo
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleNewClient}>
                  <Users className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleViewReports}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Reportes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleNewEstimate}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleManageTechnicians}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Gestionar Técnicos
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
