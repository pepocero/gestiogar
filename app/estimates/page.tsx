'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, FileText, Eye, Send, Check, X, User, Mail, Wrench, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Estimate {
  id: string
  estimate_number: string
  title: string
  description: string
  status: string
  total_amount: number
  labor_amount: number
  materials_amount: number
  valid_until: string
  notes: string
  created_at: string
  updated_at: string
  client_id: string
  job_id: string
  clients: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  jobs: {
    job_number: string
    title: string
  } | null
}

interface EstimateItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  is_labor: boolean
  material_id?: string
}

export default function EstimatesPage() {
  const { company } = useAuth()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | null>(null)
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client_id: '',
    job_id: ''
  })
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    job_id: '',
    valid_until: '',
    notes: '',
  })

  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    is_labor: false,
    material_id: '',
  })

  useEffect(() => {
    if (company) {
      loadEstimates()
      loadClients()
      loadJobs()
      loadMaterials()
    }
  }, [company])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          clients!inner(first_name, last_name, email, phone),
          jobs(job_number, title)
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setEstimates(data || [])
    } catch (error) {
      console.error('Error loading estimates:', error)
      toast.error('Error al cargar los presupuestos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar presupuestos
  const applyFilters = () => {
    let filtered = estimates

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(estimate => 
        estimate.title.toLowerCase().includes(searchLower) ||
        estimate.estimate_number.toLowerCase().includes(searchLower) ||
        estimate.description?.toLowerCase().includes(searchLower) ||
        estimate.clients?.first_name?.toLowerCase().includes(searchLower) ||
        estimate.clients?.last_name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(estimate => estimate.status === filters.status)
    }

    if (filters.client_id) {
      filtered = filtered.filter(estimate => estimate.client_id === filters.client_id)
    }

    if (filters.job_id) {
      filtered = filtered.filter(estimate => estimate.job_id === filters.job_id)
    }

    setFilteredEstimates(filtered)
  }

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [estimates, filters])

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
      client_id: '',
      job_id: ''
    })
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
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

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_number, title, status')
        .eq('company_id', company!.id)
        .in('status', ['pending', 'scheduled'])
        .order('job_number')

      if (error) {
        throw error
      }

      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, selling_price, unit')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadEstimateItems = async (estimateId: string) => {
    try {
      const { data, error } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at')

      if (error) {
        throw error
      }

      setEstimateItems(data || [])
    } catch (error) {
      console.error('Error loading estimate items:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setItemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const generateEstimateNumber = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `EST-${year}${month}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      const estimateNumber = generateEstimateNumber()
      const totalAmount = estimateItems.reduce((sum, item) => sum + item.total_price, 0)
      const laborAmount = estimateItems.filter(item => item.is_labor).reduce((sum, item) => sum + item.total_price, 0)
      const materialsAmount = estimateItems.filter(item => !item.is_labor).reduce((sum, item) => sum + item.total_price, 0)

      if (editingEstimate) {
        // Actualizar presupuesto existente
        const { error } = await supabase
          .from('estimates')
          .update({
            ...formData,
            total_amount: totalAmount,
            labor_amount: laborAmount,
            materials_amount: materialsAmount,
          })
          .eq('id', editingEstimate.id)

        if (error) {
          throw error
        }

        // Actualizar items del presupuesto
        if (estimateItems.length > 0) {
          // Primero eliminar todos los items existentes
          const { error: deleteError } = await supabase
            .from('estimate_items')
            .delete()
            .eq('estimate_id', editingEstimate.id)

          if (deleteError) {
            throw deleteError
          }

          // Luego insertar los nuevos items
          const itemsToInsert = estimateItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            is_labor: item.is_labor,
            material_id: item.material_id && item.material_id.trim() !== '' ? item.material_id : null,
            estimate_id: editingEstimate.id
          }))

          const { error: itemsError } = await supabase
            .from('estimate_items')
            .insert(itemsToInsert)

          if (itemsError) {
            throw itemsError
          }
        }

        toast.success('Presupuesto actualizado correctamente')
      } else {
        // Crear nuevo presupuesto
        const { data: newEstimate, error } = await supabase
          .from('estimates')
          .insert([{
            ...formData,
            estimate_number: estimateNumber,
            total_amount: totalAmount,
            labor_amount: laborAmount,
            materials_amount: materialsAmount,
            company_id: company.id
          }])
          .select()
          .single()

        if (error) {
          throw error
        }

        // Crear items del presupuesto
        if (estimateItems.length > 0) {
          const itemsToInsert = estimateItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            is_labor: item.is_labor,
            material_id: item.material_id && item.material_id.trim() !== '' ? item.material_id : null,
            estimate_id: newEstimate.id
          }))

          const { error: itemsError } = await supabase
            .from('estimate_items')
            .insert(itemsToInsert)

          if (itemsError) {
            throw itemsError
          }
        }

        toast.success('Presupuesto creado correctamente')
      }

      setShowModal(false)
      setEditingEstimate(null)
      resetForm()
      loadEstimates()
    } catch (error) {
      console.error('Error saving estimate:', error)
      toast.error('Error al guardar el presupuesto')
      // No cerrar el modal si hay error
    }
  }

  const handleEdit = async (estimate: Estimate) => {
    setEditingEstimate(estimate)
    setFormData({
      title: estimate.title,
      description: estimate.description,
      client_id: estimate.client_id || '',
      job_id: estimate.job_id || '',
      valid_until: estimate.valid_until ? estimate.valid_until.split('T')[0] : '',
      notes: estimate.notes,
    })
    
    // Cargar los ítems del presupuesto antes de abrir el modal
    await loadEstimateItems(estimate.id)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Presupuesto eliminado correctamente')
      loadEstimates()
    } catch (error) {
      console.error('Error deleting estimate:', error)
      toast.error('Error al eliminar el presupuesto')
    }
  }

  const handleView = async (estimate: Estimate) => {
    setViewingEstimate(estimate)
    setShowViewModal(true)
    
    // Cargar los ítems del presupuesto
    try {
      const { data, error } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimate.id)
        .order('created_at')

      if (error) {
        console.error('Error loading estimate items:', error)
      } else {
        setEstimateItems(data || [])
      }
    } catch (error) {
      console.error('Error loading estimate items:', error)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('estimates')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Estado actualizado correctamente')
      loadEstimates()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const addEstimateItem = () => {
    if (!itemForm.description || itemForm.quantity <= 0 || itemForm.unit_price < 0) {
      toast.error('Por favor completa todos los campos del item')
      return
    }

    const newItem: EstimateItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: itemForm.description,
      quantity: Number(itemForm.quantity),
      unit_price: Number(itemForm.unit_price),
      total_price: Number(itemForm.quantity) * Number(itemForm.unit_price),
      is_labor: itemForm.is_labor,
      material_id: itemForm.material_id || undefined,
    }

    setEstimateItems(prev => [...prev, newItem])
    setItemForm({
      description: '',
      quantity: 1,
      unit_price: 0,
      is_labor: false,
      material_id: '',
    })
  }

  const removeEstimateItem = (id: string) => {
    setEstimateItems(prev => prev.filter(item => item.id !== id))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      client_id: '',
      job_id: '',
      valid_until: '',
      notes: '',
    })
    setEstimateItems([])
  }

  const handleNewEstimate = () => {
    setEditingEstimate(null)
    resetForm()
    setShowModal(true)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { variant: 'gray' as const, label: 'Borrador' },
      sent: { variant: 'info' as const, label: 'Enviado' },
      approved: { variant: 'success' as const, label: 'Aprobado' },
      rejected: { variant: 'danger' as const, label: 'Rechazado' },
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'gray' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
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
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Presupuestos
            </h1>
            <p className="text-gray-600">
              Gestiona los presupuestos para tus trabajos.
            </p>
          </div>
          <Button onClick={handleNewEstimate} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Presupuesto</span>
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
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
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

              {/* Trabajo */}
              <div>
                <label className="form-label">Trabajo</label>
                <select
                  value={filters.job_id}
                  onChange={(e) => handleFilterChange('job_id', e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los trabajos</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_number} - {job.title}
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

        {/* Lista de presupuestos */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Presupuestos ({filteredEstimates.length} de {estimates.length})
            </h3>
          </CardHeader>
          <CardBody>
            {filteredEstimates.length > 0 ? (
              <div className="space-y-4">
                {filteredEstimates.map((estimate) => (
                  <div key={estimate.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      {/* Izquierda: Número, título y cliente */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shadow-sm flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{estimate.estimate_number}</span>
                            <select
                              value={estimate.status}
                              onChange={(e) => handleStatusChange(estimate.id, e.target.value)}
                              className={`text-xs px-3 py-1 rounded-full border-0 font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[110px] ${
                                estimate.status === 'draft'
                                  ? 'bg-gray-100 text-gray-800 focus:ring-gray-500'
                                  : estimate.status === 'sent'
                                  ? 'bg-blue-100 text-blue-800 focus:ring-blue-500'
                                  : estimate.status === 'approved'
                                  ? 'bg-green-100 text-green-800 focus:ring-green-500'
                                  : 'bg-red-100 text-red-800 focus:ring-red-500'
                              }`}
                            >
                              <option value="draft">Borrador</option>
                              <option value="sent">Enviado</option>
                              <option value="approved">Aprobado</option>
                              <option value="rejected">Rechazado</option>
                            </select>
                          </div>
                          <h4 className="mt-1 text-base font-semibold text-gray-900 truncate">{estimate.title}</h4>
                          {estimate.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 max-w-prose">{estimate.description}</p>
                          )}
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{estimate.clients.first_name} {estimate.clients.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="truncate">Válido hasta: {estimate.valid_until ? format(new Date(estimate.valid_until), 'dd/MM/yyyy', { locale: es }) : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Derecha: Importe y acciones */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Importe total</div>
                          <div className="text-lg font-semibold text-gray-900">€{estimate.total_amount.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(estimate)} title="Ver presupuesto">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(estimate)} title="Editar presupuesto">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(estimate.id)} title="Eliminar presupuesto">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : estimates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay presupuestos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando tu primer presupuesto.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNewEstimate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Presupuesto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron presupuestos
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

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingEstimate ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Título del Presupuesto *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
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
              <label className="form-label">Trabajo Relacionado</label>
              <select
                name="job_id"
                value={formData.job_id}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Sin trabajo relacionado</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_number} - {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Válido Hasta"
                name="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={handleInputChange}
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

          {/* Items del presupuesto */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Items del Presupuesto
              </h4>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowItemsModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>

            {estimateItems.length > 0 ? (
              <div className="space-y-2">
                {estimateItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{item.description}</span>
                        {item.is_labor && (
                          <Badge variant="info" size="sm">Mano de Obra</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} x €{item.unit_price.toFixed(2)} = €{item.total_price.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEstimateItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>€{estimateItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay items en el presupuesto
              </div>
            )}
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
              {editingEstimate ? 'Actualizar' : 'Crear'} Presupuesto
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Estimate Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Presupuesto"
        size="lg"
      >
        {viewingEstimate && (
          <div className="space-y-6">
            {/* Header con número y estado */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {viewingEstimate.estimate_number}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(viewingEstimate.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del presupuesto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información del Presupuesto</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Título</p>
                    <p className="font-medium text-gray-900">{viewingEstimate.title}</p>
                  </div>
                  {viewingEstimate.description && (
                    <div>
                      <p className="text-sm text-gray-500">Descripción</p>
                      <p className="font-medium text-gray-900">{viewingEstimate.description}</p>
                    </div>
                  )}
                  {viewingEstimate.valid_until && (
                    <div>
                      <p className="text-sm text-gray-500">Válido hasta</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(viewingEstimate.valid_until), 'dd/MM/yyyy', { locale: es })}
                      </p>
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
                        {viewingEstimate.clients.first_name} {viewingEstimate.clients.last_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${viewingEstimate.clients.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {viewingEstimate.clients.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trabajo relacionado */}
            {viewingEstimate.jobs && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Trabajo Relacionado</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trabajo</p>
                    <p className="font-medium text-gray-900">
                      {viewingEstimate.jobs.job_number} - {viewingEstimate.jobs.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles financieros */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Detalles Financieros</h3>
              
              {/* Ítems del presupuesto */}
              {estimateItems.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ítems del Presupuesto</h4>
                  <div className="space-y-2">
                    {estimateItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-white rounded p-2 border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} x €{item.unit_price.toFixed(2)} = €{item.total_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.is_labor 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.is_labor ? 'Mano de Obra' : 'Material'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Resumen financiero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mano de Obra</p>
                  <p className="font-medium text-gray-900">€{viewingEstimate.labor_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Materiales</p>
                  <p className="font-medium text-gray-900">€{viewingEstimate.materials_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg text-gray-900">€{viewingEstimate.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Notas */}
            {viewingEstimate.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Notas</h3>
                <p className="text-gray-900">{viewingEstimate.notes}</p>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creado:</span> {format(new Date(viewingEstimate.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span> {format(new Date(viewingEstimate.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
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
                onClick={async () => {
                  setShowViewModal(false)
                  await handleEdit(viewingEstimate)
                }}
              >
                Editar Presupuesto
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para agregar items */}
      <Modal
        isOpen={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        title="Agregar Item al Presupuesto"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Descripción *"
              name="description"
              value={itemForm.description}
              onChange={handleItemInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Cantidad *"
                name="quantity"
                type="number"
                value={itemForm.quantity}
                onChange={handleItemInputChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <Input
                label="Precio Unitario *"
                name="unit_price"
                type="number"
                value={itemForm.unit_price}
                onChange={handleItemInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Material</label>
            <select
              name="material_id"
              value={itemForm.material_id}
              onChange={handleItemInputChange}
              className="form-input"
            >
              <option value="">Seleccionar material (opcional)</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} - €{material.selling_price} ({material.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="is_labor"
              name="is_labor"
              type="checkbox"
              checked={itemForm.is_labor}
              onChange={handleItemInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_labor" className="ml-2 block text-sm text-gray-900">
              Es mano de obra
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowItemsModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={addEstimateItem}>
              Agregar Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
