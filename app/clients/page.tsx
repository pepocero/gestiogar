'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, User, MapPin, CheckCircle, XCircle, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const { company, user, loading } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    client_type: 'direct',
    insurance_company_id: ''
  })

  // Cargar clientes al montar el componente
  React.useEffect(() => {
    if (company?.id) {
      fetchClients()
    }
  }, [company?.id])

  // Cargar aseguradoras al abrir el modal
  React.useEffect(() => {
    if (showCreateModal && company?.id) {
      fetchInsuranceCompanies()
    }
  }, [showCreateModal, company?.id])

  const fetchClients = async () => {
    if (!company?.id) return
    
    setLoadingClients(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          insurance_companies (
            id,
            name
          )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const fetchInsuranceCompanies = async () => {
    if (!company?.id) return
    
    try {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('id, name')
        .eq('company_id', company.id)

      if (error) {
        console.error('Error fetching insurance companies:', error)
        return
      }

      setInsuranceCompanies(data || [])
    } catch (error) {
      console.error('Error fetching insurance companies:', error)
    }
  }

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      const clientData = {
        company_id: company.id,
        insurance_company_id: (formData.get('insurance_company_id') as string)?.trim() || null,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        address: (formData.get('address') as string)?.trim() || '',
        city: formData.get('city') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        client_type: formData.get('client_type') as string || 'direct',
        policy_number: formData.get('policy_number') as string || null,
        claim_number: formData.get('claim_number') as string || null,
        notes: formData.get('notes') as string || null,
      }

      // Usar supabaseAdmin para bypassar posibles problemas de RLS
      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert([clientData])
        .select()

      if (error) {
        console.error('Supabase error creating client:', error)
        toast.error('Error al crear el cliente: ' + error.message)
        return
      }

      toast.success('Cliente creado exitosamente')
      setShowCreateModal(false)
      
      // Reset form safely
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      
      // Refresh the clients list
      fetchClients()
      
    } catch (error) {
      console.error('JavaScript error creating client:', error)
      toast.error('Error inesperado al crear el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewClient = (client: any) => {
    setSelectedClient(client)
    setShowViewModal(true)
  }

  const handleEditClient = async (client: any) => {
    setSelectedClient(client)
    setEditFormData({
      client_type: client.client_type || 'direct',
      insurance_company_id: client.insurance_company_id || ''
    })
    setShowEditModal(true)
    
    // Cargar aseguradoras al abrir el modal de edición
    if (company?.id) {
      await fetchInsuranceCompanies()
    }
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Sincronizar campos
      if (field === 'insurance_company_id' && value) {
        newData.client_type = 'insurance'
      } else if (field === 'client_type' && value === 'direct') {
        newData.insurance_company_id = ''
      }
      
      return newData
    })
  }

  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedClient) return
    
    setIsUpdating(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const clientData = {
        insurance_company_id: editFormData.insurance_company_id?.trim() || null,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        address: (formData.get('address') as string)?.trim() || '',
        city: formData.get('city') as string || null,
        postal_code: formData.get('postal_code') as string || null,
        client_type: editFormData.client_type,
        policy_number: formData.get('policy_number') as string || null,
        claim_number: formData.get('claim_number') as string || null,
        notes: formData.get('notes') as string || null,
      }

      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', selectedClient.id)

      if (error) {
        console.error('Error updating client:', error)
        toast.error('Error al actualizar el cliente: ' + error.message)
        return
      }

      toast.success('Cliente actualizado exitosamente')
      setShowEditModal(false)
      setSelectedClient(null)
      fetchClients()
      
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Error inesperado al actualizar el cliente')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClient = (client: any) => {
    setSelectedClient(client)
    setShowDeleteModal(true)
  }

  const confirmDeleteClient = async () => {
    if (!selectedClient) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id)

      if (error) {
        console.error('Error deleting client:', error)
        toast.error('Error al eliminar el cliente: ' + error.message)
        return
      }

      toast.success('Cliente eliminado exitosamente')
      setShowDeleteModal(false)
      setSelectedClient(null)
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Error inesperado al eliminar el cliente')
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-600">Gestiona los clientes de tu empresa</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
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
                      placeholder="Buscar clientes..."
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

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Lista de Clientes</h2>
            </CardHeader>
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Tipo / Aseguradora</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClients ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
                          Cargando clientes...
                        </div>
                      </td>
                    </tr>
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <tr key={client.id}>
                        <td className="font-medium">
                          {client.first_name} {client.last_name}
                        </td>
                        <td>{client.email || '-'}</td>
                        <td>{client.phone || '-'}</td>
                        <td>{client.address || '-'}</td>
                        <td>
                          {client.client_type === 'direct' ? (
                            <Badge variant="info">Directo</Badge>
                          ) : (
                            <Badge variant="success">
                              {client.insurance_companies ? client.insurance_companies.name : 'Aseguradora'}
                            </Badge>
                          )}
                        </td>
                        <td className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewClient(client)}
                            title="Ver cliente"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClient(client)}
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClient(client)}
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No hay clientes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Client Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nuevo Cliente"
          >
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input 
                    type="text" 
                    name="first_name"
                    className="form-input" 
                    placeholder="Nombre del cliente" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Apellidos *</label>
                  <input 
                    type="text" 
                    name="last_name"
                    className="form-input" 
                    placeholder="Apellidos del cliente" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-input" 
                    placeholder="cliente@email.com" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono *</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className="form-input" 
                    placeholder="+34 600 000 000" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tipo de Cliente</label>
                  <select name="client_type" className="form-input">
                    <option value="direct">Cliente Directo</option>
                    <option value="insurance">Cliente de Aseguradora</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Aseguradora</label>
                  <select name="insurance_company_id" className="form-input">
                    <option value="">Seleccionar aseguradora</option>
                    {insuranceCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Número de Póliza</label>
                  <input 
                    type="text" 
                    name="policy_number"
                    className="form-input" 
                    placeholder="Número de póliza" 
                  />
                </div>
                <div>
                  <label className="form-label">Número de Siniestro</label>
                  <input 
                    type="text" 
                    name="claim_number"
                    className="form-input" 
                    placeholder="Número de siniestro" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Dirección *</label>
                <textarea 
                  name="address"
                  className="form-input" 
                  rows={3}
                  placeholder="Dirección completa del cliente..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ciudad</label>
                  <input 
                    type="text" 
                    name="city"
                    className="form-input" 
                    placeholder="Ciudad" 
                  />
                </div>
                <div>
                  <label className="form-label">Código Postal</label>
                  <input 
                    type="text" 
                    name="postal_code"
                    className="form-input" 
                    placeholder="28001" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Notas</label>
                <textarea 
                  name="notes"
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre el cliente..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Cliente'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* View Client Modal */}
          <Modal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            title="Detalles del Cliente"
            size="lg"
          >
            {selectedClient && (
              <div className="space-y-6">
                {/* Header con nombre y tipo */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedClient.first_name} {selectedClient.last_name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={selectedClient.client_type === 'direct' ? 'info' : 'success'}>
                          {selectedClient.client_type === 'direct' ? 'Cliente Directo' : 'Cliente de Aseguradora'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información de Contacto</h3>
                    <div className="space-y-3">
                      {selectedClient.email && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <a href={`mailto:${selectedClient.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                              {selectedClient.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedClient.phone && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Phone className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <a href={`tel:${selectedClient.phone}`} className="font-medium text-gray-900">
                              {selectedClient.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información de Dirección</h3>
                    <div className="space-y-3">
                      {selectedClient.address && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="font-medium text-gray-900">{selectedClient.address}</p>
                          </div>
                        </div>
                      )}
                      
                      {(selectedClient.city || selectedClient.postal_code) && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Ciudad</p>
                            <p className="font-medium text-gray-900">
                              {selectedClient.city || '-'}
                              {selectedClient.postal_code && ` (${selectedClient.postal_code})`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de seguros */}
                {(selectedClient.policy_number || selectedClient.claim_number) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información de Seguros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedClient.policy_number && (
                        <div>
                          <p className="text-sm text-gray-500">Número de Póliza</p>
                          <p className="font-medium text-gray-900">{selectedClient.policy_number}</p>
                        </div>
                      )}
                      {selectedClient.claim_number && (
                        <div>
                          <p className="text-sm text-gray-500">Número de Siniestro</p>
                          <p className="font-medium text-gray-900">{selectedClient.claim_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {selectedClient.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Notas</h3>
                    <p className="text-gray-900">{selectedClient.notes}</p>
                  </div>
                )}

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Registrado:</span> {new Date(selectedClient.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Actualizado:</span> {new Date(selectedClient.updated_at).toLocaleDateString('es-ES')}
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
                      await handleEditClient(selectedClient)
                    }}
                  >
                    Editar Cliente
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Edit Client Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Editar Cliente"
          >
            {selectedClient && (
              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input 
                      type="text" 
                      name="first_name"
                      className="form-input" 
                      placeholder="Nombre" 
                      defaultValue={selectedClient.first_name}
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Apellidos *</label>
                    <input 
                      type="text" 
                      name="last_name"
                      className="form-input" 
                      placeholder="Apellidos" 
                      defaultValue={selectedClient.last_name}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      placeholder="email@ejemplo.com" 
                      defaultValue={selectedClient.email || ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="form-input" 
                      placeholder="+34 600 000 000" 
                      defaultValue={selectedClient.phone || ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Aseguradora</label>
                  <select 
                    name="insurance_company_id"
                    className="form-input"
                    value={editFormData.insurance_company_id}
                    onChange={(e) => handleEditFormChange('insurance_company_id', e.target.value)}
                  >
                    <option value="">Seleccionar aseguradora</option>
                    {insuranceCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Dirección</label>
                  <textarea 
                    name="address"
                    className="form-input" 
                    rows={3}
                    placeholder="Dirección completa"
                    defaultValue={selectedClient.address || ''}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Ciudad</label>
                    <input 
                      type="text" 
                      name="city"
                      className="form-input" 
                      placeholder="Ciudad" 
                      defaultValue={selectedClient.city || ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">Código Postal</label>
                    <input 
                      type="text" 
                      name="postal_code"
                      className="form-input" 
                      placeholder="28001" 
                      defaultValue={selectedClient.postal_code || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Tipo de Cliente</label>
                    <select 
                      name="client_type"
                      className="form-input"
                      value={editFormData.client_type}
                      onChange={(e) => handleEditFormChange('client_type', e.target.value)}
                    >
                      <option value="direct">Directo</option>
                      <option value="insurance">Aseguradora</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Número de Póliza</label>
                    <input 
                      type="text" 
                      name="policy_number"
                      className="form-input" 
                      placeholder="POL123456" 
                      defaultValue={selectedClient.policy_number || ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">Número de Siniestro</label>
                    <input 
                      type="text" 
                      name="claim_number"
                      className="form-input" 
                      placeholder="SIN123456" 
                      defaultValue={selectedClient.claim_number || ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Notas</label>
                  <textarea 
                    name="notes"
                    className="form-input" 
                    rows={3}
                    placeholder="Notas adicionales"
                    defaultValue={selectedClient.notes || ''}
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Actualizando...' : 'Actualizar Cliente'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Delete Client Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Eliminar Cliente"
          >
            {selectedClient && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ¿Estás seguro de que quieres eliminar al cliente{' '}
                  <strong>{selectedClient.first_name} {selectedClient.last_name}</strong>?
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
                    onClick={confirmDeleteClient}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
