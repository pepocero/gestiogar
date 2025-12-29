'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input, Badge } from '@/components/ui'
import { Package, Plus, Settings, Eye, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import toast from 'react-hot-toast'

export default function MaterialsPage() {
  const { company, loading: authLoading } = useAuth()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    unit_price: '',
    stock_quantity: '',
    min_stock: '',
    supplier: '',
    sku: ''
  })

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: '',
      unit_price: '',
      stock_quantity: '',
      min_stock: '',
      supplier: '',
      sku: ''
    })
  }
  const loadingRef = useRef(false)

  const loadMaterials = useCallback(async () => {
    if (!company?.id || loadingRef.current) return
    
    loadingRef.current = true
    setLoading(true)
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Materials] loadMaterials start', company.id)
      }
      // Obtener límites del plan
      const limits = await getPlanLimits(company.id)
      
      let query = supabase
        .from('materials')
        .select(`
          *,
          suppliers(name)
        `)
        .eq('company_id', company.id)
      
      // Aplicar límite según el plan
      query = applyPlanLimit(query, limits.max_materials, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Error al cargar los materiales')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [company?.id])

  useEffect(() => {
    // Esperar a que la autenticación termine y company esté disponible
    if (!authLoading && company?.id && !loadingRef.current) {
      loadMaterials()
    } else if (!authLoading && !company?.id) {
      setLoading(false)
    }
  }, [authLoading, company?.id, loadMaterials])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Helper function to convert string to number or null
  const numberWithValue = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    return isNaN(num) ? '' : num.toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Simular operación
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const materialData = {
        ...form,
        unit_price: parseFloat(form.unit_price) || 0,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        min_stock: parseInt(form.min_stock) || 0
      }
      
      if (editingMaterial) {
        const updatedMaterials = materials.map(material => 
          material.id === editingMaterial.id ? { ...material, ...materialData } : material
        )
        setMaterials(updatedMaterials)
        toast.success('Material actualizado correctamente')
      } else {
        const newMaterial = {
          id: Date.now(),
          ...materialData,
          low_stock: materialData.stock_quantity < materialData.min_stock
        }
        setMaterials([...materials, newMaterial])
        toast.success('Material creado correctamente')
      }
      
      setShowModal(false)
      setEditingMaterial(null)
      resetForm()
    } catch (error) {
      toast.error('Error guardando material')
    }
  }

  const handleNewMaterial = () => {
    setEditingMaterial(null)
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setForm({
      name: material.name,
      description: material.description,
      category: material.category,
      unit_price: material.unit_price.toString(),
      stock_quantity: material.stock_quantity.toString(),
      min_stock: material.min_stock.toString(),
      supplier: material.supplier,
      sku: material.sku
    })
    setShowModal(true)
  }

  const handleView = (material: any) => {
    setSelectedMaterial(material)
    setShowViewModal(true)
  }

  const handleDelete = (material: any) => {
    setSelectedMaterial(material)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedMaterial) return
    
    try {
      const filteredMaterials = materials.filter(material => material.id !== selectedMaterial.id)
      setMaterials(filteredMaterials)
      setShowDeleteModal(false)
      setSelectedMaterial(null)
      toast.success('Material eliminado correctamente')
    } catch (error) {
      toast.error('Error eliminando material')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
          <p className="text-gray-600">Gestiona el inventario de materiales</p>
        </div>
        <Button 
          onClick={handleNewMaterial}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Material</span>
        </Button>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card>
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <Card key={material.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${material.low_stock ? 'bg-red-100' : 'bg-green-100'}`}>
                      <Package className={`h-6 w-6 ${material.low_stock ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {material.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {material.category}
                      </p>
                    </div>
                  </div>
                  {material.low_stock && (
                    <Badge variant="warning">
                      Stock Bajo
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>SKU:</strong> {material.sku}</p>
                  <p><strong>Stock:</strong> {material.stock_quantity} und</p>
                  <p><strong>Precio:</strong> €{material.unit_price}</p>
                  <p><strong>Proveedor:</strong> {material.supplier}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(material)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(material)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(material)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para crear/editar material */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMaterial ? 'Editar Material' : 'Nuevo Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del material"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleInputChange}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Categoría"
              name="category"
              value={form.category}
              onChange={handleInputChange}
            />
            
            <Input
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio unitario (€)"
              name="unit_price"
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={handleInputChange}
            />
            
            <Input
              label="Stock actual"
              name="stock_quantity"
              type="number"
              value={form.stock_quantity}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock mínimo"
              name="min_stock"
              type="number"
              value={form.min_stock}
              onChange={handleInputChange}
            />
            
            <Input
              label="Proveedor"
              name="supplier"
              value={form.supplier}
              onChange={handleInputChange}
            />
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
              {editingMaterial ? 'Actualizar' : 'Crear'} Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver detalles del material */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Material"
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Material</label>
                <p className="text-sm text-gray-900">{selectedMaterial.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <p className="text-sm text-gray-900">{selectedMaterial.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <p className="text-sm text-gray-900">{selectedMaterial.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <p className="text-sm text-gray-900">€{selectedMaterial.unit_price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
                <p className="text-sm text-gray-900">{selectedMaterial.stock_quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                <p className="text-sm text-gray-900">{selectedMaterial.min_stock}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <p className="text-sm text-gray-900">{selectedMaterial.supplier}</p>
              </div>
            </div>
            
            {selectedMaterial.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <p className="text-sm text-gray-900">{selectedMaterial.description}</p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleEdit(selectedMaterial)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(selectedMaterial)}
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que quieres eliminar el material{' '}
            <strong>{selectedMaterial?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
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
      </Modal>
    </div>
  )
}
