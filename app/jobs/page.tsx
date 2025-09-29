'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Wrench, Eye, Calendar, User, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
  const { company } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    job_type: '',
    priority: '',
    client_id: '',
    technician_id: ''
  })
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])

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

  useEffect(() => {
    if (company) {
      loadJobs()
      loadClients()
      loadTechnicians()
      loadInsuranceCompanies()
    }
  }, [company])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients!inner(first_name, last_name, email, phone, address),
          technicians(first_name, last_name, phone),
          insurance_companies(name)
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Error al cargar los trabajos')
    } finally {
      setLoading(false)
    }
  }

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

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .eq('company_id', company!.id)
        .order('first_name')

      if (error) {
        throw error
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('id, first_name, last_name, phone, specialties')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('first_name')

      if (error) {
        throw error
      }

      setTechnicians(data || [])
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }

  const loadInsuranceCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('id, name')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      setInsuranceCompanies(data || [])
    } catch (error) {
      console.error('Error loading insurance companies:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
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
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      }

      if (editingJob) {
        // Actualizar trabajo existente
        const { error } = await supabase
          .from('jobs')
          .update(cleanFormData)
          .eq('id', editingJob.id)

        if (error) {
          throw error
        }

        toast.success('Trabajo actualizado correctamente')
      } else {
        // Crear nuevo trabajo
        const { error } = await supabase
          .from('jobs')
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
    setFormData({
      title: job.title,
      description: job.description,
      job_type: job.job_type,
      priority: job.priority,
      category: job.category,
      client_id: 'client_id', // Necesitaríamos el ID del cliente
      technician_id: 'technician_id', // Necesitaríamos el ID del técnico
      insurance_company_id: 'insurance_company_id', // Necesitaríamos el ID de la aseguradora
      scheduled_date: job.scheduled_date ? job.scheduled_date.split('T')[0] : '',
      estimated_hours: job.estimated_hours,
      notes: job.notes,
    })
    setShowModal(true)
  }

  const handleDelete = (job: Job) => {
    setJobToDelete(job)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!jobToDelete) return

    try {
      const { error } = await supabase
        .from('jobs')
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

      const { error } = await supabase
        .from('jobs')
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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Trabajos
            </h1>
            <p className="text-gray-600">
              Gestiona las órdenes de trabajo y reparaciones.
            </p>
          </div>
          <Button onClick={handleNewJob} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Trabajo</span>
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Trabajos ({filteredJobs.length} de {jobs.length})
            </h3>
          </CardHeader>
          <CardBody>
            {filteredJobs.length > 0 ? (
              <Table>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-primary-600" />
                          <span className="font-mono text-sm">
                            {job.job_number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {job.title}
                          </div>
                          {job.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {job.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {job.clients.first_name} {job.clients.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-xs">
                              {job.clients.address}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.technicians ? (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {job.technicians.first_name} {job.technicians.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getJobTypeBadge(job.job_type)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(job.priority)}
                      </TableCell>
                      <TableCell>
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className={`text-xs px-3 py-1 rounded-full border-0 font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[100px] max-w-[120px] ${
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
                      </TableCell>
                      <TableCell>
                        {job.scheduled_date ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(job.scheduled_date), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(job)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      </div>

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
              <Input
                label="Categoría"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Fontanería, Electricidad, etc."
              />
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
      </Layout>
    </ProtectedRoute>
  )
}
