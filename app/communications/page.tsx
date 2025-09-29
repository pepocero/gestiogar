'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CommunicationsPage() {
  const { company } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<any[]>([])

  // Cargar clientes al abrir el modal
  React.useEffect(() => {
    if (showCreateModal && company?.id) {
      fetchClients()
    }
  }, [showCreateModal, company?.id])

  const fetchClients = async () => {
    if (!company?.id) return
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('company_id', company.id)

      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleCreateCommunication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!company?.id) {
      toast.error('No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const communicationData = {
        company_id: company.id,
        client_id: formData.get('client_id') as string,
        communication_type: formData.get('communication_type') as string,
        direction: formData.get('direction') as string || 'sent',
        communication_date: formData.get('communication_date') as string,
        subject: formData.get('subject') as string,
        content: formData.get('content') as string,
        status: formData.get('status') as string || 'sent',
        priority: formData.get('priority') as string || 'normal',
        requires_followup: formData.get('requires_followup') === 'on',
        followup_date: formData.get('followup_date') as string || null,
        notes: formData.get('notes') as string || null,
      }

      const { data, error } = await supabase
        .from('communications')
        .insert([communicationData])
        .select()

      if (error) {
        console.error('Error creating communication:', error)
        toast.error('Error al crear la comunicación: ' + error.message)
      }

      toast.success('Comunicación creada exitosamente')
      setShowCreateModal(false)
      e.currentTarget.reset()
      
    } catch (error) {
      console.error('Error creating communication:', error)
      toast.error('Error inesperado al crear la comunicación')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
              <p className="text-gray-600">Gestiona la comunicación con clientes</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Comunicación
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
                      placeholder="Buscar comunicaciones..."
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

          {/* Communications Table */}
          <Card>
            <CardHeader title="Historial de Comunicaciones" />
            <CardBody>
              <Table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay comunicaciones registradas
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Communication Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nueva Comunicación"
          >
            <form onSubmit={handleCreateCommunication} className="space-y-4">
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
                  <label className="form-label">Tipo de Comunicación *</label>
                  <select name="communication_type" className="form-input" required>
                    <option value="">Seleccionar tipo</option>
                    <option value="llamada">Llamada telefónica</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="presencial">Presencial</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Dirección de Comunicación</label>
                  <select name="direction" className="form-input">
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha y Hora *</label>
                  <input 
                    type="datetime-local" 
                    name="communication_date"
                    className="form-input" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Asunto *</label>
                <input 
                  type="text" 
                  name="subject"
                  className="form-input" 
                  placeholder="Asunto de la comunicación" 
                  required
                />
              </div>

              <div>
                <label className="form-label">Contenido *</label>
                <textarea 
                  name="content"
                  className="form-input" 
                  rows={4}
                  placeholder="Contenido de la comunicación..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Estado</label>
                  <select name="status" className="form-input">
                    <option value="sent">Enviada</option>
                    <option value="received">Recibida</option>
                    <option value="read">Leída</option>
                    <option value="responded">Respondida</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Prioridad</label>
                  <select name="priority" className="form-input">
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Seguimiento Requerido</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    name="requires_followup"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  <label htmlFor="followUp" className="text-sm text-gray-600">
                    Marcar para seguimiento
                  </label>
                </div>
              </div>

              <div>
                  <label className="form-label">Fecha de Seguimiento</label>
                  <input 
                    type="date" 
                    name="followup_date"
                    className="form-input" 
                  />
              </div>

              <div>
                <label className="form-label">Notas Adicionales</label>
                <textarea 
                  name="notes"
                  className="form-input" 
                  rows={2}
                  placeholder="Notas adicionales sobre la comunicación..."
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
                  {isSubmitting ? 'Creando...' : 'Crear Comunicación'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
