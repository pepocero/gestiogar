'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, Package, Building2, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  payment_terms: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SuppliersPage() {
  const { company } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' // 'all', 'active', 'inactive'
  })
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: 30,
    is_active: true,
  })

  useEffect(() => {
    if (company) {
      loadSuppliers()
    }
  }, [company])

  // Aplicar filtros cuando cambien los proveedores o los filtros
  useEffect(() => {
    applyFilters()
  }, [suppliers, filters])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', company!.id)
        .order('name')

      if (error) {
        throw error
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Error al cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = [...suppliers]

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm) ||
        supplier.email?.toLowerCase().includes(searchTerm) ||
        supplier.phone?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(supplier => 
        filters.status === 'active' ? supplier.is_active : !supplier.is_active
      )
    }

    setFilteredSuppliers(filtered)
  }

  // Función para manejar cambios en los filtros
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      setIsSubmitting(true)
      
      if (selectedSupplier) {
        // Actualizar proveedor existente
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', selectedSupplier.id)

        if (error) {
          throw error
        }

        toast.success('Proveedor actualizado correctamente')
      } else {
        // Crear nuevo proveedor
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            ...formData,
            company_id: company.id
          }])

        if (error) {
          throw error
        }

        toast.success('Proveedor creado correctamente')
      }

      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedSupplier(null)
      resetForm()
      loadSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('Error al guardar el proveedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowViewModal(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || 30,
      is_active: supplier.is_active,
    })
    setShowEditModal(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedSupplier) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', selectedSupplier.id)

      if (error) {
        throw error
      }

      toast.success('Proveedor eliminado correctamente')
      setShowDeleteModal(false)
      setSelectedSupplier(null)
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Error al eliminar el proveedor')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      payment_terms: 30,
      is_active: true,
    })
  }

  const handleNewSupplier = () => {
    setSelectedSupplier(null)
    resetForm()
    setShowCreateModal(true)
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-600">Gestiona los proveedores de materiales</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={handleNewSupplier}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, contacto, email o teléfono..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                  </select>
                </div>
                
                <div className="sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Lista de proveedores */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Lista de Proveedores ({filteredSuppliers.length} de {suppliers.length})
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando proveedores...</p>
                </div>
              ) : suppliers.length > 0 ? (
                <div className="space-y-4">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          {/* Icono del proveedor */}
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            <Building2 className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Información del proveedor */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {supplier.name}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                  {supplier.contact_person && (
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">Contacto:</span>
                                      <span>{supplier.contact_person}</span>
                                    </div>
                                  )}
                                  
                                  {supplier.email && (
                                    <div className="flex items-center space-x-2">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span>{supplier.email}</span>
                                    </div>
                                  )}
                                  
                                  {supplier.phone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <span>{supplier.phone}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{supplier.payment_terms} días de pago</span>
                                  </div>
                                  
                                  {supplier.address && (
                                    <div className="flex items-center space-x-2 md:col-span-2">
                                      <MapPin className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{supplier.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Estado y acciones */}
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <Badge variant={supplier.is_active ? 'success' : 'danger'}>
                                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                                
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(supplier)}
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(supplier)}
                                    title="Editar proveedor"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(supplier)}
                                    title="Eliminar proveedor"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No se encontraron proveedores
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Intenta ajustar los filtros de búsqueda.
                      </p>
                      <div className="mt-6">
                        <Button onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay proveedores
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza agregando tu primer proveedor.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleNewSupplier}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Proveedor
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Modal para crear/editar proveedor */}
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedSupplier(null)
            resetForm()
          }}
          title={selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nombre de la Empresa *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>
              <div>
                <label className="form-label">Contacto Principal</label>
                <input 
                  type="text" 
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="proveedor@email.com"
                />
              </div>
              <div>
                <label className="form-label">Teléfono</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="+34 900 000 000"
                />
              </div>
              <div>
                <label className="form-label">Términos de Pago (días)</label>
                <input 
                  type="number" 
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleInputChange}
                  className="form-input" 
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Dirección</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input" 
                rows={3}
                placeholder="Dirección completa del proveedor..."
              />
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Proveedor activo
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setSelectedSupplier(null)
                  resetForm()
                }}
                disabled={isSubmitting || isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="btn-primary"
                disabled={isSubmitting || isUpdating}
              >
                {isSubmitting || isUpdating ? 'Guardando...' : (selectedSupplier ? 'Actualizar' : 'Crear') + ' Proveedor'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para ver detalles del proveedor */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedSupplier(null)
          }}
          title="Detalles del Proveedor"
        >
          {selectedSupplier && (
            <div className="space-y-6">
              {/* Header con nombre y estado */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSupplier.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedSupplier.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={selectedSupplier.is_active ? 'success' : 'danger'}>
                        {selectedSupplier.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedSupplier)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Proveedor
                </Button>
              </div>

              {/* Información de contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
                  
                  {selectedSupplier.contact_person && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contacto Principal</p>
                        <p className="font-medium text-gray-900">{selectedSupplier.contact_person}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedSupplier.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedSupplier.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedSupplier.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-900">{selectedSupplier.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Términos de Pago</p>
                      <p className="font-medium text-gray-900">{selectedSupplier.payment_terms} días</p>
                    </div>
                  </div>
                  
                  {selectedSupplier.address && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium text-gray-900">{selectedSupplier.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Creado:</span> {new Date(selectedSupplier.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span> {new Date(selectedSupplier.updated_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedSupplier(null)
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedSupplier)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Proveedor
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal para confirmar eliminación */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedSupplier(null)
          }}
          title="Confirmar Eliminación"
        >
          {selectedSupplier && (
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que quieres eliminar el proveedor <strong>{selectedSupplier.name}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSupplier(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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
