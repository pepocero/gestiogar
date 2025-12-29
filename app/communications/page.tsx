'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, MessageSquare, User, Wrench, Calendar, ArrowUpRight, ArrowDownLeft, Reply, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseTable } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import toast from 'react-hot-toast'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

interface Conversation {
  id: string
  subject: string
  status: string
  client_id?: string
  technician_id?: string
  job_id?: string
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
  communications: Communication[]
}

interface Communication {
  id: string
  communication_type: string
  direction: string
  subject: string
  content: string
  client_id?: string
  technician_id?: string
  job_id?: string
  conversation_id: string
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
}

export default function CommunicationsPage() {
  const { company, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    direction: 'all',
    status: 'all'
  })
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    technician_id: '',
    job_id: '',
    communication_type: '',
    direction: 'sent',
    subject: '',
    content: '',
    conversation_id: '',
  })
  const loadingRef = useRef(false)

  const loadConversations = useCallback(async () => {
    if (!company?.id || loadingRef.current) {
      if (!company?.id) {
        setLoading(false)
      }
      return
    }

    loadingRef.current = true
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Communications] loadConversations start', company.id)
      }
      setLoading(true)
      
      // Obtener límites del plan
      const limits = await getPlanLimits(company.id)
      
      let query = supabase
        .from('conversations')
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
          ),
          communications (
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
          )
        `)
        .eq('company_id', company.id)
      
      // Aplicar límite según el plan (ordenar por created_at para plan free)
      // Nota: applyPlanLimit ya aplica el orden, pero para conversations queremos ordenar por updated_at
      if (limits.max_conversations === null) {
        // Plan Pro - ordenar por updated_at descendente
        query = query.order('updated_at', { ascending: false })
      } else {
        // Plan Free - aplicar límite con orden por created_at
        query = applyPlanLimit(query, limits.max_conversations, 'created_at', true)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Ordenar comunicaciones dentro de cada conversación por fecha
      const conversationsWithOrderedComms = (data || []).map((conv: any) => ({
        ...conv,
        communications: conv.communications.sort((a: Communication, b: Communication) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }))

      setConversations(conversationsWithOrderedComms)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Communications] loadConversations success', {
          companyId: company.id,
          count: conversationsWithOrderedComms.length
        })
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Error al cargar las conversaciones')
    } finally {
      setLoading(false)
      loadingRef.current = false
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Communications] loadConversations finished', company.id)
      }
    }
  }, [company?.id])

  useEffect(() => {
    // Esperar a que la autenticación termine y company esté disponible
    if (!authLoading && company?.id && !loadingRef.current) {
      loadConversations()
    } else if (!authLoading && !company?.id) {
      setLoading(false)
    }
  }, [authLoading, company?.id, loadConversations])

  // Aplicar filtros cuando cambien las conversaciones o los filtros
  useEffect(() => {
    applyFilters()
  }, [conversations, filters])

  // Cargar datos al abrir el modal
  useEffect(() => {
    if ((showCreateModal || showEditModal) && company?.id) {
      fetchClientsAndTechnicians()
    }
  }, [showCreateModal, showEditModal, company?.id])

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
          console.log('[Communications] fetchClients success', {
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
          console.log('[Communications] fetchTechnicians success', {
            companyId: company.id,
            count: techniciansData?.length || 0
          })
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = [...conversations]

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(conversation => 
        conversation.subject?.toLowerCase().includes(searchTerm) ||
        conversation.clients?.first_name?.toLowerCase().includes(searchTerm) ||
        conversation.clients?.last_name?.toLowerCase().includes(searchTerm) ||
        conversation.communications.some(comm => 
          comm.content?.toLowerCase().includes(searchTerm) ||
          comm.subject?.toLowerCase().includes(searchTerm)
        )
      )
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(conversation => conversation.status === filters.status)
    }

    // Filtro de tipo (aplicado a las comunicaciones dentro de las conversaciones)
    if (filters.type !== 'all') {
      filtered = filtered.filter(conversation => 
        conversation.communications.some(comm => comm.communication_type === filters.type)
      )
    }

    // Filtro de dirección (aplicado a las comunicaciones dentro de las conversaciones)
    if (filters.direction !== 'all') {
      filtered = filtered.filter(conversation => 
        conversation.communications.some(comm => comm.direction === filters.direction)
      )
    }

    setFilteredConversations(filtered)
  }

  // Función para manejar cambios en los filtros
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      direction: 'all',
      status: 'all'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateCommunication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      let conversationId = formData.conversation_id

      // Si no hay conversation_id, crear una nueva conversación
      if (!conversationId) {
        const { data: conversationData, error: conversationError } = await supabaseTable('conversations')
          .insert([{
            company_id: company.id,
            client_id: formData.client_id || null,
            technician_id: formData.technician_id || null,
            job_id: formData.job_id || null,
            subject: formData.subject,
            status: 'active'
          }])
          .select()

        if (conversationError) {
          console.error('Error creating conversation:', conversationError)
          toast.error('Error al crear la conversación: ' + conversationError.message)
          return
        }

        conversationId = conversationData[0].id
      }

      // Crear la comunicación
      const communicationData = {
        company_id: company.id,
        client_id: formData.client_id || null,
        technician_id: formData.technician_id || null,
        job_id: formData.job_id || null,
        communication_type: formData.communication_type,
        direction: formData.direction,
        subject: formData.subject,
        content: formData.content,
        conversation_id: conversationId,
      }

      const { data, error } = await supabaseTable('communications')
        .insert([communicationData])
        .select()

      if (error) {
        console.error('Error creating communication:', error)
        toast.error('Error al crear la comunicación: ' + error.message)
        return
      }

      toast.success('Comunicación creada exitosamente')
      setShowCreateModal(false)
      resetForm()
      loadConversations()
      
    } catch (error) {
      console.error('Error creating communication:', error)
      toast.error('Error inesperado al crear la comunicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowViewModal(true)
  }

  const handleEdit = (communication: Communication) => {
    setSelectedCommunication(communication)
    setFormData({
      client_id: communication.client_id || '',
      technician_id: communication.technician_id || '',
      job_id: communication.job_id || '',
      communication_type: communication.communication_type || '',
      direction: communication.direction || 'sent',
      subject: communication.subject || '',
      content: communication.content || '',
      conversation_id: communication.conversation_id,
    })
    setShowEditModal(true)
  }

  const handleDelete = (communication: Communication) => {
    setSelectedCommunication(communication)
    setShowDeleteModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company || !selectedCommunication) return

    setIsUpdating(true)

    try {
      const communicationData = {
        client_id: formData.client_id || null,
        technician_id: formData.technician_id || null,
        job_id: formData.job_id || null,
        communication_type: formData.communication_type,
        direction: formData.direction,
        subject: formData.subject,
        content: formData.content,
      }

      const { error } = await supabaseTable('communications')
        .update(communicationData)
        .eq('id', selectedCommunication.id)

      if (error) {
        console.error('Error updating communication:', error)
        toast.error('Error al actualizar la comunicación: ' + error.message)
        return
      }

      toast.success('Comunicación actualizada correctamente')
      setShowEditModal(false)
      setSelectedCommunication(null)
      resetForm()
      loadConversations()
      
    } catch (error) {
      console.error('Error updating communication:', error)
      toast.error('Error inesperado al actualizar la comunicación')
    } finally {
      setIsUpdating(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedCommunication) return

    try {
      const { error } = await supabaseTable('communications')
        .delete()
        .eq('id', selectedCommunication.id)

      if (error) {
        throw error
      }

      toast.success('Comunicación eliminada correctamente')
      setShowDeleteModal(false)
      setSelectedCommunication(null)
      loadConversations()
    } catch (error) {
      console.error('Error deleting communication:', error)
      toast.error('Error al eliminar la comunicación')
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: '',
      technician_id: '',
      job_id: '',
      communication_type: '',
      direction: 'sent',
      subject: '',
      content: '',
      conversation_id: '',
    })
  }

  const handleNewCommunication = () => {
    setSelectedCommunication(null)
    resetForm()
    setShowCreateModal(true)
  }

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getDirectionIcon = (direction: string) => {
    return direction === 'sent' ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownLeft className="h-4 w-4 text-blue-600" />
  }

  const handleReply = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setFormData({
      client_id: conversation.client_id || '',
      technician_id: conversation.technician_id || '',
      job_id: conversation.job_id || '',
      communication_type: 'email', // Default para respuestas
      direction: 'sent',
      subject: `Re: ${conversation.subject}`,
      content: '',
      conversation_id: conversation.id,
    })
    setShowCreateModal(true)
  }

  const handleChangeStatus = async (conversation: Conversation, newStatus: string) => {
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    try {
      const { error } = await supabaseTable('conversations')
        .update({ status: newStatus })
        .eq('id', conversation.id)
        .eq('company_id', company.id)

      if (error) {
        console.error('Error updating conversation status:', error)
        toast.error('Error al cambiar el estado de la conversación')
        return
      }

      toast.success(`Conversación marcada como ${newStatus === 'active' ? 'Activa' : newStatus === 'closed' ? 'Cerrada' : 'Archivada'}`)
      loadConversations()
    } catch (error) {
      console.error('Error updating conversation status:', error)
      toast.error('Error inesperado al cambiar el estado')
    }
  }
  return (
    <div className="space-y-6">
      <SubscriptionBanner />
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
              <p className="text-gray-600">Gestiona la comunicación con clientes</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={handleNewCommunication}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Comunicación
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por asunto, contenido o cliente..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="phone">Llamada telefónica</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="in_person">Presencial</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={filters.direction}
                    onChange={(e) => handleFilterChange('direction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas las direcciones</option>
                    <option value="sent">Enviadas</option>
                    <option value="received">Recibidas</option>
                  </select>
                </div>
                
                <div className="sm:w-48">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activa</option>
                    <option value="closed">Cerrada</option>
                    <option value="archived">Archivada</option>
                  </select>
                </div>
                
                <div className="sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Lista de conversaciones */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Conversaciones ({filteredConversations.length} de {conversations.length})
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando conversaciones...</p>
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-4">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <div key={conversation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          {/* Icono de la conversación */}
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            <MessageSquare className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Información de la conversación */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {conversation.clients ? 
                                    `${conversation.clients.first_name} ${conversation.clients.last_name}` : 
                                    'Cliente no asignado'
                                  }
                                </h3>
                                
                                <p className="text-sm text-gray-600 mb-3">
                                  {conversation.subject}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>
                                      {new Date(conversation.updated_at).toLocaleDateString('es-ES')} a las {new Date(conversation.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  {conversation.technicians && (
                                    <div className="flex items-center space-x-2">
                                      <Wrench className="h-4 w-4 text-gray-400" />
                                      <span>{conversation.technicians.first_name} {conversation.technicians.last_name}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={
                                      conversation.status === 'active' ? 'success' :
                                      conversation.status === 'closed' ? 'gray' :
                                      'warning'
                                    }>
                                      {conversation.status === 'active' ? 'Activa' :
                                       conversation.status === 'closed' ? 'Cerrada' :
                                       'Archivada'}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Última comunicación */}
                                {conversation.communications.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      {getCommunicationIcon(conversation.communications[conversation.communications.length - 1].communication_type)}
                                      {getDirectionIcon(conversation.communications[conversation.communications.length - 1].direction)}
                                      <span className="text-xs text-gray-500">
                                        Última comunicación • {conversation.communications.length} mensaje{conversation.communications.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                      {conversation.communications[conversation.communications.length - 1].content}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Acciones */}
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(conversation)}
                                    title="Ver conversación"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReply(conversation)}
                                    title="Responder"
                                  >
                                    <Reply className="h-4 w-4" />
                                  </Button>
                                  <div className="relative group">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      title="Cambiar estado"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                      <div className="py-1">
                                        {conversation.status !== 'active' && (
                                          <button
                                            onClick={() => handleChangeStatus(conversation, 'active')}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                                          >
                                            Marcar como Activa
                                          </button>
                                        )}
                                        {conversation.status !== 'closed' && (
                                          <button
                                            onClick={() => handleChangeStatus(conversation, 'closed')}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                          >
                                            Marcar como Cerrada
                                          </button>
                                        )}
                                        {conversation.status !== 'archived' && (
                                          <button
                                            onClick={() => handleChangeStatus(conversation, 'archived')}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                                          >
                                            Archivar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No se encontraron conversaciones
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Intenta ajustar los filtros de búsqueda.
                      </p>
                      <div className="mt-6">
                        <Button onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay conversaciones
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza registrando tu primera comunicación.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleNewCommunication}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Comunicación
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Create Communication Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              resetForm()
            }}
            title="Nueva Comunicación"
          >
            <form onSubmit={handleCreateCommunication} className="space-y-4">
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
                  <label className="form-label">Técnico</label>
                  <select 
                    name="technician_id" 
                    value={formData.technician_id}
                    onChange={handleInputChange}
                    className="form-input"
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
                  <label className="form-label">Tipo de Comunicación *</label>
                  <select 
                    name="communication_type" 
                    value={formData.communication_type}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="phone">Llamada telefónica</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="in_person">Presencial</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Dirección *</label>
                  <select 
                    name="direction" 
                    value={formData.direction}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="sent">Enviada</option>
                    <option value="received">Recibida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Asunto *</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="Asunto de la comunicación" 
                  required
                />
              </div>

              <div>
                <label className="form-label">Contenido *</label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="form-input" 
                  rows={4}
                  placeholder="Contenido de la comunicación..."
                  required
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
                  {isSubmitting ? 'Creando...' : 'Crear Comunicación'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Modal para ver conversación completa */}
          <Modal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false)
              setSelectedConversation(null)
            }}
            title="Conversación"
            size="lg"
          >
            {selectedConversation && (
              <div className="space-y-6">
                {/* Header de la conversación */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedConversation.clients ? 
                          `${selectedConversation.clients.first_name} ${selectedConversation.clients.last_name}` : 
                          'Cliente no asignado'
                        }
                      </h2>
                      <p className="text-lg text-gray-600 mt-1">
                        {selectedConversation.subject}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={
                          selectedConversation.status === 'active' ? 'success' :
                          selectedConversation.status === 'closed' ? 'gray' :
                          'warning'
                        }>
                          {selectedConversation.status === 'active' ? 'Activa' :
                           selectedConversation.status === 'closed' ? 'Cerrada' :
                           'Archivada'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {selectedConversation.communications.length} mensaje{selectedConversation.communications.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewModal(false)
                      handleReply(selectedConversation)
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                </div>

                {/* Información de la conversación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información de la Conversación</h3>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Última actualización</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedConversation.updated_at).toLocaleDateString('es-ES')} a las {new Date(selectedConversation.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Creada</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedConversation.created_at).toLocaleDateString('es-ES')} a las {new Date(selectedConversation.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
                    
                    {selectedConversation.clients && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium text-gray-900">
                            {selectedConversation.clients.first_name} {selectedConversation.clients.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedConversation.technicians && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Técnico</p>
                          <p className="font-medium text-gray-900">
                            {selectedConversation.technicians.first_name} {selectedConversation.technicians.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hilo de comunicaciones */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hilo de Comunicaciones</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedConversation.communications.map((communication, index) => (
                      <div key={communication.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            {getCommunicationIcon(communication.communication_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getDirectionIcon(communication.direction)}
                              <span className="text-sm font-medium text-gray-900">
                                {communication.direction === 'sent' ? 'Enviada' : 'Recibida'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(communication.created_at).toLocaleDateString('es-ES')} a las {new Date(communication.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Badge variant="info" className="text-xs">
                                {communication.communication_type === 'phone' ? 'Llamada' :
                                 communication.communication_type === 'email' ? 'Email' :
                                 communication.communication_type === 'whatsapp' ? 'WhatsApp' :
                                 communication.communication_type === 'sms' ? 'SMS' :
                                 communication.communication_type === 'in_person' ? 'Presencial' :
                                 'Otro'}
                              </Badge>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{communication.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewModal(false)
                      setSelectedConversation(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewModal(false)
                      handleReply(selectedConversation)
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal para editar comunicación */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedCommunication(null)
              resetForm()
            }}
            title="Editar Comunicación"
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
                  <label className="form-label">Técnico</label>
                  <select 
                    name="technician_id" 
                    value={formData.technician_id}
                    onChange={handleInputChange}
                    className="form-input"
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
                  <label className="form-label">Tipo de Comunicación *</label>
                  <select 
                    name="communication_type" 
                    value={formData.communication_type}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="phone">Llamada telefónica</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="in_person">Presencial</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Dirección *</label>
                  <select 
                    name="direction" 
                    value={formData.direction}
                    onChange={handleInputChange}
                    className="form-input" 
                    required
                  >
                    <option value="sent">Enviada</option>
                    <option value="received">Recibida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Asunto *</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="Asunto de la comunicación" 
                  required
                />
              </div>

              <div>
                <label className="form-label">Contenido *</label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="form-input" 
                  rows={4}
                  placeholder="Contenido de la comunicación..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCommunication(null)
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
                  {isUpdating ? 'Actualizando...' : 'Actualizar Comunicación'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Modal para confirmar eliminación */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedCommunication(null)
            }}
            title="Confirmar Eliminación"
          >
            {selectedCommunication && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ¿Estás seguro de que quieres eliminar la comunicación <strong>"{selectedCommunication.subject}"</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedCommunication(null)
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
