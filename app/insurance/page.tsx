'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input, Badge } from '@/components/ui'
import { Building2, Plus, Settings, Eye, Edit, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseTable } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import { ImageEditor } from '@/components/ui/ImageEditor'
import toast from 'react-hot-toast'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

export default function InsurancePage() {
  const { company } = useAuth()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  
  // Estados para manejo de archivos
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  // Estados para editor de imágenes
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    portal_url: '',
    billing_terms: 30,
    is_active: true
  })

  const resetForm = () => {
    setForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      portal_url: '',
      billing_terms: 30,
      is_active: true
    })
    setLogoFile(null)
    setLogoPreview(null)
  }
  const loadingRef = useRef(false)

  const loadCompanies = useCallback(async () => {
    if (!company?.id || loadingRef.current) return
    
    loadingRef.current = true
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Insurance] loadCompanies start', company.id)
      }
      setLoading(true)
      
      // Obtener límites del plan
      const limits = await getPlanLimits(company.id)
      
      let query = supabase
        .from('insurance_companies')
        .select('*')
        .eq('company_id', company.id)
      
      // Aplicar límite según el plan (ordenar por created_at para plan free)
      query = applyPlanLimit(query, limits.max_insurance_companies, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setCompanies(data || [])

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Insurance] loadCompanies success', {
          companyId: company.id,
          count: data?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Error cargando aseguradoras')
    } finally {
      setLoading(false)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Insurance] loadCompanies finished', company?.id)
      }
    }
  }

  // Función para manejar la selección de logo
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Abrir editor de imagen
      setSelectedImageFile(file)
      setShowImageEditor(true)
    }
  }

  const handleImageEditorSave = (croppedImageBlob: Blob) => {
    // Convertir blob a File
    const croppedFile = new File([croppedImageBlob], 'insurance-logo.jpg', {
      type: 'image/jpeg'
    })
    
    setLogoFile(croppedFile)
    
    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(croppedFile)
    
    setShowImageEditor(false)
    setSelectedImageFile(null)
  }

  // Función para subir logo a Supabase Storage
  const uploadLogo = async (companyId: string, companyName: string): Promise<string | null> => {
    if (!logoFile || !company?.id) return null

    try {
      setUploadingLogo(true)
      
      // Crear nombre con formato: Empresa_NombreAseguradora.[extension]
      const fileExt = logoFile.name.split('.').pop()
      const companyNameClean = company.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Empresa'
      const insuranceNameClean = companyName.replace(/[^a-zA-Z0-9]/g, '') || 'Aseguradora'
      const fileName = `${companyNameClean}_${insuranceNameClean}.${fileExt}`
      const filePath = `logo/${company.id}/${fileName}`

      // Subir archivo a Supabase Storage (upsert: true para sobrescribir si existe)
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true // Sobrescribe el archivo si ya existe
        })

      if (error) {
        console.error('Error uploading logo:', error)
        toast.error('Error al subir el logo')
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
      console.error('Error uploading logo:', error)
      toast.error('Error al subir el logo')
      return null
    } finally {
      setUploadingLogo(false)
    }
  }

  // Función para eliminar logo del storage
  const deleteLogoFromStorage = async (logoUrl: string) => {
    try {
      let filePath = ''
      
      if (logoUrl.includes('/storage/v1/object/public/profile-photos/')) {
        const urlParts = logoUrl.split('/storage/v1/object/public/profile-photos/')
        filePath = urlParts[1] || ''
      } else if (logoUrl.includes('/storage/v1/object/sign/profile-photos/')) {
        const urlParts = logoUrl.split('/storage/v1/object/sign/profile-photos/')
        filePath = urlParts[1] || ''
      }

      if (filePath) {
        const { error } = await supabase.storage
          .from('profile-photos')
          .remove([filePath])

        if (error) {
          console.error('Error eliminando logo:', error)
        } else {
          console.log('Logo eliminado correctamente')
        }
      } else {
        console.error('No se pudo extraer el path del archivo de la URL:', logoUrl)
      }
    } catch (error) {
      console.error('Error eliminando logo del storage:', error)
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
      if (!company) {
        toast.error('No se encontró información de la empresa')
        return
      }

      if (editingCompany) {
        // Actualizar aseguradora existente
        const updateData: any = {
          name: form.name,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          address: form.address,
          portal_url: form.portal_url,
          billing_terms: form.billing_terms,
          is_active: form.is_active
        }

        // Si hay un nuevo logo, subirlo
        if (logoFile) {
          console.log('Subiendo nuevo logo para aseguradora:', editingCompany.id)
          
          // Eliminar el logo anterior si existe
          if (editingCompany.logo_url) {
            await deleteLogoFromStorage(editingCompany.logo_url)
          }
          
          const logoUrl = await uploadLogo(editingCompany.id, form.name)
          console.log('URL de logo obtenida:', logoUrl)
          if (logoUrl) {
            updateData.logo_url = logoUrl
          }
        }

        const { error } = await supabaseTable('insurance_companies')
          .update(updateData)
          .eq('id', editingCompany.id)
          .eq('company_id', company.id)

        if (error) {
          throw error
        }

        toast.success('Aseguradora actualizada correctamente')
      } else {
        // Crear nueva aseguradora
        const { data, error } = await supabaseTable('insurance_companies')
          .insert({
            company_id: company.id,
            name: form.name,
            contact_person: form.contact_person,
            email: form.email,
            phone: form.phone,
            address: form.address,
            portal_url: form.portal_url,
            billing_terms: form.billing_terms,
            is_active: form.is_active
          })
          .select()

        if (error) {
          throw error
        }

        // Si hay un logo, subirlo
        if (logoFile && data && data[0]) {
          console.log('Subiendo logo para nueva aseguradora:', data[0].id)
          const logoUrl = await uploadLogo(data[0].id, form.name)
          console.log('URL de logo obtenida:', logoUrl)
          if (logoUrl) {
            // Actualizar la aseguradora con la URL del logo
            const { error: updateError } = await supabaseTable('insurance_companies')
              .update({ logo_url: logoUrl })
              .eq('id', data[0].id)

            if (updateError) {
              console.error('Error actualizando URL de logo:', updateError)
            } else {
              console.log('URL de logo actualizada correctamente')
            }
          }
        }

        toast.success('Aseguradora creada correctamente')
      }
      
      // Recargar datos
      await loadCompanies()
      
      setShowModal(false)
      setEditingCompany(null)
      resetForm()
    } catch (error) {
      console.error('Error guardando aseguradora:', error)
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
      portal_url: company.portal_url || '',
      billing_terms: company.billing_terms || 30,
      is_active: company.is_active
    })
    setLogoFile(null)
    setLogoPreview(company.logo_url || null)
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
      <SubscriptionBanner />
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
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={`Logo de ${company.name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-blue-100 flex items-center justify-center ${company.logo_url ? 'hidden' : ''}`}>
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
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
                  <Badge variant={company.is_active ? 'success' : 'gray'}>
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

          <Input
            label="Portal URL"
            name="portal_url"
            value={form.portal_url}
            onChange={handleInputChange}
            placeholder="https://portal.aseguradora.com"
          />

          {/* Campo de logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la Aseguradora
            </label>
            
            {/* Preview del logo */}
            {(logoPreview || editingCompany?.logo_url) && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={logoPreview || editingCompany?.logo_url} 
                    alt="Preview del logo"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      console.error('Error cargando imagen:', logoPreview || editingCompany?.logo_url)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoad={() => console.log('Imagen cargada correctamente:', logoPreview || editingCompany?.logo_url)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (logoPreview) {
                        // Si hay una nueva imagen seleccionada, solo eliminar del estado local
                        setLogoPreview(null)
                        setLogoFile(null)
                      } else if (editingCompany?.logo_url) {
                        // Si hay una imagen existente, eliminar del storage y base de datos
                        deleteLogoFromStorage(editingCompany.logo_url)
                        setLogoPreview(null)
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
                id="logo-input"
              />
              <label
                htmlFor="logo-input"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                {logoFile ? 'Cambiar logo' : 'Seleccionar logo'}
              </label>
              {uploadingLogo && (
                <span className="text-sm text-gray-500">Subiendo...</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Formatos: JPG, PNG, GIF. Máximo 2MB
            </p>
          </div>

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
          <div className="space-y-6">
            {/* Header con logo y nombre */}
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                {selectedCompany.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt={`Logo de ${selectedCompany.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-blue-100 flex items-center justify-center ${selectedCompany.logo_url ? 'hidden' : ''}`}>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{selectedCompany.name}</h2>
                <p className="text-sm text-gray-500">{selectedCompany.contact_person}</p>
                <Badge variant={selectedCompany.is_active ? 'success' : 'gray'} className="mt-1">
                  {selectedCompany.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedCompany.email || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <p className="text-sm text-gray-900">{selectedCompany.phone || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <p className="text-sm text-gray-900">{selectedCompany.address || 'No especificada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portal URL</label>
                  <p className="text-sm text-gray-900">
                    {selectedCompany.portal_url ? (
                      <a 
                        href={selectedCompany.portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedCompany.portal_url}
                      </a>
                    ) : 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Facturación</label>
                  <p className="text-sm text-gray-900">{selectedCompany.billing_terms || 30} días</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-sm text-gray-900">
                    {selectedCompany.created_at ? new Date(selectedCompany.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="pt-4 border-t border-gray-200">
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

      {/* Editor de imágenes */}
      {showImageEditor && selectedImageFile && (
        <ImageEditor
          isOpen={showImageEditor}
          onClose={() => {
            setShowImageEditor(false)
            setSelectedImageFile(null)
          }}
          onSave={handleImageEditorSave}
          imageFile={selectedImageFile}
        />
      )}
    </div>
  )
}
