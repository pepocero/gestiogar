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
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Package, AlertTriangle, Building2, MapPin, Clock, CheckCircle, XCircle, DollarSign, Hash, Tag } from 'lucide-react'

interface Material {
  id: string
  name: string
  description: string
  category: string
  unit: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  is_active: boolean
  supplier_id: string
  suppliers?: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
}

export default function MaterialsPage() {
  const { company } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all' // 'all', 'active', 'inactive', 'low_stock'
  })
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'unidad',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock: 0,
    supplier_id: '',
    is_active: true,
  })

  useEffect(() => {
    if (company) {
      loadMaterials()
    }
  }, [company])

  // Aplicar filtros cuando cambien los materiales o los filtros
  useEffect(() => {
    applyFilters()
  }, [materials, filters])

  // Cargar proveedores al abrir el modal
  useEffect(() => {
    if ((showCreateModal || showEditModal) && company?.id) {
      fetchSuppliers()
    }
  }, [showCreateModal, showEditModal, company?.id])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          suppliers (
            id,
            name
          )
        `)
        .eq('company_id', company!.id)
        .order('name')

      if (error) {
        throw error
      }

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Error al cargar los materiales')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    if (!company?.id) return
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching suppliers:', error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = [...materials]

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(searchTerm) ||
        material.description?.toLowerCase().includes(searchTerm) ||
        material.category?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtro de categoría
    if (filters.category !== 'all') {
      filtered = filtered.filter(material => material.category === filters.category)
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(material => material.is_active)
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(material => !material.is_active)
      } else if (filters.status === 'low_stock') {
        filtered = filtered.filter(material => material.stock_quantity <= material.min_stock)
      }
    }

    setFilteredMaterials(filtered)
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
      category: 'all',
      status: 'all'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      if (selectedMaterial) {
        setIsUpdating(true)
        // Actualizar material existente
        const { error } = await supabase
          .from('materials')
          .update({
            ...formData,
            supplier_id: formData.supplier_id || null
          })
          .eq('id', selectedMaterial.id)

        if (error) {
          throw error
        }

        toast.success('Material actualizado correctamente')
      } else {
        setIsSubmitting(true)
        // Crear nuevo material
        const { error } = await supabase
          .from('materials')
          .insert([{
            ...formData,
            company_id: company.id,
            supplier_id: formData.supplier_id || null
          }])

        if (error) {
          throw error
        }

        toast.success('Material creado correctamente')
      }

      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedMaterial(null)
      resetForm()
      loadMaterials()
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Error al guardar el material')
    } finally {
      setIsSubmitting(false)
      setIsUpdating(false)
    }
  }

  const handleView = (material: Material) => {
    setSelectedMaterial(material)
    setShowViewModal(true)
  }

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({
      name: material.name,
      description: material.description || '',
      category: material.category || '',
      unit: material.unit || 'unidad',
      cost_price: material.cost_price || 0,
      selling_price: material.selling_price || 0,
      stock_quantity: material.stock_quantity || 0,
      min_stock: material.min_stock || 0,
      supplier_id: material.supplier_id || '',
      is_active: material.is_active,
    })
    setShowEditModal(true)
  }

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedMaterial) return

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', selectedMaterial.id)

      if (error) {
        throw error
      }

      toast.success('Material eliminado correctamente')
      setShowDeleteModal(false)
      setSelectedMaterial(null)
      loadMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Error al eliminar el material')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: 'unidad',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      min_stock: 0,
      supplier_id: '',
      is_active: true,
    })
  }

  const handleNewMaterial = () => {
    setSelectedMaterial(null)
    resetForm()
    setShowCreateModal(true)
  }

  // Helper function to convert string to number or null
  const numberWithValue = (value: FormDataEntryValue | null) => {
    if (!value) return null
    const num = parseFloat(value as string)
    return isNaN(num) ? null : num
  }
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
              <p className="text-gray-600">Gestiona el inventario de materiales</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={handleNewMaterial}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material
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
                      placeholder="Buscar por nombre, descripción o categoría..."
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
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="electricidad">Electricidad</option>
                    <option value="fontaneria">Fontanería</option>
                    <option value="carpinteria">Carpintería</option>
                    <option value="pintura">Pintura</option>
                    <option value="albanileria">Albañilería</option>
                    <option value="herramientas">Herramientas</option>
                    <option value="otros">Otros</option>
                  </select>
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
                    <option value="low_stock">Stock bajo</option>
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

          {/* Lista de materiales */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Inventario de Materiales ({filteredMaterials.length} de {materials.length})
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando materiales...</p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-4">
                  {filteredMaterials.length > 0 ? (
                    filteredMaterials.map((material) => (
                      <div key={material.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          {/* Icono del material */}
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            <Package className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Información del material */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {material.name}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                  {material.category && (
                                    <div className="flex items-center space-x-2">
                                      <Tag className="h-4 w-4 text-gray-400" />
                                      <span>{material.category}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    <span>Stock: {material.stock_quantity} {material.unit}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    <span>Compra: €{material.cost_price?.toFixed(2) || '0.00'}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    <span>Venta: €{material.selling_price?.toFixed(2) || '0.00'}</span>
                                  </div>
                                  
                                  {material.suppliers && (
                                    <div className="flex items-center space-x-2 md:col-span-2">
                                      <Building2 className="h-4 w-4 text-gray-400" />
                                      <span className="truncate">{material.suppliers.name}</span>
                                    </div>
                                  )}
                                  
                                  {material.description && (
                                    <div className="flex items-center space-x-2 md:col-span-2">
                                      <span className="truncate text-gray-500">{material.description}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Estado y acciones */}
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={material.is_active ? 'success' : 'danger'}>
                                    {material.is_active ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                  {material.stock_quantity <= material.min_stock && (
                                    <Badge variant="warning">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Stock bajo
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(material)}
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(material)}
                                    title="Editar material"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(material)}
                                    title="Eliminar material"
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
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No se encontraron materiales
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
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay materiales
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza agregando tu primer material.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleNewMaterial}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Material
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Modal para crear/editar material */}
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedMaterial(null)
            resetForm()
          }}
          title={selectedMaterial ? 'Editar Material' : 'Nuevo Material'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nombre del Material *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="Nombre del material"
                  required
                />
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
                  <option value="herramientas">Herramientas</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="form-label">Proveedor</label>
                <select 
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Unidad de Medida</label>
                <select 
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="unidad">Unidad</option>
                  <option value="metro">Metro</option>
                  <option value="metro_cuadrado">Metro cuadrado</option>
                  <option value="metro_cubico">Metro cúbico</option>
                  <option value="kilogramo">Kilogramo</option>
                  <option value="litro">Litro</option>
                  <option value="caja">Caja</option>
                  <option value="rollo">Rollo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Precio de Compra (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Precio de Venta (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Stock Actual</label>
                <input 
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Stock Mínimo</label>
                <input 
                  type="number"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Descripción</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input" 
                rows={3}
                placeholder="Descripción detallada del material..."
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
                Material activo
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setSelectedMaterial(null)
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
                {isSubmitting || isUpdating ? 'Guardando...' : (selectedMaterial ? 'Actualizar' : 'Crear') + ' Material'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para ver detalles del material */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedMaterial(null)
          }}
          title="Detalles del Material"
        >
          {selectedMaterial && (
            <div className="space-y-6">
              {/* Header con nombre y estado */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMaterial.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedMaterial.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={selectedMaterial.is_active ? 'success' : 'danger'}>
                        {selectedMaterial.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {selectedMaterial.stock_quantity <= selectedMaterial.min_stock && (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedMaterial)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Material
                </Button>
              </div>

              {/* Información del material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información General</h3>
                  
                  {selectedMaterial.category && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Categoría</p>
                        <p className="font-medium text-gray-900">{selectedMaterial.category}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Hash className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock Actual</p>
                      <p className="font-medium text-gray-900">{selectedMaterial.stock_quantity} {selectedMaterial.unit}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock Mínimo</p>
                      <p className="font-medium text-gray-900">{selectedMaterial.min_stock} {selectedMaterial.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información Económica</h3>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Precio de Compra</p>
                      <p className="font-medium text-gray-900">€{selectedMaterial.cost_price?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Precio de Venta</p>
                      <p className="font-medium text-gray-900">€{selectedMaterial.selling_price?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  
                  {selectedMaterial.suppliers && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Proveedor</p>
                        <p className="font-medium text-gray-900">{selectedMaterial.suppliers.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {selectedMaterial.description && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                  <p className="text-gray-600">{selectedMaterial.description}</p>
                </div>
              )}

              {/* Fechas */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Creado:</span> {new Date(selectedMaterial.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span> {new Date(selectedMaterial.updated_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedMaterial(null)
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedMaterial)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Material
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
            setSelectedMaterial(null)
          }}
          title="Confirmar Eliminación"
        >
          {selectedMaterial && (
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que quieres eliminar el material <strong>{selectedMaterial.name}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedMaterial(null)
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
