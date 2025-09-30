'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail, User, MapPin, Clock, CheckCircle, XCircle, DollarSign, Wrench, Camera, Upload, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function TechniciansPage() {
  const { company } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loadingTechnicians, setLoadingTechnicians] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)

  // Función para cargar técnicos
  const fetchTechnicians = async () => {
    if (!company?.id) return
    
    setLoadingTechnicians(true)
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching technicians:', error)
        toast.error('Error al cargar los técnicos')
        return
      }

      console.log('Técnicos cargados:', data)
      setTechnicians(data || [])
    } catch (error) {
      console.error('Error fetching technicians:', error)
      toast.error('Error inesperado al cargar los técnicos')
    } finally {
      setLoadingTechnicians(false)
    }
  }

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
        specialties: formData.get('specialties') ? [formData.get('specialties') as string] : null,
        hourly_rate: numberWithValue(formData.get('hourly_rate')),
      }

      console.log('Creating technician with data:', technicianData)

      const { data, error } = await supabase
        .from('technicians')
        .insert([technicianData])
        .select()

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Error creating technician:', error)
        toast.error('Error al crear el técnico: ' + error.message)
      } else {
        // Si hay una foto de perfil, subirla
        if (profilePhoto && data && data[0]) {
          console.log('Subiendo foto de perfil para técnico:', data[0].id)
          const technicianName = `${data[0].first_name}${data[0].last_name}`
          const photoUrl = await uploadProfilePhoto(data[0].id, technicianName)
          console.log('URL de foto obtenida:', photoUrl)
          if (photoUrl) {
            // Actualizar el técnico con la URL de la foto
            const { error: updateError } = await supabase
              .from('technicians')
              .update({ profile_photo_url: photoUrl })
              .eq('id', data[0].id)
            
            if (updateError) {
              console.error('Error actualizando URL de foto:', updateError)
            } else {
              console.log('URL de foto actualizada correctamente')
            }
          }
        }

        toast.success('Técnico creado exitosamente')
        setShowCreateModal(false)
        if (e.currentTarget) {
          e.currentTarget.reset()
        }
        // Limpiar foto de perfil
        removeProfilePhoto()
        // Recargar la lista de técnicos
        fetchTechnicians()
      }
      
    } catch (error) {
      console.error('Error creating technician:', error)
      toast.error('Error inesperado al crear el técnico')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar técnicos al montar el componente
  useEffect(() => {
    if (company?.id) {
      fetchTechnicians()
    }
  }, [company?.id])

  // Funciones para manejar las acciones
  const handleViewTechnician = (technician: any) => {
    setSelectedTechnician(technician)
    setShowViewModal(true)
  }

  const handleEditTechnician = (technician: any) => {
    setSelectedTechnician(technician)
    setShowEditModal(true)
  }

  const handleDeleteTechnician = (technician: any) => {
    setSelectedTechnician(technician)
    setShowDeleteModal(true)
  }

  const handleUpdateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedTechnician?.id) {
      toast.error('No se pudo obtener la información del técnico')
      return
    }

    setIsUpdating(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const technicianData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        specialties: formData.get('specialties') ? [formData.get('specialties') as string] : null,
        hourly_rate: numberWithValue(formData.get('hourly_rate')),
        is_active: formData.get('is_active') === 'true'
      }

      console.log('Updating technician with data:', technicianData)

      const { data, error } = await supabase
        .from('technicians')
        .update(technicianData)
        .eq('id', selectedTechnician.id)
        .select()

      console.log('Supabase update response:', { data, error })

      if (error) {
        console.error('Error updating technician:', error)
        toast.error('Error al actualizar el técnico: ' + error.message)
      } else {
        // Si hay una nueva foto de perfil, subirla
        if (profilePhoto) {
          console.log('Subiendo nueva foto de perfil para técnico:', selectedTechnician.id)
          
          // Eliminar la foto anterior si existe
          if (selectedTechnician.profile_photo_url) {
            await deleteProfilePhotoFromStorage(selectedTechnician.profile_photo_url)
          }
          
          const technicianName = `${selectedTechnician.first_name}${selectedTechnician.last_name}`
          const photoUrl = await uploadProfilePhoto(selectedTechnician.id, technicianName)
          console.log('URL de nueva foto obtenida:', photoUrl)
          if (photoUrl) {
            // Actualizar el técnico con la nueva URL de la foto
            const { error: updateError } = await supabase
              .from('technicians')
              .update({ profile_photo_url: photoUrl })
              .eq('id', selectedTechnician.id)
            
            if (updateError) {
              console.error('Error actualizando URL de nueva foto:', updateError)
            } else {
              console.log('URL de nueva foto actualizada correctamente')
            }
          }
        }

        toast.success('Técnico actualizado exitosamente')
        setShowEditModal(false)
        setSelectedTechnician(null)
        // Limpiar foto de perfil
        removeProfilePhoto()
        fetchTechnicians()
      }
    } catch (error) {
      console.error('Error updating technician:', error)
      toast.error('Error inesperado al actualizar el técnico')
    } finally {
      setIsUpdating(false)
    }
  }

  const confirmDeleteTechnician = async () => {
    if (!selectedTechnician?.id) {
      toast.error('No se pudo obtener la información del técnico')
      return
    }

    setIsUpdating(true)

    try {
      // Eliminar la foto de perfil si existe
      if (selectedTechnician.profile_photo_url) {
        await deleteProfilePhotoFromStorage(selectedTechnician.profile_photo_url)
      }

      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', selectedTechnician.id)

      if (error) {
        console.error('Error deleting technician:', error)
        toast.error('Error al eliminar el técnico: ' + error.message)
      } else {
        toast.success('Técnico eliminado exitosamente')
        setShowDeleteModal(false)
        setSelectedTechnician(null)
        fetchTechnicians()
      }
      
    } catch (error) {
      console.error('Error deleting technician:', error)
      toast.error('Error inesperado al eliminar el técnico')
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper function to convert string to number or null
  const numberWithValue = (value: FormDataEntryValue | null) => {
    if (!value) return null
    const num = parseFloat(value as string)
    return isNaN(num) ? null : num
  }

  // Función para manejar la selección de foto de perfil
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 2MB')
        return
      }
      
      setProfilePhoto(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Función para subir foto de perfil a Supabase Storage
  const uploadProfilePhoto = async (technicianId: string, technicianName?: string): Promise<string | null> => {
    if (!profilePhoto || !company?.id) return null

    try {
      setUploadingPhoto(true)
      
      // Crear nombre con formato: Nombre-Empresa_NombreApellidoTecnico.[extension]
      const fileExt = profilePhoto.name.split('.').pop()
      const companyName = company.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Empresa'
      const technicianNameClean = technicianName?.replace(/[^a-zA-Z0-9]/g, '') || 'Tecnico'
      const fileName = `${companyName}_${technicianNameClean}.${fileExt}`
      const filePath = `technicians/${company.id}/${fileName}`

      // Subir archivo a Supabase Storage (upsert: true para sobrescribir si existe)
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, profilePhoto, {
          cacheControl: '3600',
          upsert: true // Sobrescribe el archivo si ya existe
        })

      if (error) {
        console.error('Error uploading photo:', error)
        toast.error('Error al subir la foto de perfil')
        return null
      }

      // Obtener URL firmada (con token) que expira en 1 año
      const { data: signedUrlData } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 año

      if (signedUrlData) {
        console.log('URL firmada generada:', signedUrlData.signedUrl)
        return signedUrlData.signedUrl
      }
      
      return null
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Error al subir la foto de perfil')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Función para eliminar foto de perfil del storage
  const deleteProfilePhotoFromStorage = async (photoUrl: string) => {
    try {
      // Extraer el path del archivo de la URL (soporta tanto URLs públicas como firmadas)
      let filePath = ''
      
      if (photoUrl.includes('/storage/v1/object/public/profile-photos/')) {
        const urlParts = photoUrl.split('/storage/v1/object/public/profile-photos/')
        if (urlParts.length > 1) {
          filePath = urlParts[1].split('?')[0] // Remover query parameters
        }
      } else if (photoUrl.includes('/storage/v1/object/sign/profile-photos/')) {
        const urlParts = photoUrl.split('/storage/v1/object/sign/profile-photos/')
        if (urlParts.length > 1) {
          filePath = urlParts[1].split('?')[0] // Remover query parameters
        }
      }
      
      if (filePath) {
        console.log('Eliminando archivo del storage:', filePath)
        
        const { error } = await supabase.storage
          .from('profile-photos')
          .remove([filePath])
        
        if (error) {
          console.error('Error eliminando archivo del storage:', error)
        } else {
          console.log('Archivo eliminado correctamente del storage')
        }
      } else {
        console.error('No se pudo extraer el path del archivo de la URL:', photoUrl)
      }
    } catch (error) {
      console.error('Error eliminando foto del storage:', error)
    }
  }

  // Función para eliminar foto de perfil del estado local
  const removeProfilePhoto = () => {
    setProfilePhoto(null)
    setProfilePhotoPreview(null)
  }

  // Función para eliminar foto de perfil del storage y base de datos
  const removeProfilePhotoFromStorage = async (technicianId: string) => {
    try {
      setRemovingPhoto(true)
      
      // Obtener el técnico actual para acceder a la URL de la foto
      const { data: technician, error } = await supabase
        .from('technicians')
        .select('profile_photo_url')
        .eq('id', technicianId)
        .single()

      if (error) {
        console.error('Error obteniendo técnico:', error)
        return
      }

      if (technician?.profile_photo_url) {
        // Eliminar del storage
        await deleteProfilePhotoFromStorage(technician.profile_photo_url)
        
        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('technicians')
          .update({ profile_photo_url: null })
          .eq('id', technicianId)

        if (updateError) {
          console.error('Error actualizando técnico:', updateError)
          toast.error('Error al eliminar la foto de perfil')
        } else {
          console.log('Foto de perfil eliminada correctamente')
          toast.success('Foto de perfil eliminada')
          // Recargar la lista de técnicos
          fetchTechnicians()
        }
      }
    } catch (error) {
      console.error('Error eliminando foto de perfil:', error)
      toast.error('Error al eliminar la foto de perfil')
    } finally {
      setRemovingPhoto(false)
    }
  }

  // Función para limpiar el estado al cerrar modales
  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    removeProfilePhoto()
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedTechnician(null)
    removeProfilePhoto()
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
            <CardHeader>
              <h2 className="text-lg font-semibold">Lista de Técnicos</h2>
            </CardHeader>
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
                  {loadingTechnicians ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Cargando técnicos...
                      </td>
                    </tr>
                  ) : technicians.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No hay técnicos registrados
                      </td>
                    </tr>
                  ) : (
                    technicians.map((technician) => (
                      <tr key={technician.id}>
                        <td className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            {technician.profile_photo_url ? (
                              <img 
                                src={technician.profile_photo_url} 
                                alt={`${technician.first_name} ${technician.last_name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Error cargando imagen:', technician.profile_photo_url)
                                  e.currentTarget.style.display = 'none'
                                }}
                                onLoad={() => console.log('Imagen cargada correctamente:', technician.profile_photo_url)}
                              />
                            ) : (
                              <User className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {technician.first_name} {technician.last_name}
                            </div>
                          </div>
                        </td>
                        <td>
                          {technician.email ? (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{technician.email}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {technician.phone ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{technician.phone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {technician.specialties && technician.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {technician.specialties.map((specialty: string, index: number) => (
                                <Badge key={index} variant="info" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          <Badge 
                            variant={technician.is_active ? "success" : "gray"}
                            className="text-xs"
                          >
                            {technician.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewTechnician(technician)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditTechnician(technician)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTechnician(technician)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {/* Create Technician Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={handleCloseCreateModal}
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
                  <label className="form-label">Especialidades *</label>
                  <select name="specialties" className="form-input" required>
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

              {/* Foto de perfil */}
              <div className="md:col-span-2">
                <label className="form-label">Foto de Perfil (Opcional)</label>
                <div className="space-y-4">
                  {/* Preview de la foto */}
                  {profilePhotoPreview && (
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={profilePhotoPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeProfilePhoto}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                  
                  {/* Input para seleccionar archivo */}
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="profile-photo-input"
                    />
                    <label
                      htmlFor="profile-photo-input"
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {profilePhoto ? 'Cambiar foto' : 'Seleccionar foto'}
                      </span>
                    </label>
                    {uploadingPhoto && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Subiendo...</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 2MB
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseCreateModal}
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

          {/* View Technician Modal */}
          <Modal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            title="Detalles del Técnico"
            size="lg"
          >
            {selectedTechnician && (
              <div className="space-y-6">
                {/* Header con nombre y estado */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                      {selectedTechnician.profile_photo_url ? (
                        <img 
                          src={selectedTechnician.profile_photo_url} 
                          alt={`${selectedTechnician.first_name} ${selectedTechnician.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTechnician.first_name} {selectedTechnician.last_name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedTechnician.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={selectedTechnician.is_active ? 'success' : 'danger'}>
                          {selectedTechnician.is_active ? 'Activo' : 'Inactivo'}
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
                      {selectedTechnician.email && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <a href={`mailto:${selectedTechnician.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                              {selectedTechnician.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedTechnician.phone && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Phone className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <a href={`tel:${selectedTechnician.phone}`} className="font-medium text-gray-900">
                              {selectedTechnician.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información Profesional</h3>
                    <div className="space-y-3">
                      {selectedTechnician.hourly_rate && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tarifa por Hora</p>
                            <p className="font-medium text-gray-900">€{selectedTechnician.hourly_rate}/hora</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedTechnician.specialties && selectedTechnician.specialties.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Wrench className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Especialidades</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedTechnician.specialties.map((specialty: string, index: number) => (
                                <Badge key={index} variant="info" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Registrado:</span> {new Date(selectedTechnician.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Actualizado:</span> {new Date(selectedTechnician.updated_at).toLocaleDateString('es-ES')}
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
                      handleEditTechnician(selectedTechnician)
                    }}
                  >
                    Editar Técnico
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Edit Technician Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            title="Editar Técnico"
          >
            {selectedTechnician && (
              <form onSubmit={handleUpdateTechnician} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input 
                      type="text" 
                      name="first_name"
                      className="form-input" 
                      defaultValue={selectedTechnician.first_name}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Apellidos *</label>
                    <input 
                      type="text" 
                      name="last_name"
                      className="form-input" 
                      defaultValue={selectedTechnician.last_name}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      defaultValue={selectedTechnician.email || ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="form-input" 
                      defaultValue={selectedTechnician.phone || ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">Especialidades *</label>
                    <select 
                      name="specialties" 
                      className="form-input" 
                      required
                      defaultValue={selectedTechnician.specialties?.[0] || ''}
                    >
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
                    <label className="form-label">Estado</label>
                    <select 
                      name="is_active" 
                      className="form-input"
                      defaultValue={selectedTechnician.is_active ? 'true' : 'false'}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Salario Base (€/hora)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="hourly_rate"
                    className="form-input" 
                    defaultValue={selectedTechnician.hourly_rate || ''}
                  />
                </div>

                {/* Foto de perfil */}
                <div className="md:col-span-2">
                  <label className="form-label">Foto de Perfil (Opcional)</label>
                  <div className="space-y-4">
                    {/* Preview de la foto */}
                    {(profilePhotoPreview || selectedTechnician?.profile_photo_url) && (
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                          <img 
                            src={profilePhotoPreview || selectedTechnician?.profile_photo_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (profilePhotoPreview) {
                              // Si hay una nueva foto seleccionada, solo eliminar del estado local
                              removeProfilePhoto()
                            } else if (selectedTechnician?.profile_photo_url) {
                              // Si hay una foto existente, eliminar del storage y base de datos
                              removeProfilePhotoFromStorage(selectedTechnician.id)
                            }
                          }}
                          disabled={removingPhoto}
                          className="text-red-600 hover:text-red-700"
                        >
                          {removingPhoto ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Eliminar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Input para seleccionar archivo */}
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        id="profile-photo-input-edit"
                      />
                      <label
                        htmlFor="profile-photo-input-edit"
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {profilePhoto ? 'Cambiar foto' : 'Seleccionar foto'}
                        </span>
                      </label>
                      {uploadingPhoto && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Subiendo...</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 2MB
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseEditModal}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Actualizando...' : 'Actualizar Técnico'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Delete Technician Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Eliminar Técnico"
          >
            {selectedTechnician && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Estás seguro de que quieres eliminar al técnico{' '}
                  <strong>{selectedTechnician.first_name} {selectedTechnician.last_name}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmDeleteTechnician}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Eliminando...' : 'Eliminar'}
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
