'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import {
  Wrench,
  FileText,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface DashboardStats {
  totalJobs: number
  pendingJobs: number
  completedJobs: number
  totalEstimates: number
  pendingEstimates: number
  totalInvoices: number
  pendingInvoices: number
  totalClients: number
  totalTechnicians: number
  todayAppointments: number
  monthlyRevenue: number
  pendingPayments: number
}

interface RecentJob {
  id: string
  job_number: string
  title: string
  status: string
  client_name: string
  scheduled_date: string
  priority: string
}

export default function DashboardPage() {
  const { company, profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company) {
      loadDashboardData()
    }
  }, [company])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas
      const [
        jobsResult,
        estimatesResult,
        invoicesResult,
        clientsResult,
        techniciansResult,
        appointmentsResult
      ] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, status, total_cost')
          .eq('company_id', company!.id),
        supabase
          .from('estimates')
          .select('id, status, total_amount')
          .eq('company_id', company!.id),
        supabase
          .from('invoices')
          .select('id, status, total_amount, paid_date')
          .eq('company_id', company!.id),
        supabase
          .from('clients')
          .select('id')
          .eq('company_id', company!.id),
        supabase
          .from('technicians')
          .select('id')
          .eq('company_id', company!.id)
          .eq('is_active', true),
        supabase
          .from('appointments')
          .select('id, scheduled_date')
          .eq('company_id', company!.id)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .lt('scheduled_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ])

      const jobs = jobsResult.data || []
      const estimates = estimatesResult.data || []
      const invoices = invoicesResult.data || []
      const clients = clientsResult.data || []
      const technicians = techniciansResult.data || []
      const appointments = appointmentsResult.data || []

      // Calcular estadísticas
      const totalJobs = jobs.length
      const pendingJobs = jobs.filter((j: any) => j.status === 'pending' || j.status === 'scheduled').length
      const completedJobs = jobs.filter((j: any) => j.status === 'completed').length
      
      const totalEstimates = estimates.length
      const pendingEstimates = estimates.filter((e: any) => e.status === 'draft' || e.status === 'sent').length
      
      const totalInvoices = invoices.length
      const pendingInvoices = invoices.filter((i: any) => i.status === 'sent' || i.status === 'draft').length
      
      const monthlyRevenue = invoices
        .filter((i: any) => i.paid_date && new Date(i.paid_date).getMonth() === new Date().getMonth())
        .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0)
      
      const pendingPayments = invoices
        .filter((i: any) => i.status === 'sent')
        .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0)

      setStats({
        totalJobs,
        pendingJobs,
        completedJobs,
        totalEstimates,
        pendingEstimates,
        totalInvoices,
        pendingInvoices,
        totalClients: clients.length,
        totalTechnicians: technicians.length,
        todayAppointments: appointments.length,
        monthlyRevenue,
        pendingPayments
      })

      // Cargar trabajos recientes
      const { data: recentJobsData } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          title,
          status,
          scheduled_date,
          priority,
          clients!inner(first_name, last_name)
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentJobsData) {
        setRecentJobs(recentJobsData.map((job: any) => ({
          id: job.id,
          job_number: job.job_number,
          title: job.title,
          status: job.status,
          client_name: job.clients ? `${job.clients[0]?.first_name || ''} ${job.clients[0]?.last_name || ''}`.trim() : 'Sin cliente',
          scheduled_date: job.scheduled_date,
          priority: job.priority
        })))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'Pendiente' },
      scheduled: { variant: 'info' as const, label: 'Programado' },
      in_progress: { variant: 'info' as const, label: 'En Progreso' },
      completed: { variant: 'success' as const, label: 'Completado' },
      cancelled: { variant: 'danger' as const, label: 'Cancelado' },
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'gray' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      emergency: { variant: 'danger' as const, label: 'Emergencia' },
      urgent: { variant: 'warning' as const, label: 'Urgente' },
      normal: { variant: 'info' as const, label: 'Normal' },
    }
    
    const config = priorityMap[priority as keyof typeof priorityMap] || { variant: 'gray' as const, label: priority }
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Bienvenido, {profile?.first_name}. Aquí tienes un resumen de tu empresa.
            </p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wrench className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Trabajos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalJobs || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Presupuestos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalEstimates || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Facturas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalInvoices || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Clientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalClients || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Estadísticas secundarias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pendientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.pendingJobs || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completados</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.completedJobs || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Citas Hoy</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.todayAppointments || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ingresos Mes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{stats?.monthlyRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Trabajos recientes */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Trabajos Recientes</h3>
            </CardHeader>
            <CardBody>
              {recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {job.job_number} - {job.title}
                          </h4>
                          {getStatusBadge(job.status)}
                          {getPriorityBadge(job.priority)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Cliente: {job.client_name}
                        </p>
                        {job.scheduled_date && (
                          <p className="text-sm text-gray-500">
                            Programado: {new Date(job.scheduled_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay trabajos recientes
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}