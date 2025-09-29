'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function MaterialsPage() {
  const { company } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])

  // Cargar proveedores al abrir el modal
  React.useEffect(() => {
    if (showCreateModal && company?.id) {
      fetchSuppliers()
    }
  }, [showCreateModal, company?.id])

  const fetchSuppliers = async () => {
    if (!company?.id) return
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('company_id', company.id)

      if (error) {
        console.error('Error fetching suppliers:', error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleCreateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const materialData = {
        company_id: company.id,
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        product_code: formData.get('product_code') as string || null,
        brand: formData.get('brand') as string || null,
        supplier_id: formData.get('supplier_id') as string || null,
        unit: formData.get('unit') as string || null,
        purchase_price: numberWithValue(formData.get('purchase_price')),
        sale_price: numberWithValue(formData.get('sale_price')),
        stock_quantity: numberWithValue(formData.get('stock_quantity')),
        min_stock: numberWithValue(formData.get('min_stock')),
        max_stock: numberWithValue(formData.get('max_stock')),
        description: formData.get('description') as string || null,
        specifications: formData.get('specifications') as string || null,
      }

      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()

      if (error) {
        console.error('Error creating material:', error)
        toast.error('Error al crear el material: ' + error.message)
        return
      }

      toast.success('Material creado exitosamente')
      setShowCreateModal(false)
      e.currentTarget.reset()
      
    } catch (error) {
      console.error('Error creating material:', error)
      toast.error('Error inesperado al crear el material')
    } finally {
      setIsSubmitting(false)
    }
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
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar materiales..."
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                <Button variant="secondary">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardHeader title="Inventario de Materiales" />
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Proveedor</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No hay materiales registrados
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Material Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nuevo Material"
          >
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombre del Material *</label>
                  <input type="text" className="form-input" placeholder="Nombre del material" />
                </div>
                <div>
                  <label className="form-label">Categoría *</label>
                  <select className="form-input">
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
                  <label className="form-label">Código de Producto</label>
                  <input type="text" className="form-input" placeholder="Código único del material" />
                </div>
                <div>
                  <label className="form-label">Marca</label>
                  <input type="text" className="form-input" placeholder="Marca del material" />
                </div>
                <div>
                  <label className="form-label">Proveedor</label>
                  <select name="supplier_id" className="form-input">
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
                  <select className="form-input">
                    <option value="">Seleccionar unidad</option>
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
                  <label className="form-label">Precio de Compra (€) *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="form-label">Precio de Venta (€) *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="form-label">Stock Inicial</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Stock Mínimo</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Stock Máximo</label>
                  <input type="number" className="form-input" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Descripción detallada del material..."
                ></textarea>
              </div>

              <div>
                <label className="form-label">Especificaciones Técnicas</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Especificaciones técnicas del material..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="btn-primary">
                  Crear Material
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
