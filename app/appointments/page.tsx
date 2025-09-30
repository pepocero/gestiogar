'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar, Clock, MapPin, User, Wrench } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  appointment_type: string
  scheduled_date: string
  duration_minutes: number
  status: string
  notes: string
  client_id: string
  technician_id: string
  job_id: string
  clients?: {
    id: string
    first_name: string
    last_name: string
  }
  technicians?: {
    id: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

export default function AppointmentsPage() {
  const { company } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])

  useEffect(() => {
    if (company) {
      loadAppointments()
    }
  }, [company])

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (showCreateModal && company?.id) {
      fetchClientsAndTechnicians()
    }
  }, [showCreateModal, company?.id])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          ),
          technicians (
            id,
            first_name,
            last_name
          )
        `)
        .eq('company_id', company!.id)
        .order('scheduled_date', { ascending: true })

      if (error) {
        throw error
      }

      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

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
      
      // Combinar fecha y hora en un timestamp
      const scheduledDate = formData.get('scheduled_date') as string
      const scheduledTime = formData.get('scheduled_time') as string
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      
      const appointmentData = {
        company_id: company.id,
        client_id: formData.get('client_id') as string || null,
        technician_id: formData.get('technician_id') as string || null,
        job_id: null, // No se incluye en el formulario actual
        appointment_type: formData.get('appointment_type') as string || 'inspection',
        scheduled_date: scheduledDateTime,
        duration_minutes: numberWithValue(formData.get('estimated_duration')) || 60,
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
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      loadAppointments() // Recargar la lista de citas
      
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
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Lista de Citas ({appointments.length})
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando citas...</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        {/* Icono de la cita */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                        
                        {/* Información de la cita */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {appointment.appointment_type.charAt(0).toUpperCase() + appointment.appointment_type.slice(1)}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {new Date(appointment.scheduled_date).toLocaleDateString('es-ES')} a las {new Date(appointment.scheduled_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{appointment.duration_minutes} minutos</span>
                                </div>
                                
                                {appointment.clients && (
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{appointment.clients.first_name} {appointment.clients.last_name}</span>
                                  </div>
                                )}
                                
                                {appointment.technicians && (
                                  <div className="flex items-center space-x-2">
                                    <Wrench className="h-4 w-4 text-gray-400" />
                                    <span>{appointment.technicians.first_name} {appointment.technicians.last_name}</span>
                                  </div>
                                )}
                                
                                {appointment.notes && (
                                  <div className="flex items-center space-x-2 md:col-span-2">
                                    <span className="truncate text-gray-500">{appointment.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Estado y acciones */}
                            <div className="flex flex-col items-end space-y-2 ml-4">
                              <Badge variant={
                                appointment.status === 'completed' ? 'success' :
                                appointment.status === 'cancelled' ? 'danger' :
                                appointment.status === 'in_progress' ? 'warning' :
                                'info'
                              }>
                                {appointment.status === 'scheduled' ? 'Programada' :
                                 appointment.status === 'confirmed' ? 'Confirmada' :
                                 appointment.status === 'in_progress' ? 'En Progreso' :
                                 appointment.status === 'completed' ? 'Completada' :
                                 appointment.status === 'cancelled' ? 'Cancelada' :
                                 appointment.status}
                              </Badge>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Editar cita"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Eliminar cita"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay citas programadas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza programando tu primera cita.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Cita
                    </Button>
                  </div>
                </div>
              )}
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
                  <label className="form-label">Estado</label>
                  <select name="status" className="form-input">
                    <option value="scheduled">Programada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
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
