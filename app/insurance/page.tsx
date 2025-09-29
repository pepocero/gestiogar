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
import { Plus, Edit, Trash2, Eye, Building2, Phone, Mail, Globe, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

interface InsuranceCompany {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  portal_url: string
  api_endpoint: string
  billing_terms: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function InsurancePage() {
  const { company } = useAuth()
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<InsuranceCompany | null>(null)
  const [viewingCompany, setViewingCompany] = useState<InsuranceCompany | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    portal_url: '',
    api_endpoint: '',
    billing_terms: 30,
    is_active: true,
  })

  useEffect(() => {
    if (company) {
      loadInsuranceCompanies()
    }
  }, [company])

  const loadInsuranceCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('company_id', company!.id)
        .order('name')

      if (error) {
        throw error
      }

      setInsuranceCompanies(data || [])
    } catch (error) {
      console.error('Error loading insurance companies:', error)
      toast.error('Error al cargar las aseguradoras')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      if (editingCompany) {
        // Actualizar aseguradora existente
        const { error } = await supabase
          .from('insurance_companies')
          .update(formData)
          .eq('id', editingCompany.id)

        if (error) {
          throw error
        }

        toast.success('Aseguradora actualizada correctamente')
      } else {
        // Crear nueva aseguradora
        const { error } = await supabase
          .from('insurance_companies')
          .insert([{
            ...formData,
            company_id: company.id
          }])

        if (error) {
          throw error
        }

        toast.success('Aseguradora creada correctamente')
      }

      setShowModal(false)
      setEditingCompany(null)
      resetForm()
      loadInsuranceCompanies()
    } catch (error) {
      console.error('Error saving insurance company:', error)
      toast.error('Error al guardar la aseguradora')
    }
  }

  const handleView = (company: InsuranceCompany) => {
    setViewingCompany(company)
    setShowViewModal(true)
  }

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      contact_person: company.contact_person,
      email: company.email,
      phone: company.phone,
      address: company.address,
      portal_url: company.portal_url,
      api_endpoint: company.api_endpoint,
      billing_terms: company.billing_terms,
      is_active: company.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = (company: InsuranceCompany) => {
    setDeletingCompany(company)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCompany) return

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', deletingCompany.id)

      if (error) {
        throw error
      }

      toast.success('Aseguradora eliminada correctamente')
      setShowDeleteModal(false)
      setDeletingCompany(null)
      loadInsuranceCompanies()
    } catch (error) {
      console.error('Error deleting insurance company:', error)
      toast.error('Error al eliminar la aseguradora')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      portal_url: '',
      api_endpoint: '',
      billing_terms: 30,
      is_active: true,
    })
  }

  const handleNewCompany = () => {
    setEditingCompany(null)
    resetForm()
    setShowModal(true)
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
              Aseguradoras
            </h1>
            <p className="text-gray-600">
              Gestiona las aseguradoras con las que trabajas.
            </p>
          </div>
          <Button onClick={handleNewCompany} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Aseguradora</span>
          </Button>
        </div>

        {/* Lista de aseguradoras */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Aseguradoras ({insuranceCompanies.length})
            </h3>
          </CardHeader>
          <CardBody>
            {insuranceCompanies.length > 0 ? (
              <Table>
                <TableBody>
                  {insuranceCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-primary-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {company.name}
                            </div>
                            {company.contact_person && (
                              <div className="text-sm text-gray-500">
                                {company.contact_person}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.contact_person || '-'}
                      </TableCell>
                      <TableCell>
                        {company.email ? (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{company.email}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {company.phone ? (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{company.phone}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {company.billing_terms} días
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? 'success' : 'danger'}>
                          {company.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(company)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(company)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(company)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay aseguradoras
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza agregando tu primera aseguradora.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNewCompany}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Aseguradora
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal para crear/editar aseguradora */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nombre de la Aseguradora *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Input
                label="Persona de Contacto"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Portal Web"
                name="portal_url"
                type="url"
                value={formData.portal_url}
                onChange={handleInputChange}
                placeholder="https://"
              />
            </div>

            <div>
              <Input
                label="API Endpoint"
                name="api_endpoint"
                value={formData.api_endpoint}
                onChange={handleInputChange}
                placeholder="https://api.aseguradora.com"
              />
            </div>

            <div>
              <Input
                label="Términos de Pago (días)"
                name="billing_terms"
                type="number"
                value={formData.billing_terms}
                onChange={handleInputChange}
                min="1"
                max="365"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Aseguradora activa
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
              {editingCompany ? 'Actualizar' : 'Crear'} Aseguradora
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver detalles de aseguradora */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Aseguradora"
        size="lg"
      >
        {viewingCompany && (
          <div className="space-y-6">
            {/* Header con nombre y estado */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingCompany.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {viewingCompany.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={viewingCompany.is_active ? 'success' : 'danger'}>
                      {viewingCompany.is_active ? 'Activa' : 'Inactiva'}
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
                  {viewingCompany.contact_person && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Persona de Contacto</p>
                        <p className="font-medium text-gray-900">{viewingCompany.contact_person}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${viewingCompany.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {viewingCompany.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <a href={`tel:${viewingCompany.phone}`} className="font-medium text-gray-900">
                          {viewingCompany.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información Técnica</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Términos de Pago</p>
                      <p className="font-medium text-gray-900">{viewingCompany.billing_terms} días</p>
                    </div>
                  </div>
                  
                  {viewingCompany.portal_url && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Portal Web</p>
                        <a 
                          href={viewingCompany.portal_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {viewingCompany.portal_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.api_endpoint && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">API Endpoint</p>
                        <p className="font-medium text-gray-900 font-mono text-sm">{viewingCompany.api_endpoint}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            {viewingCompany.address && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Dirección</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-gray-900">{viewingCompany.address}</p>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creada:</span> {new Date(viewingCompany.created_at).toLocaleDateString('es-ES')}
              </div>
              <div>
                <span className="font-medium">Actualizada:</span> {new Date(viewingCompany.updated_at).toLocaleDateString('es-ES')}
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
                  handleEdit(viewingCompany)
                }}
              >
                Editar Aseguradora
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Aseguradora"
      >
        {deletingCompany && (
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Estás seguro de que quieres eliminar la aseguradora{' '}
              <strong>{deletingCompany.name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
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
