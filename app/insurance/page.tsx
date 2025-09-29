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
import { Plus, Edit, Trash2, Building2, Phone, Mail, Globe } from 'lucide-react'

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
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta aseguradora?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Aseguradora eliminada correctamente')
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Términos de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
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
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(company.id)}
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
      </Layout>
    </ProtectedRoute>
  )
}
