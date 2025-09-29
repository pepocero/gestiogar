'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function TechniciansPage() {
  const { company } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const technicianData = {
        company_id: company.id,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        specialty: formData.get('specialty') as string || null,
        experience_level: formData.get('experience_level') as string || null,
        hire_date: formData.get('hire_date') as string || null,
        hourly_rate: numberWithValue(formData.get('hourly_rate')),
        address: formData.get('address') as string || null,
        notes: formData.get('notes') as string || null,
      }

      const { data, error } = await supabase
        .from('technicians')
        .insert([technicianData])
        .select()

      if (error) {
        console.error('Error creating technician:', error)
        toast.error('Error al crear el técnico: ' + error.message)
        return
      }

      toast.success('Técnico creado exitosamente')
      setShowCreateModal(false)
      e.currentTarget.reset()
      
    } catch (error) {
      console.error('Error creating technician:', error)
      toast.error('Error inesperado al crear el técnico')
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
              <h1 className="text-2xl font-bold text-gray-900">Técnicos</h1>
              <p className="text-gray-600">Gestiona el equipo de técnicos</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Técnico
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
                      placeholder="Buscar técnicos..."
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

          {/* Technicians Table */}
          <Card>
            <CardHeader title="Lista de Técnicos" />
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Especialidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay técnicos registrados
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Technician Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nuevo Técnico"
          >
            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input 
                    type="text" 
                    name="first_name"
                    className="form-input" 
                    placeholder="Nombre del técnico" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Apellidos *</label>
                  <input 
                    type="text" 
                    name="last_name"
                    className="form-input" 
                    placeholder="Apellidos del técnico" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-input" 
                    placeholder="tecnico@email.com" 
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className="form-input" 
                    placeholder="+34 600 000 000" 
                  />
                </div>
                <div>
                  <label className="form-label">Especialidad *</label>
                  <select name="specialty" className="form-input" required>
                    <option value="">Seleccionar especialidad</option>
                    <option value="electricidad">Electricidad</option>
                    <option value="fontaneria">Fontanería</option>
                    <option value="carpinteria">Carpintería</option>
                    <option value="pintura">Pintura</option>
                    <option value="albanileria">Albañilería</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Nivel de Experiencia</label>
                  <select name="experience_level" className="form-input">
                    <option value="">Seleccionar nivel</option>
                    <option value="junior">Junior</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="senior">Senior</option>
                    <option value="experto">Experto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Fecha de Contratación</label>
                  <input 
                    type="date" 
                    name="hire_date"
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="form-label">Salario Base (€/hora)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="hourly_rate"
                    className="form-input" 
                    placeholder="15.00" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Dirección</label>
                <textarea 
                  name="address"
                  className="form-input" 
                  rows={3}
                  placeholder="Dirección del técnico..."
                ></textarea>
              </div>

              <div>
                <label className="form-label">Notas</label>
                <textarea 
                  name="notes"
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre el técnico..."
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
                  {isSubmitting ? 'Creando...' : 'Crear Técnico'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
