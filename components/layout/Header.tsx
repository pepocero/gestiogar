'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Search, Menu, User, Settings, LogOut, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageEditor } from '@/components/ui/ImageEditor'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, company, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Formulario de edición de perfil
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  })

  // Cargar datos del perfil cuando se abre el modal
  const handleOpenProfileModal = () => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      })
    }
    setShowProfileModal(true)
    setShowProfileMenu(false)
  }

  // Manejar cambios en el formulario
  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido')
        return
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 2MB')
        return
      }

      // Abrir editor de imagen
      setSelectedImageFile(file)
      setShowImageEditor(true)
    }
  }

  const handleImageEditorSave = (croppedImageBlob: Blob) => {
    // Convertir blob a File
    const croppedFile = new File([croppedImageBlob], 'profile-photo.jpg', {
      type: 'image/jpeg'
    })
    
    setProfilePhoto(croppedFile)
    
    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfilePhotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(croppedFile)
    
    setShowImageEditor(false)
    setSelectedImageFile(null)
  }

  const uploadProfilePhoto = async (file: File): Promise<string> => {
    if (!company) throw new Error('No hay información de empresa')

    const fileExt = file.name.split('.').pop()
    // Limpiar nombre de archivo: eliminar espacios, tildes y caracteres especiales
    const cleanCompanyName = (company.name || 'Empresa')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/[^a-zA-Z0-9]/g, '') // Eliminar todo excepto letras y números
      .substring(0, 50) // Limitar longitud
    const cleanFirstName = (profile?.first_name || 'User')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 30)
    const cleanLastName = (profile?.last_name || 'Profile')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 30)
    const fileName = `${cleanCompanyName}_${cleanFirstName}_${cleanLastName}.${fileExt}`
    const filePath = `logo/${company.id}/${fileName}`

    console.log('Uploading profile photo:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      companyId: company.id
    })

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Profile photo uploaded successfully')

    const { data: signedUrlData } = await supabase.storage
      .from('profile-photos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 año

    if (!signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL')
      throw new Error('No se pudo generar la URL firmada')
    }

    console.log('Signed URL created:', signedUrlData.signedUrl)
    return signedUrlData.signedUrl
  }

  const deleteOldProfilePhoto = async (photoUrl: string) => {
    try {
      // Extraer el path del archivo de la URL
      let filePath = ''
      if (photoUrl.includes('/storage/v1/object/public/profile-photos/')) {
        filePath = photoUrl.split('/storage/v1/object/public/profile-photos/')[1]
      } else if (photoUrl.includes('/storage/v1/object/sign/profile-photos/')) {
        filePath = photoUrl.split('/storage/v1/object/sign/profile-photos/')[1].split('?')[0]
      }

      if (filePath) {
        await supabase.storage
          .from('profile-photos')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Error deleting old profile photo:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile || !company) {
      console.error('No profile or company available')
      return
    }

    try {
      console.log('Starting profile update...')
      setIsUploading(true)

      let newPhotoUrl = profile.profile_photo_url

      // Si hay una nueva foto, subirla
      if (profilePhoto) {
        console.log('Uploading new profile photo...')
        // Eliminar foto anterior si existe
        if (profile.profile_photo_url) {
          await deleteOldProfilePhoto(profile.profile_photo_url)
        }

        // Subir nueva foto
        newPhotoUrl = await uploadProfilePhoto(profilePhoto)
        console.log('Profile photo uploaded:', newPhotoUrl)
      }

      // Actualizar perfil en la base de datos
      console.log('Updating profile in database...', {
        profile_photo_url: newPhotoUrl,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone
      })

      const { error } = await supabase
        .from('users')
        .update({ 
          profile_photo_url: newPhotoUrl,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Database update error:', error)
        throw error
      }

      console.log('Profile updated successfully')
      toast.success('Perfil actualizado exitosamente')
      
      // Cerrar modal y limpiar estado
      setShowProfileModal(false)
      setProfilePhoto(null)
      setProfilePhotoPreview(null)
      
      // Recargar la página para actualizar el perfil
      console.log('Reloading page...')
      window.location.reload()

    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada exitosamente')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const removeProfilePhoto = () => {
    setProfilePhoto(null)
    setProfilePhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Botón de menú móvil */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Breadcrumb o título de página */}
          <div className="ml-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {company?.name || 'GestioGar'}
            </h1>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar trabajos, clientes, presupuestos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
            <Bell className="h-6 w-6" />
          </button>

          {/* Perfil del usuario */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role}
                </p>
              </div>
              
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                  </span>
                )}
              </div>
            </button>

            {/* Menú desplegable del perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={handleOpenProfileModal}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-3" />
                  Editar Perfil
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    window.location.href = '/settings'
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    handleLogout()
                    setShowProfileMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición de Perfil */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setProfilePhoto(null)
          setProfilePhotoPreview(null)
          // Resetear formulario al cerrar
          if (profile) {
            setProfileForm({
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || '',
            })
          }
        }}
        title="Editar Perfil"
        size="md"
      >
        <div className="space-y-6">
          {/* Foto de perfil actual */}
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 overflow-hidden">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Foto de perfil actual"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {profile?.first_name} {profile?.last_name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {profile?.role}
            </p>
          </div>

          {/* Sección de foto de perfil */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil
              </label>
              
              {/* Preview de nueva foto */}
              {profilePhotoPreview && (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img
                    src={profilePhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full border-4 border-blue-200"
                  />
                  <button
                    onClick={removeProfilePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input de archivo */}
              <div className="flex items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profilePhotoPreview ? 'Cambiar Foto' : 'Seleccionar Foto'}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                Máximo 2MB. Formatos: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="first_name"
                value={profileForm.first_name}
                onChange={handleProfileFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu nombre"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                type="text"
                name="last_name"
                value={profileForm.last_name}
                onChange={handleProfileFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tus apellidos"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+34 600 000 000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede cambiar desde aquí
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowProfileModal(false)
                setProfilePhoto(null)
                setProfilePhotoPreview(null)
                // Resetear formulario al cancelar
                if (profile) {
                  setProfileForm({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    phone: profile.phone || '',
                  })
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUploading}
              className="btn-primary"
            >
              {isUploading ? 'Actualizando...' : 'Actualizar Perfil'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Editor de Imagen */}
      {selectedImageFile && (
        <ImageEditor
          isOpen={showImageEditor}
          onClose={() => {
            setShowImageEditor(false)
            setSelectedImageFile(null)
          }}
          onSave={handleImageEditorSave}
          imageFile={selectedImageFile}
          aspectRatio={1}
          title="Editar Foto de Perfil"
          circular={true}
        />
      )}
    </header>
  )
}
