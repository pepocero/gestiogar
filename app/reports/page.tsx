'use client'

import { useState, useEffect } from 'react'
// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download,
  FileText,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Building2,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseTable } from '@/lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface ReportStats {
  totalRevenue: number
  totalJobs: number
  totalClients: number
  totalTechnicians: number
  totalInvoices: number
  totalEstimates: number
  totalAppointments: number
  totalCommunications: number
  completedJobs: number
  pendingJobs: number
  activeClients: number
  monthlyRevenue: number
  growthRate: number
}

interface ChartData {
  name: string
  value: number
  color?: string
  [key: string]: any
}

export default function ReportsPage() {
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalJobs: 0,
    totalClients: 0,
    totalTechnicians: 0,
    totalInvoices: 0,
    totalEstimates: 0,
    totalAppointments: 0,
    totalCommunications: 0,
    completedJobs: 0,
    pendingJobs: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    growthRate: 0
  })

  const [jobStatusData, setJobStatusData] = useState<ChartData[]>([])
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<ChartData[]>([])
  const [clientTypeData, setClientTypeData] = useState<ChartData[]>([])
  const [technicianPerformanceData, setTechnicianPerformanceData] = useState<ChartData[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

useEffect(() => {
  if (!company?.id) {
    setLoading(false)
    return
  }

  loadReportData()
}, [company?.id])

  const loadReportData = async () => {
    if (!company) return

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Reports] loadReportData start', company.id)
      }
      setLoading(true)

      // Cargar estadísticas básicas
      const [
        jobsResult,
        clientsResult,
        techniciansResult,
        invoicesResult,
        estimatesResult,
        appointmentsResult,
        communicationsResult
      ] = await Promise.all([
        supabaseTable('jobs').select('*').eq('company_id', company.id),
        supabaseTable('clients').select('*').eq('company_id', company.id),
        supabaseTable('technicians').select('*').eq('company_id', company.id),
        supabaseTable('invoices').select('*').eq('company_id', company.id),
        supabaseTable('estimates').select('*').eq('company_id', company.id),
        supabaseTable('appointments').select('*').eq('company_id', company.id),
        supabaseTable('communications').select('*').eq('company_id', company.id)
      ])

      const jobs = jobsResult.data || []
      const clients = clientsResult.data || []
      const technicians = techniciansResult.data || []
      const invoices = invoicesResult.data || []
      const estimates = estimatesResult.data || []
      const appointments = appointmentsResult.data || []
      const communications = communicationsResult.data || []

      // Calcular estadísticas
      const totalRevenue = invoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0)
      const completedJobs = jobs.filter((job: any) => job.status === 'completed').length
      const pendingJobs = jobs.filter((job: any) => job.status === 'pending').length
      const activeClients = clients.filter((client: any) => client.is_active).length

      // Calcular ingresos del mes actual
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = invoices
        .filter((invoice: any) => {
          const invoiceDate = new Date(invoice.created_at)
          return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear
        })
        .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0)

      // Calcular tasa de crecimiento (comparar con mes anterior)
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      const lastMonthRevenue = invoices
        .filter((invoice: any) => {
          const invoiceDate = new Date(invoice.created_at)
          return invoiceDate.getMonth() === lastMonth && invoiceDate.getFullYear() === lastMonthYear
        })
        .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0)

      const growthRate = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      setStats({
        totalRevenue,
        totalJobs: jobs.length,
        totalClients: clients.length,
        totalTechnicians: technicians.length,
        totalInvoices: invoices.length,
        totalEstimates: estimates.length,
        totalAppointments: appointments.length,
        totalCommunications: communications.length,
        completedJobs,
        pendingJobs,
        activeClients,
        monthlyRevenue,
        growthRate
      })

      // Preparar datos para gráficos
      prepareChartData(jobs, clients, technicians, invoices)

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Reports] loadReportData success', {
          companyId: company.id,
          totals: {
            jobs: jobs.length,
            clients: clients.length,
            technicians: technicians.length,
            invoices: invoices.length,
            estimates: estimates.length,
            appointments: appointments.length,
            communications: communications.length
          }
        })
      }

    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Reports] loadReportData finished', company.id)
      }
    }
  }

  const prepareChartData = (jobs: any[], clients: any[], technicians: any[], invoices: any[]) => {
    // Datos de estado de trabajos - solo incluir categorías con datos
    const jobStatusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const jobStatusData = [
      { name: 'Completados', value: jobStatusCounts.completed || 0, color: '#10B981' },
      { name: 'En Progreso', value: jobStatusCounts.in_progress || 0, color: '#F59E0B' },
      { name: 'Pendientes', value: jobStatusCounts.pending || 0, color: '#3B82F6' },
      { name: 'Cancelados', value: jobStatusCounts.cancelled || 0, color: '#EF4444' }
    ].filter(item => item.value > 0) // Solo mostrar categorías con datos

    setJobStatusData(jobStatusData)

    // Datos de tipo de cliente - solo incluir categorías con datos
    const clientTypeCounts = clients.reduce((acc, client) => {
      const type = client.client_type === 'insurance' ? 'Aseguradora' : 'Directo'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const clientTypeData = [
      { name: 'Aseguradoras', value: clientTypeCounts.Aseguradora || 0, color: '#3B82F6' },
      { name: 'Clientes Directos', value: clientTypeCounts.Directo || 0, color: '#10B981' }
    ].filter(item => item.value > 0) // Solo mostrar categorías con datos

    setClientTypeData(clientTypeData)

    // Datos de rendimiento de técnicos (trabajos completados por técnico)
    const technicianPerformance = technicians.map(tech => {
      const techJobs = jobs.filter(job => job.technician_id === tech.id)
      const completedJobs = techJobs.filter(job => job.status === 'completed').length
      return {
        name: `${tech.first_name} ${tech.last_name}`,
        value: completedJobs,
        color: COLORS[technicians.indexOf(tech) % COLORS.length]
      }
    }).filter(tech => tech.value > 0)

    setTechnicianPerformanceData(technicianPerformance)

    // Datos de ingresos mensuales (últimos 6 meses)
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' })
      
      const monthRevenue = invoices
        .filter((invoice: any) => {
          const invoiceDate = new Date(invoice.created_at)
          return invoiceDate.getMonth() === date.getMonth() && 
                 invoiceDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0)

      monthlyData.push({
        name: monthName,
        value: monthRevenue,
        color: COLORS[i % COLORS.length]
      })
    }

    setMonthlyRevenueData(monthlyData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const exportToPDF = async () => {
    try {
      setIsExporting(true)
      
      const element = document.getElementById('reports-content')
      if (!element) {
        toast.error('No se pudo encontrar el contenido para exportar')
        return
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `reporte-${company?.name || 'empresa'}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      toast.success('Reporte exportado como PDF exitosamente')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error('Error al exportar el reporte como PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    try {
      setIsExporting(true)

      // Crear datos para Excel
      const excelData = [
        ['REPORTE DE EMPRESA', company?.name || 'Empresa'],
        ['Fecha de generación', new Date().toLocaleDateString('es-ES')],
        [''],
        ['ESTADÍSTICAS PRINCIPALES'],
        ['Ingresos Totales', formatCurrency(stats.totalRevenue)],
        ['Trabajos Completados', stats.completedJobs],
        ['Clientes Activos', stats.activeClients],
        ['Crecimiento Mensual', formatPercentage(stats.growthRate)],
        [''],
        ['ESTADÍSTICAS SECUNDARIAS'],
        ['Total Técnicos', stats.totalTechnicians],
        ['Total Facturas', stats.totalInvoices],
        ['Total Presupuestos', stats.totalEstimates],
        ['Total Citas', stats.totalAppointments],
        ['Total Comunicaciones', stats.totalCommunications],
        ['Trabajos Pendientes', stats.pendingJobs],
        ['Ingresos del Mes', formatCurrency(stats.monthlyRevenue)],
        [''],
        ['ESTADO DE TRABAJOS'],
        ['Completados', jobStatusData.find(item => item.name === 'Completados')?.value || 0],
        ['En Progreso', jobStatusData.find(item => item.name === 'En Progreso')?.value || 0],
        ['Pendientes', jobStatusData.find(item => item.name === 'Pendientes')?.value || 0],
        ['Cancelados', jobStatusData.find(item => item.name === 'Cancelados')?.value || 0],
        [''],
        ['DISTRIBUCIÓN DE CLIENTES'],
        ['Aseguradoras', clientTypeData.find(item => item.name === 'Aseguradoras')?.value || 0],
        ['Clientes Directos', clientTypeData.find(item => item.name === 'Clientes Directos')?.value || 0],
        [''],
        ['INGRESOS MENSUALES (Últimos 6 meses)'],
        ...monthlyRevenueData.map(item => [item.name, formatCurrency(item.value)]),
        [''],
        ['RENDIMIENTO DE TÉCNICOS'],
        ...technicianPerformanceData.map(item => [item.name, item.value])
      ]

      const ws = XLSX.utils.aoa_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

      const fileName = `reporte-${company?.name || 'empresa'}-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast.success('Reporte exportado como Excel exitosamente')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Error al exportar el reporte como Excel')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportReport = () => {
    setShowExportModal(true)
  }

  const handleExportFormat = (format: 'pdf' | 'excel') => {
    setShowExportModal(false)
    if (format === 'pdf') {
      exportToPDF()
    } else {
      exportToExcel()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Cargando reportes...</p>
      </div>
    )
  }

  return (
    <div id="reports-content" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
              <p className="text-gray-600">Análisis y estadísticas de tu empresa</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={handleExportReport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar Reporte'}
            </Button>
          </div>

          {/* Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Trabajos Completados</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedJobs}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeClients}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Crecimiento Mensual</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatPercentage(stats.growthRate)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Estadísticas Secundarias */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardBody className="text-center">
                <Wrench className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Técnicos</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalTechnicians}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Facturas</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalInvoices}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Presupuestos</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalEstimates}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Citas</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalAppointments}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <MessageSquare className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Comunicaciones</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalCommunications}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-lg font-semibold text-gray-900">{stats.completedJobs}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-lg font-semibold text-gray-900">{stats.pendingJobs}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Este Mes</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              </CardBody>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Estado de Trabajos */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Estado de Trabajos</h3>
              </CardHeader>
              <CardBody>
                {jobStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={jobStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }: any) => 
                          value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {jobStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No hay datos de trabajos disponibles</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Gráfico de Tipo de Clientes */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Distribución de Clientes</h3>
              </CardHeader>
              <CardBody>
                {clientTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={clientTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }: any) => 
                          value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {clientTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No hay datos de clientes disponibles</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Gráfico de Ingresos Mensuales */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Ingresos Mensuales (Últimos 6 Meses)</h3>
            </CardHeader>
            <CardBody>
              {monthlyRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `€${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Ingresos']} />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay datos de ingresos disponibles</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Gráfico de Rendimiento de Técnicos */}
          {technicianPerformanceData.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Rendimiento de Técnicos</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={technicianPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Modal de Exportación */}
          <Modal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            title="Exportar Reporte"
            size="md"
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecciona el formato de exportación
                </h3>
                <p className="text-sm text-gray-600">
                  Elige cómo quieres descargar tu reporte
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Opción PDF */}
                <button
                  onClick={() => handleExportFormat('pdf')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="font-medium text-gray-900">Exportar como PDF</h4>
                    <p className="text-sm text-gray-600">
                      Descarga el reporte completo con gráficos y diseño visual
                    </p>
                  </div>
                </button>

                {/* Opción Excel */}
                <button
                  onClick={() => handleExportFormat('excel')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="font-medium text-gray-900">Exportar como Excel</h4>
                    <p className="text-sm text-gray-600">
                      Descarga los datos en formato de hoja de cálculo para análisis
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        </div>
  )
}
