'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input } from '@/components/ui'
import { Truck, Plus, Settings, Eye, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const { company, loading: authLoading } = useAuth()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    payment_terms: '30',
    is_active: true
  })

  const resetForm = () => {
    setForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      payment_terms: '30',
      is_active: true
    })
  }

useEffect(() => {
  // Esperar a que la autenticación termine y company esté disponible
  if (!authLoading && company?.id) {
    loadSuppliers()
  } else if (!authLoading && !company?.id) {
    setLoading(false)
  }
}, [authLoading, company?.id])

  const loadSuppliers = async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Suppliers] loadSuppliers start', company?.id)
      }
      setLoading(true)
      
      if (!company) {
        console.error('No company found')
        return
      }

      // Obtener límites del plan
      const limits = await getPlanLimits(company.id)
      
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', company.id)
      
      // Aplicar límite según el plan (ordenar por created_at para plan free)
      query = applyPlanLimit(query, limits.max_suppliers, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setSuppliers(data || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Suppliers] loadSuppliers success', {
          companyId: company.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Error cargando proveedores')
    } finally {
      setLoading(false)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Suppliers] loadSuppliers finished', company?.id)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Simular operación
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingSupplier) {
        const updatedSuppliers = suppliers.map(supplier => 
          supplier.id === editingSupplier.id ? { ...supplier, ...form } : supplier
        )
        setSuppliers(updatedSuppliers)
        toast.success('Proveedor actualizado correctamente')
      } else {
        const newSupplier = {
          id: Date.now(),
          ...form,
          materials_count: 0,
          last_order: new Date().toISOString().split('T')[0]
        }
        setSuppliers([...suppliers, newSupplier])
        toast.success('Proveedor creado correctamente')
      }
      
      setShowModal(false)
      setEditingSupplier(null)
      resetForm()
    } catch (error) {
      toast.error('Error guardando proveedor')
    }
  }

  const handleNewSupplier = () => {
    setEditingSupplier(null)
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      payment_terms: supplier.payment_terms,
      is_active: supplier.is_active
    })
    setShowModal(true)
  }

  const handleView = (supplier: any) => {
    setSelectedSupplier(supplier)
    setShowViewModal(true)
  }

  const handleDelete = (supplier: any) => {
    setSelectedSupplier(supplier)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedSupplier) return
    
    try {
      const filteredSuppliers = suppliers.filter(supplier => supplier.id !== selectedSupplier.id)
      setSuppliers(filteredSuppliers)
      setShowDeleteModal(false)
      setSelectedSupplier(null)
      toast.success('Proveedor eliminado correctamente')
    } catch (error) {
      toast.error('Error eliminando proveedor')
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestiona tus proveedores y relaciones comerciales</p>
        </div>
        <Button 
          onClick={handleNewSupplier}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Proveedor</span>
        </Button>
      </div>

      {/* Suppliers List */}
      {suppliers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {supplier.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {supplier.contact_person}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    supplier.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {supplier.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Email:</strong> {supplier.email}</p>
                  <p><strong>Teléfono:</strong> {supplier.phone}</p>
                  <p><strong>Materiales:</strong> {supplier.materials_count}</p>
                  <p><strong>Último pedido:</strong> {supplier.last_order}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(supplier)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier)}
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

      {/* Modal para crear/editar proveedor */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del proveedor"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Persona de contacto"
            name="contact_person"
            value={form.contact_person}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Teléfono"
            name="phone"
            value={form.phone}
            onChange={handleInputChange}
          />
          
          <Input
            label="Dirección"
            name="address"
            value={form.address}
            onChange={handleInputChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sitio web"
              name="website"
              value={form.website}
              onChange={handleInputChange}
              placeholder="www.ejemplo.com"
            />
            
            <Input
              label="Términos de pago (días)"
              name="payment_terms"
              type="number"
              value={form.payment_terms}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={form.is_active}
              onChange={handleInputChange}
              className="rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Proveedor activo
            </label>
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
              {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver detalles del proveedor */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Proveedor"
        size="lg"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <p className="text-sm text-gray-900">{selectedSupplier.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contacto</label>
                <p className="text-sm text-gray-900">{selectedSupplier.contact_person}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedSupplier.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{selectedSupplier.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="text-sm text-gray-900">{selectedSupplier.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sitio web</label>
                <p className="text-sm text-gray-900">{selectedSupplier.website || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Materiales</label>
                <p className="text-sm text-gray-900">{selectedSupplier.materials_count}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <p className="text-sm text-gray-900">{selectedSupplier.is_active ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleEdit(selectedSupplier)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(selectedSupplier)}
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
            ¿Estás seguro de que quieres eliminar el proveedor{' '}
            <strong>{selectedSupplier?.name}</strong>?
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
