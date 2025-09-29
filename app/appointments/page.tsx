'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AppointmentsPage() {
  const { company } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])

  // Cargar datos al abrir el modal
  React.useEffect(() => {
    if (showCreateModal && company?.id) {
      fetchClientsAndTechnicians()
    }
  }, [showCreateModal, company?.id])

  const fetchClientsAndTechnicians = async () => {
    if (!company?.id) return
    
    try {
      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('company_id', company.id)

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      } else {
        setClients(clientsData || [])
      }

      // Cargar técnicos
      const { data: techniciansData, error: techniciansError } = await supabase
        .from('technicians')
        .select('id, first_name, last_name')
        .eq('company_id', company.id)

      if (techniciansError) {
        console.error('Error fetching technicians:', techniciansError)
      } else {
        setTechnicians(techniciansData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const appointmentData = {
        company_id: company.id,
        client_id: formData.get('client_id') as string,
        technician_id: formData.get('technician_id') as string,
        scheduled_date: formData.get('scheduled_date') as string + ' ' + (formData.get('scheduled_time') as string),
        appointment_type: formData.get('appointment_type') as string,
        estimated_duration: numberWithValue(formData.get('estimated_duration')),
        address: formData.get('address') as string,
        description: formData.get('description') as string || null,
        priority: formData.get('priority') as string || 'normal',
        status: formData.get('status') as string || 'scheduled',
        notes: formData.get('notes') as string || null,
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()

      if (error) {
        console.error('Error creating appointment:', error)
        toast.error('Error al crear la cita: ' + error.message)
        return
      }

      toast.success('Cita creada exitosamente')
      setShowCreateModal(false)
      e.currentTarget.reset()
      
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Error inesperado al crear la cita')
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
              <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
              <p className="text-gray-600">Gestiona las citas y programación</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
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
                      placeholder="Buscar citas..."
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                <Button variant="secondary">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="secondary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Vista Calendario
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader title="Lista de Citas" />
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Cliente</th>
                    <th>Técnico</th>
                    <th>Tipo</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No hay citas programadas
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Appointment Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nueva Cita"
          >
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Cliente *</label>
                  <select name="client_id" className="form-input" required>
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Técnico *</label>
                  <select name="technician_id" className="form-input" required>
                    <option value="">Seleccionar técnico</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.first_name} {technician.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha *</label>
                  <input 
                    type="date" 
                    name="scheduled_date"
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Hora *</label>
                  <input 
                    type="time" 
                    name="scheduled_time"
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tipo de Cita *</label>
                  <select name="appointment_type" className="form-input" required>
                    <option value="">Seleccionar tipo</option>
                    <option value="reparacion">Reparación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="instalacion">Instalación</option>
                    <option value="revision">Revisión</option>
                    <option value="presupuesto">Presupuesto</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duración Estimada (min)</label>
                  <input 
                    type="number" 
                    name="estimated_duration"
                    className="form-input" 
                    placeholder="60" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Dirección de la Cita *</label>
                <textarea 
                  name="address"
                  className="form-input" 
                  rows={3}
                  placeholder="Dirección completa donde se realizará la cita..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="form-label">Descripción del Trabajo</label>
                <textarea 
                  name="description"
                  className="form-input" 
                  rows={3}
                  placeholder="Descripción detallada del trabajo a realizar..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prioridad</label>
                  <select name="priority" className="form-input">
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                    <option value="emergencia">Emergencia</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Estado</label>
                  <select name="status" className="form-input">
                    <option value="scheduled">Programada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Notas Adicionales</label>
                <textarea 
                  name="notes"
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre la cita..."
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
                  {isSubmitting ? 'Creando...' : 'Crear Cita'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
