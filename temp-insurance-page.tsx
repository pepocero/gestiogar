'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input, Badge } from '@/components/ui'
import { Building2, Plus, Settings, Eye, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InsurancePage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    policies: '',
    billing_terms: 30,
    is_active: true,
    logo_url: ''
  })

  const resetForm = () => {
    setForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      policies: '',
      billing_terms: 30,
      is_active: true,
      logo_url: ''
    })
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      // Simular carga de datos
      const mockData = [
        {
          id: 1,
          name: 'MAPFRE',
          contact_person: 'Juan Pérez',
          email: 'contacto@mapfre.es',
          phone: '+34 91 123 4567',
          is_active: true,
          bills_count: 15
        },
        {
          id: 2,
          name: 'AXA',
          contact_person: 'María García',
          email: 'contacto@axa.es',
          phone: '+34 93 765 4321',
          is_active: true,
          bills_count: 8
        }
      ]
      setCompanies(mockData)
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Error cargando aseguradoras')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      
      if (editingCompany) {
        const updatedCompanies = companies.map(comp => 
          comp.id === editingCompany.id ? { ...comp, ...form } : comp
        )
        setCompanies(updatedCompanies)
        toast.success('Aseguradora actualizada correctamente')
      } else {
        const newCompany = {
          id: Date.now(),
          ...form,
          bills_count: 0
        }
        setCompanies([...companies, newCompany])
        toast.success('Aseguradora creada correctamente')
      }
      
      setShowModal(false)
      setEditingCompany(null)
      resetForm()
    } catch (error) {
      toast.error('Error guardando aseguradora')
    }
  }

  const handleNewCompany = () => {
    setEditingCompany(null)
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (company: any) => {
    setEditingCompany(company)
    setForm({
      name: company.name,
      contact_person: company.contact_person,
      email: company.email,
      phone: company.phone,
      address: company.address || '',
      policies: company.policies || '',
      billing_terms: company.billing_terms || 30,
      is_active: company.is_active,
      logo_url: company.logo_url || ''
    })
    setShowModal(true)
  }

  const handleView = (company: any) => {
    setSelectedCompany(company)
    setShowViewModal(true)
  }

  const handleDelete = (company: any) => {
    setSelectedCompany(company)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedCompany) return
    
    try {
      const filteredCompanies = companies.filter(comp => comp.id !== selectedCompany.id)
      setCompanies(filteredCompanies)
      setShowDeleteModal(false)
      setSelectedCompany(null)
      toast.success('Aseguradora eliminada correctamente')
    } catch (error) {
      toast.error('Error eliminando aseguradora')
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Aseguradoras
          </h1>
          <p className="text-gray-600">
            Gestiona las aseguradoras con las que trabajas.
          </p>
        </div>
        <Button onClick={handleNewCompany} className="flex items-center space-x-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Nueva Aseguradora</span>
        </Button>
      </div>

      {/* Companies List */}
      {companies.length === 0 ? (
        <Card>
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {company.contact_person}
                      </p>
                    </div>
                  </div>
                  <Badge variant={company.is_active ? 'success' : 'secondary'}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Email:</strong> {company.email}</p>
                  <p><strong>Teléfono:</strong> {company.phone}</p>
                  <p><strong>Facturas:</strong> {company.bills_count}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(company)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(company)}
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

      {/* Modal para crear/editar aseguradora */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre de la empresa"
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
        title="Detalles de Aseguradora"
        size="lg"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Empresa</label>
                <p className="text-sm text-gray-900">{selectedCompany.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contacto</label>
                <p className="text-sm text-gray-900">{selectedCompany.contact_person}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedCompany.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{selectedCompany.phone}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleEdit(selectedCompany)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(selectedCompany)}
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
            ¿Estás seguro de que quieres eliminar la aseguradora{' '}
            <strong>{selectedCompany?.name}</strong>?
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
