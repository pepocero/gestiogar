'use client'

import { useState, useEffect } from 'react'
// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar, Clock, MapPin, User, Wrench, List } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseTable } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import toast from 'react-hot-toast'
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'moment/locale/es'
import './calendar.css'

interface Appointment {
  id: string
  appointment_type: string
  scheduled_date: string
  duration_minutes: number
  status: string
  notes: string | null
  client_id: string | null
  technician_id: string | null
  job_id: string | null
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

type AppointmentRow = Appointment & {
  company_id: string
}

interface AppointmentInsert {
  id?: string
  company_id: string
  client_id?: string | null
  technician_id?: string | null
  job_id?: string | null
  appointment_type?: string
  scheduled_date: string
  duration_minutes?: number
  status?: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

export default function AppointmentsPage() {
  const { company, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [formData, setFormData] = useState({
    client_id: '',
    technician_id: '',
    scheduled_date: '',
    scheduled_time: '',
    appointment_type: '',
    estimated_duration: 60,
    status: 'scheduled',
    notes: '',
  })

  useEffect(() => {
    // Esperar a que la autenticación termine y company esté disponible
    if (!authLoading && company?.id) {
      loadAppointments()
    } else if (!authLoading && !company?.id) {
      setLoading(false)
    }
  }, [authLoading, company?.id])

  // Cargar datos al abrir el modal
  useEffect(() => {
    if ((showCreateModal || showEditModal) && company?.id && (clients.length === 0 || technicians.length === 0)) {
      fetchClientsAndTechnicians()
    }
  }, [showCreateModal, showEditModal, company?.id])

  const loadAppointments = async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Appointments] loadAppointments start', company?.id)
      }
      setLoading(true)
      
      // Obtener límites del plan
      const limits = await getPlanLimits(company!.id)
      
      let query = supabase
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
      
      // Aplicar límite según el plan (ordenar por created_at para plan free)
      query = applyPlanLimit(query, limits.max_appointments, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setAppointments((data as Appointment[]) || [])
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Appointments] loadAppointments success', {
          companyId: company?.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Appointments] loadAppointments finished', company?.id)
      }
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
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Appointments] fetchClients success', {
            companyId: company.id,
            count: clientsData?.length || 0
          })
        }
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
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Appointments] fetchTechnicians success', {
            companyId: company.id,
            count: techniciansData?.length || 0
          })
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Appointments] fetchClientsAndTechnicians finished', company.id)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      // Combinar fecha y hora en un timestamp
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString()
      
      const appointmentData: AppointmentInsert = {
        company_id: company.id,
        client_id: formData.client_id || null,
        technician_id: formData.technician_id || null,
        job_id: null, // No se incluye en el formulario actual
        appointment_type: formData.appointment_type || 'inspection',
        scheduled_date: scheduledDateTime,
        duration_minutes: formData.estimated_duration || 60,
        status: formData.status || 'scheduled',
        notes: formData.notes || null,
      }
      const { data, error } = await supabaseTable('appointments')
        .insert(appointmentData)
        .select()

      if (error) {
        console.error('Error creating appointment:', error)
        toast.error('Error al crear la cita: ' + error.message)
        return
      }

      toast.success('Cita creada exitosamente')
      setShowCreateModal(false)
      resetForm()
      loadAppointments() // Recargar la lista de citas
      
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Error inesperado al crear la cita')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowViewModal(true)
  }

  const handleEdit = async (appointment: Appointment) => {
    // Primero, cargar clientes y técnicos si no están cargados
    if (clients.length === 0 || technicians.length === 0) {
      await fetchClientsAndTechnicians()
    }
    
    setSelectedAppointment(appointment)
    
    // Separar fecha y hora del timestamp
    const scheduledDate = new Date(appointment.scheduled_date)
    const dateStr = scheduledDate.toISOString().split('T')[0]
    const timeStr = scheduledDate.toTimeString().slice(0, 5)
    
    // Preparar datos del formulario
    const formDataToSet = {
      client_id: appointment.client_id || '',
      technician_id: appointment.technician_id || '',
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      appointment_type: appointment.appointment_type || 'inspection',
      estimated_duration: appointment.duration_minutes || 60,
      status: appointment.status || 'scheduled',
      notes: appointment.notes || '',
    }
    
    // Setear datos y abrir modal
    setFormData(formDataToSet)
    setShowEditModal(true)
  }

  const handleDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDeleteModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company || !selectedAppointment) return

    setIsUpdating(true)

    try {
      // Combinar fecha y hora en un timestamp
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString()
      
      const appointmentData = {
        client_id: formData.client_id || null,
        technician_id: formData.technician_id || null,
        appointment_type: formData.appointment_type || 'inspection',
        scheduled_date: scheduledDateTime,
        duration_minutes: formData.estimated_duration || 60,
        status: formData.status || 'scheduled',
        notes: formData.notes || null,
      }

      const { error } = await supabaseTable('appointments')
        .update(appointmentData)
        .eq('id', selectedAppointment.id)

      if (error) {
        console.error('Error updating appointment:', error)
        toast.error('Error al actualizar la cita: ' + error.message)
        return
      }

      toast.success('Cita actualizada correctamente')
      setShowEditModal(false)
      setSelectedAppointment(null)
      resetForm()
      loadAppointments()
      
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Error inesperado al actualizar la cita')
    } finally {
      setIsUpdating(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedAppointment) return

    try {
      const { error } = await supabaseTable('appointments')
        .delete()
        .eq('id', selectedAppointment.id)

      if (error) {
        throw error
      }

      toast.success('Cita eliminada correctamente')
      setShowDeleteModal(false)
      setSelectedAppointment(null)
      loadAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Error al eliminar la cita')
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: '',
      technician_id: '',
      scheduled_date: '',
      scheduled_time: '',
      appointment_type: '',
      estimated_duration: 60,
      status: 'scheduled',
      notes: '',
    })
  }

  const handleNewAppointment = () => {
    setSelectedAppointment(null)
    resetForm()
    setShowCreateModal(true)
  }

  // Función para convertir citas al formato del calendario
  const getCalendarEvents = () => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.appointment_type} - ${appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'Sin cliente'}`,
      start: new Date(appointment.scheduled_date),
      end: new Date(new Date(appointment.scheduled_date).getTime() + (appointment.duration_minutes * 60000)),
      resource: appointment,
      status: appointment.status
    }))
  }

  // Función para obtener el color del evento según el estado
  const getEventStyle = (event: any) => {
    const status = event.resource?.status
    switch (status) {
      case 'scheduled':
        return { style: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } }
      case 'confirmed':
        return { style: { backgroundColor: '#10B981', borderColor: '#10B981' } }
      case 'in_progress':
        return { style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' } }
      case 'completed':
        return { style: { backgroundColor: '#6B7280', borderColor: '#6B7280' } }
      case 'cancelled':
        return { style: { backgroundColor: '#EF4444', borderColor: '#EF4444' } }
      default:
        return { style: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } }
    }
  }

  // Función para manejar clic en evento del calendario
  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.resource)
    setShowViewModal(true)
  }

  // Función para manejar selección de fecha/hora en el calendario
  const handleSelectSlot = (slotInfo: any) => {
    const startDate = new Date(slotInfo.start)
    const endDate = new Date(slotInfo.end)
    
    setFormData((prev: any) => ({
      ...prev,
      scheduled_date: startDate.toISOString().split('T')[0],
      scheduled_time: startDate.toTimeString().slice(0, 5),
      estimated_duration: Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    }))
    setShowCreateModal(true)
  }

  // Función para manejar cambio de vista
  const handleViewChange = (view: View) => {
    setCurrentView(view as 'month' | 'week' | 'day' | 'agenda')
  }

  // Función para manejar navegación de fechas
  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  // Helper function to convert string to number or null
  const numberWithValue = (value: FormDataEntryValue | null) => {
    if (!value) return null
    const num = parseFloat(value as string)
    return isNaN(num) ? null : num
  }
  return (
    <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
              <p className="text-gray-600">Gestiona las citas y programación</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={handleNewAppointment}
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
                <Button 
                  variant="secondary"
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                >
                  {viewMode === 'list' ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Vista Calendario
                    </>
                  ) : (
                    <>
                      <List className="h-4 w-4 mr-2" />
                      Vista Lista
                    </>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Appointments List/Calendar */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                {viewMode === 'list' ? `Lista de Citas (${appointments.length})` : `Calendario de Citas (${appointments.length})`}
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando citas...</p>
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="h-[600px]">
                  <BigCalendar
                    localizer={localizer}
                    events={getCalendarEvents()}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    onView={handleViewChange}
                    onNavigate={handleNavigate}
                    view={currentView}
                    date={currentDate}
                    selectable
                    style={{ height: '100%' }}
                    eventPropGetter={getEventStyle}
                    views={['month', 'week', 'day', 'agenda']}
                    step={60}
                    timeslots={1}
                    messages={{
                      next: 'Siguiente',
                      previous: 'Anterior',
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      agenda: 'Agenda',
                      date: 'Fecha',
                      time: 'Hora',
                      event: 'Evento',
                      noEventsInRange: 'No hay citas en este rango de fechas.',
                      showMore: (total: number) => `+ Ver más (${total})`,
                      allDay: 'Todo el día',
                      work_week: 'Semana laboral',
                      yesterday: 'Ayer',
                      tomorrow: 'Mañana'
                    }}
                    culture="es"
                    formats={{
                      dayFormat: 'dddd',
                      dayHeaderFormat: 'dddd, DD MMMM',
                      dayRangeHeaderFormat: ({ start, end }, culture, localizer) => 
                        localizer?.format(start, 'DD MMMM', culture) + ' – ' + 
                        localizer?.format(end, 'DD MMMM', culture),
                      monthHeaderFormat: 'MMMM YYYY',
                      agendaDateFormat: 'dddd, DD MMMM',
                      agendaTimeFormat: 'HH:mm',
                      agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                        localizer?.format(start, 'HH:mm', culture) + ' – ' +
                        localizer?.format(end, 'HH:mm', culture),
                      timeGutterFormat: 'HH:mm',
                      eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                        localizer?.format(start, 'HH:mm', culture) + ' – ' +
                        localizer?.format(end, 'HH:mm', culture),
                      eventTimeRangeStartFormat: ({ start }, culture, localizer) =>
                        localizer?.format(start, 'HH:mm', culture) + ' –',
                      eventTimeRangeEndFormat: ({ end }, culture, localizer) =>
                        '– ' + localizer?.format(end, 'HH:mm', culture)
                    }}
                  />
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
                                  onClick={() => handleView(appointment)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(appointment)}
                                  title="Editar cita"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(appointment)}
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
                    <Button onClick={handleNewAppointment}>
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
            onClose={() => {
              setShowCreateModal(false)
              resetForm()
            }}
            title="Nueva Cita"
          >
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Cliente *</label>
                  <select 
                    name="client_id" 
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
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
                  <select 
                    name="technician_id" 
                    value={formData.technician_id}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
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
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Hora *</label>
                  <input 
                    type="time" 
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tipo de Cita *</label>
                  <select 
                    name="appointment_type" 
                    value={formData.appointment_type}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="inspection">Inspección</option>
                    <option value="revision">Revisión</option>
                    <option value="repair">Reparación</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="installation">Instalación</option>
                    <option value="estimate">Presupuesto</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duración Estimada (min)</label>
                  <input 
                    type="number" 
                    name="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={handleInputChange}
                    className="form-input" 
                    placeholder="60" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Estado</label>
                  <select 
                    name="status" 
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
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
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre la cita..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
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

          {/* Modal para ver detalles de la cita */}
          <Modal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false)
              setSelectedAppointment(null)
            }}
            title="Detalles de la Cita"
          >
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Header con tipo y estado */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedAppointment.appointment_type.charAt(0).toUpperCase() + selectedAppointment.appointment_type.slice(1)}
                      </h2>
                      <Badge variant={
                        selectedAppointment.status === 'completed' ? 'success' :
                        selectedAppointment.status === 'cancelled' ? 'danger' :
                        selectedAppointment.status === 'in_progress' ? 'warning' :
                        'info'
                      }>
                        {selectedAppointment.status === 'scheduled' ? 'Programada' :
                         selectedAppointment.status === 'confirmed' ? 'Confirmada' :
                         selectedAppointment.status === 'in_progress' ? 'En Progreso' :
                         selectedAppointment.status === 'completed' ? 'Completada' :
                         selectedAppointment.status === 'cancelled' ? 'Cancelada' :
                         selectedAppointment.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewModal(false)
                      handleEdit(selectedAppointment)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Cita
                  </Button>
                </div>

                {/* Información de la cita */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información de la Cita</h3>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fecha y Hora</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedAppointment.scheduled_date).toLocaleDateString('es-ES')} a las {new Date(selectedAppointment.scheduled_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duración</p>
                        <p className="font-medium text-gray-900">{selectedAppointment.duration_minutes} minutos</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
                    
                    {selectedAppointment.clients && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium text-gray-900">
                            {selectedAppointment.clients.first_name} {selectedAppointment.clients.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedAppointment.technicians && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Técnico</p>
                          <p className="font-medium text-gray-900">
                            {selectedAppointment.technicians.first_name} {selectedAppointment.technicians.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                {selectedAppointment.notes && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas</h3>
                    <p className="text-gray-600">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Fechas */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Creado:</span> {new Date(selectedAppointment.created_at).toLocaleDateString('es-ES')}
                    </div>
                    <div>
                      <span className="font-medium">Última actualización:</span> {new Date(selectedAppointment.updated_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewModal(false)
                      setSelectedAppointment(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewModal(false)
                      handleEdit(selectedAppointment)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Cita
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal para editar cita */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedAppointment(null)
              resetForm()
            }}
            title="Editar Cita"
          >
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Cliente *</label>
                  <select 
                    name="client_id" 
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
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
                  <select 
                    name="technician_id" 
                    value={formData.technician_id}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
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
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Hora *</label>
                  <input 
                    type="time" 
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tipo de Cita *</label>
                  <select 
                    name="appointment_type" 
                    value={formData.appointment_type}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="inspection">Inspección</option>
                    <option value="revision">Revisión</option>
                    <option value="repair">Reparación</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="installation">Instalación</option>
                    <option value="estimate">Presupuesto</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duración Estimada (min)</label>
                  <input 
                    type="number" 
                    name="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={handleInputChange}
                    className="form-input" 
                    placeholder="60" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Estado</label>
                  <select 
                    name="status" 
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
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
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre la cita..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAppointment(null)
                    resetForm()
                  }}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar Cita'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Modal para confirmar eliminación */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedAppointment(null)
            }}
            title="Confirmar Eliminación"
          >
            {selectedAppointment && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ¿Estás seguro de que quieres eliminar la cita de <strong>{selectedAppointment.appointment_type}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedAppointment(null)
                    }}
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
            )}
          </Modal>
        </div>
  )
}
