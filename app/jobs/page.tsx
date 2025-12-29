'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// Layout ya se aplica automáticamente en ProtectedLayout
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { supabase, supabaseTable } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Wrench, Eye, Calendar, User, MapPin, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

interface Job {
  id: string
  job_number: string
  title: string
  description: string
  job_type: string
  priority: string
  status: string
  category: string
  scheduled_date: string
  start_date: string
  completion_date: string
  estimated_hours: number
  actual_hours: number
  total_cost: number
  labor_cost: number
  materials_cost: number
  notes: string
  created_at: string
  updated_at: string
  client_id: string
  technician_id: string
  insurance_company_id: string
  clients: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address: string
  }
  technicians: {
    first_name: string
    last_name: string
    phone: string
  } | null
  insurance_companies: {
    name: string
  } | null
}

export default function JobsPage() {
  const { company, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingJob, setViewingJob] = useState<Job | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    job_type: '',
    priority: '',
    client_id: '',
    technician_id: ''
  })
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const loadingRef = useRef(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'repair',
    priority: 'normal',
    category: '',
    client_id: '',
    technician_id: '',
    insurance_company_id: '',
    scheduled_date: '',
    estimated_hours: 0,
    notes: '',
  })

  const loadJobs = useCallback(async () => {
    if (!company?.id || loadingRef.current) return
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadJobs start', company?.id)
      }
      loadingRef.current = true
      setLoading(true)
      
      // Obtener límites del plan
      const limits = await getPlanLimits(company!.id)
      
      let query = supabase
        .from('jobs')
        .select(`
          *,
          clients!inner(first_name, last_name, email, phone, address),
          technicians(first_name, last_name, phone),
          insurance_companies(name)
        `)
        .eq('company_id', company!.id)
      
      // Aplicar límite según el plan
      query = applyPlanLimit(query, limits.max_jobs, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setJobs(data || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadJobs success', {
          companyId: company?.id,
          count: data?.length || 0,
          limit: limits.max_jobs
        })
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Error al cargar los trabajos')
    } finally {
      setLoading(false)
      loadingRef.current = false
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadJobs finished', company?.id)
      }
    }
  }, [company?.id])

  const loadClients = useCallback(async () => {
    if (!company?.id) return
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadClients start', company?.id)
      }
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .eq('company_id', company.id)
        .order('first_name')

      if (error) {
        throw error
      }

      setClients(data || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadClients success', {
          companyId: company?.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }, [company?.id])

  const loadTechnicians = useCallback(async () => {
    if (!company?.id) return
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadTechnicians start', company?.id)
      }
      const { data, error } = await supabase
        .from('technicians')
        .select('id, first_name, last_name, phone, specialties')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('first_name')

      if (error) {
        throw error
      }

      setTechnicians(data || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadTechnicians success', {
          companyId: company?.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }, [company?.id])

  const loadInsuranceCompanies = useCallback(async () => {
    if (!company?.id) return
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadInsuranceCompanies start', company?.id)
      }
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      setInsuranceCompanies(data || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Jobs] loadInsuranceCompanies success', {
          companyId: company?.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading insurance companies:', error)
    }
  }, [company?.id])

  useEffect(() => {
    if (!authLoading && company?.id && !loadingRef.current) {
      loadJobs()
      loadClients()
      loadTechnicians()
      loadInsuranceCompanies()
    } else if (!authLoading && !company?.id) {
      setLoading(false)
    }
  }, [authLoading, company?.id, loadJobs, loadClients, loadTechnicians, loadInsuranceCompanies])

  // Filtrar trabajos
  const applyFilters = () => {
    let filtered = jobs

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.job_number.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.clients?.first_name?.toLowerCase().includes(searchLower) ||
        job.clients?.last_name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status)
    }

    if (filters.job_type) {
      filtered = filtered.filter(job => job.job_type === filters.job_type)
    }

    if (filters.priority) {
      filtered = filtered.filter(job => job.priority === filters.priority)
    }

    if (filters.client_id) {
      filtered = filtered.filter(job => job.client_id === filters.client_id)
    }

    if (filters.technician_id) {
      filtered = filtered.filter(job => job.technician_id === filters.technician_id)
    }

    setFilteredJobs(filtered)
  }

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [jobs, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      job_type: '',
      priority: '',
      client_id: '',
      technician_id: ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const generateJobNumber = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `JOB-${year}${month}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      const jobNumber = generateJobNumber()

      // Limpiar campos UUID vacíos
      const cleanFormData = {
        ...formData,
        client_id: formData.client_id && formData.client_id.trim() !== '' ? formData.client_id : null,
        technician_id: formData.technician_id && formData.technician_id.trim() !== '' ? formData.technician_id : null,
        insurance_company_id: formData.insurance_company_id && formData.insurance_company_id.trim() !== '' ? formData.insurance_company_id : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours.toString()) : null,
      }

      if (editingJob) {
        // Actualizar trabajo existente
        const { error } = await supabaseTable('jobs')
          .update(cleanFormData)
          .eq('id', editingJob.id)

        if (error) {
          throw error
        }

        toast.success('Trabajo actualizado correctamente')
      } else {
        // Verificar límite antes de crear
        const canCreate = await canCreateItem(company.id, 'max_jobs')
        if (!canCreate.allowed) {
          toast.error(`Has alcanzado el límite de ${canCreate.limit} trabajos. Actualiza a Gestiogar Pro para crear más.`, {
            duration: 6000
          })
          return
        }

        // Crear nuevo trabajo
        const { error } = await supabaseTable('jobs')
          .insert([{
            ...cleanFormData,
            job_number: jobNumber,
            company_id: company.id
          }])

        if (error) {
          throw error
        }

        toast.success('Trabajo creado correctamente')
      }

      setShowModal(false)
      setEditingJob(null)
      resetForm()
      loadJobs()
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Error al guardar el trabajo')
    }
  }

  const handleEdit = (job: Job) => {
    setEditingJob(job)
    
    // Formatear la fecha para datetime-local (yyyy-MM-ddThh:mm)
    let formattedDate = ''
    if (job.scheduled_date) {
      const date = new Date(job.scheduled_date)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setFormData({
      title: job.title,
      description: job.description,
      job_type: job.job_type,
      priority: job.priority,
      category: job.category,
      client_id: job.client_id || '',
      technician_id: job.technician_id || '',
      insurance_company_id: job.insurance_company_id || '',
      scheduled_date: formattedDate,
      estimated_hours: job.estimated_hours,
      notes: job.notes,
    })
    setShowModal(true)
  }

  const handleDelete = (job: Job) => {
    setJobToDelete(job)
    setShowDeleteModal(true)
  }

  const handleView = (job: Job) => {
    setViewingJob(job)
    setShowViewModal(true)
  }

  const confirmDelete = async () => {
    if (!jobToDelete) return

    try {
      const { error } = await supabaseTable('jobs')
        .delete()
        .eq('id', jobToDelete.id)

      if (error) {
        throw error
      }

      toast.success('Trabajo eliminado correctamente')
      setShowDeleteModal(false)
      setJobToDelete(null)
      loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Error al eliminar el trabajo')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'in_progress') {
        updateData.start_date = new Date().toISOString()
      } else if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString()
      }

      const { error } = await supabaseTable('jobs')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Estado actualizado correctamente')
      loadJobs()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      job_type: 'repair',
      priority: 'normal',
      category: '',
      client_id: '',
      technician_id: '',
      insurance_company_id: '',
      scheduled_date: '',
      estimated_hours: 0,
      notes: '',
    })
  }

  const handleNewJob = () => {
    setEditingJob(null)
    resetForm()
    setShowModal(true)
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

  const getJobTypeBadge = (jobType: string) => {
    const typeMap = {
      repair: { variant: 'info' as const, label: 'Reparación' },
      renovation: { variant: 'success' as const, label: 'Reforma' },
      emergency: { variant: 'danger' as const, label: 'Emergencia' },
    }
    
    const config = typeMap[jobType as keyof typeof typeMap] || { variant: 'gray' as const, label: jobType }
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SubscriptionBanner />
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Trabajos
            </h1>
            <p className="text-gray-600">
              Gestiona las órdenes de trabajo y reparaciones.
            </p>
          </div>
          <Button onClick={handleNewJob} className="flex items-center space-x-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Nuevo Trabajo</span>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="app-card">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </CardHeader>
          <CardBody>
            <div className="filter-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  placeholder="Título, número, cliente..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="form-label">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="form-label">Tipo</label>
                <select
                  value={filters.job_type}
                  onChange={(e) => handleFilterChange('job_type', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los tipos</option>
                  <option value="repair">Reparación</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="installation">Instalación</option>
                  <option value="inspection">Inspección</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="form-label">Prioridad</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todas las prioridades</option>
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label className="form-label">Cliente</label>
                <select
                  value={filters.client_id}
                  onChange={(e) => handleFilterChange('client_id', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Técnico */}
              <div>
                <label className="form-label">Técnico</label>
                <select
                  value={filters.technician_id}
                  onChange={(e) => handleFilterChange('technician_id', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los técnicos</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="text-sm"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Lista de trabajos */}
        <Card className="app-card">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Trabajos ({filteredJobs.length} de {jobs.length})
            </h3>
          </CardHeader>
          <CardBody>
            {filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="job-card bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      {/* Izquierda: Número y título */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shadow-sm flex-shrink-0">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{job.job_number}</span>
                            {getJobTypeBadge(job.job_type)}
                            {getPriorityBadge(job.priority)}
                          </div>
                          <h4 className="mt-1 text-base font-semibold text-gray-900 truncate">{job.title}</h4>
                          {job.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 max-w-prose">{job.description}</p>
                          )}
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{job.technicians ? `${job.technicians.first_name} ${job.technicians.last_name}` : 'Sin asignar'}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{job.clients?.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Derecha: Estado, fecha y acciones */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <div>
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            className={`text-xs px-3 py-1 rounded-full border-0 font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[110px] ${
                              job.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500'
                                : job.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800 focus:ring-blue-500'
                                : job.status === 'in_progress'
                                ? 'bg-indigo-100 text-indigo-800 focus:ring-indigo-500'
                                : job.status === 'completed'
                                ? 'bg-green-100 text-green-800 focus:ring-green-500'
                                : 'bg-red-100 text-red-800 focus:ring-red-500'
                            }`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="scheduled">Programado</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{job.scheduled_date ? format(new Date(job.scheduled_date), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                        </div>
                        <div className="action-buttons flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(job)} title="Ver trabajo">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(job)} title="Editar trabajo">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(job)} title="Eliminar trabajo">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay trabajos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando tu primer trabajo.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNewJob}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Trabajo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron trabajos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros de búsqueda.
                </p>
                <div className="mt-6">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Modal para crear/editar trabajo */}
        <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingJob ? 'Editar Trabajo' : 'Nuevo Trabajo'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Título del Trabajo *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="form-label">Tipo de Trabajo *</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="repair">Reparación</option>
                <option value="renovation">Reforma</option>
                <option value="emergency">Emergencia</option>
              </select>
            </div>

            <div>
              <label className="form-label">Prioridad *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
                <option value="emergency">Emergencia</option>
              </select>
            </div>

            <div>
              <label className="form-label">Categoría</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Seleccionar categoría</option>
                <option value="electricidad">Electricidad</option>
                <option value="fontaneria">Fontanería</option>
                <option value="carpinteria">Carpintería</option>
                <option value="pintura">Pintura</option>
                <option value="albanileria">Albañilería</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="form-label">Cliente *</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Técnico</label>
              <select
                name="technician_id"
                value={formData.technician_id}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Sin asignar</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.first_name} {technician.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Aseguradora</label>
              <select
                name="insurance_company_id"
                value={formData.insurance_company_id}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Sin aseguradora</option>
                {insuranceCompanies.map((insurance) => (
                  <option key={insurance.id} value={insurance.id}>
                    {insurance.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Fecha Programada"
                name="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Horas Estimadas"
                name="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={handleInputChange}
                min="0"
                step="0.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Notas</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingJob ? 'Actualizar' : 'Crear'} Trabajo
            </Button>
          </div>
        </form>
      </Modal>

        {/* View Job Modal */}
        <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Trabajo"
        size="lg"
      >
        {viewingJob && (
          <div className="space-y-6">
            {/* Header con número y estado */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {viewingJob.job_number}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(viewingJob.status)}
                    {getPriorityBadge(viewingJob.priority)}
                    {getJobTypeBadge(viewingJob.job_type)}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del trabajo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información del Trabajo</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Título</p>
                    <p className="font-medium text-gray-900">{viewingJob.title}</p>
                  </div>
                  {viewingJob.description && (
                    <div>
                      <p className="text-sm text-gray-500">Descripción</p>
                      <p className="font-medium text-gray-900">{viewingJob.description}</p>
                    </div>
                  )}
                  {viewingJob.category && (
                    <div>
                      <p className="text-sm text-gray-500">Categoría</p>
                      <p className="font-medium text-gray-900">{viewingJob.category}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Cliente</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-900">
                        {viewingJob.clients.first_name} {viewingJob.clients.last_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${viewingJob.clients.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {viewingJob.clients.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium text-gray-900">{viewingJob.clients.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Técnico asignado */}
            {viewingJob.technicians && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Técnico Asignado</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Técnico</p>
                    <p className="font-medium text-gray-900">
                      {viewingJob.technicians.first_name} {viewingJob.technicians.last_name}
                    </p>
                    {viewingJob.technicians.phone && (
                      <a href={`tel:${viewingJob.technicians.phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                        {viewingJob.technicians.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fechas y horarios */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Fechas y Horarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {viewingJob.scheduled_date && (
                  <div>
                    <p className="text-sm text-gray-500">Fecha Programada</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(viewingJob.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                )}
                {viewingJob.start_date && (
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Inicio</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(viewingJob.start_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                )}
                {viewingJob.completion_date && (
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Finalización</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(viewingJob.completion_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Costos y horas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Costos y Horas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {viewingJob.estimated_hours && (
                  <div>
                    <p className="text-sm text-gray-500">Horas Estimadas</p>
                    <p className="font-medium text-gray-900">{viewingJob.estimated_hours}h</p>
                  </div>
                )}
                {viewingJob.actual_hours && (
                  <div>
                    <p className="text-sm text-gray-500">Horas Reales</p>
                    <p className="font-medium text-gray-900">{viewingJob.actual_hours}h</p>
                  </div>
                )}
                {viewingJob.labor_cost && (
                  <div>
                    <p className="text-sm text-gray-500">Costo de Mano de Obra</p>
                    <p className="font-medium text-gray-900">€{viewingJob.labor_cost.toFixed(2)}</p>
                  </div>
                )}
                {viewingJob.total_cost && (
                  <div>
                    <p className="text-sm text-gray-500">Costo Total</p>
                    <p className="font-semibold text-gray-900">€{viewingJob.total_cost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {viewingJob.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Notas</h3>
                <p className="text-gray-900">{viewingJob.notes}</p>
              </div>
            )}

            {/* Fechas de registro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creado:</span> {format(new Date(viewingJob.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span> {format(new Date(viewingJob.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingJob)
                }}
              >
                Editar Trabajo
              </Button>
            </div>
          </div>
        )}
      </Modal>

        {/* Delete Job Modal */}
        <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Trabajo"
      >
        {jobToDelete && (
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de que quieres eliminar el trabajo{' '}
              <strong>{jobToDelete.job_number} - {jobToDelete.title}</strong>?
            </p>
            <p className="text-sm text-red-600">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
