'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, Package } from 'lucide-react'

export default function SuppliersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
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
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
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
                      placeholder="Buscar proveedores..."
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

          {/* Suppliers Table */}
          <Card>
            <CardHeader title="Lista de Proveedores" />
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay proveedores registrados
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Supplier Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nuevo Proveedor"
          >
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombre de la Empresa *</label>
                  <input type="text" className="form-input" placeholder="Nombre del proveedor" />
                </div>
                <div>
                  <label className="form-label">Contacto Principal</label>
                  <input type="text" className="form-input" placeholder="Nombre del contacto" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="proveedor@email.com" />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input type="tel" className="form-input" placeholder="+34 900 000 000" />
                </div>
                <div>
                  <label className="form-label">CIF/NIF</label>
                  <input type="text" className="form-input" placeholder="A12345678" />
                </div>
                <div>
                  <label className="form-label">Sitio Web</label>
                  <input type="url" className="form-input" placeholder="https://www.proveedor.com" />
                </div>
              </div>

              <div>
                <label className="form-label">Dirección</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Dirección completa del proveedor..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ciudad</label>
                  <input type="text" className="form-input" placeholder="Ciudad" />
                </div>
                <div>
                  <label className="form-label">Código Postal</label>
                  <input type="text" className="form-input" placeholder="28001" />
                </div>
              </div>

              <div>
                <label className="form-label">Productos/Servicios</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Descripción de los productos o servicios que ofrece..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Términos de Pago</label>
                  <select className="form-input">
                    <option value="">Seleccionar términos</option>
                    <option value="contado">Al contado</option>
                    <option value="30dias">30 días</option>
                    <option value="60dias">60 días</option>
                    <option value="90dias">90 días</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Descuento (%)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="form-label">Notas</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre el proveedor..."
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
                  Crear Proveedor
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
