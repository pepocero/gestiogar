'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ImageEditor } from '@/components/ui/ImageEditor'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, Building2, Phone, Mail, Globe, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

interface InsuranceCompany {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  portal_url: string
  api_endpoint: string
  billing_terms: number
  is_active: boolean
  logo_url?: string
  created_at: string
  updated_at: string
}

export default function InsurancePage() {
  const { company } = useAuth()
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<InsuranceCompany | null>(null)
  const [viewingCompany, setViewingCompany] = useState<InsuranceCompany | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    portal_url: '',
    api_endpoint: '',
    billing_terms: 30,
    is_active: true,
    logo_url: '' as string | undefined
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' // 'all', 'active', 'inactive'
  })
  const [filteredCompanies, setFilteredCompanies] = useState<InsuranceCompany[]>([])

  useEffect(() => {
    if (company) {
      loadInsuranceCompanies()
    }
  }, [company])

  // Aplicar filtros cuando cambien las aseguradoras o los filtros
  useEffect(() => {
    applyFilters()
  }, [insuranceCompanies, filters])

  const loadInsuranceCompanies = async () => {
    if (!company?.id) {
      console.error('No company available for loading insurance companies')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('company_id', company.id)
        .order('name')

      if (error) {
        throw error
      }

      setInsuranceCompanies(data || [])
    } catch (error) {
      console.error('Error loading insurance companies:', error)
      toast.error('Error al cargar las aseguradoras')
    } finally {
      setLoading(false)
    }
  }

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = [...insuranceCompanies]

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm) ||
        company.contact_person?.toLowerCase().includes(searchTerm) ||
        company.email?.toLowerCase().includes(searchTerm) ||
        company.phone?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtro de estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(company => 
        filters.status === 'active' ? company.is_active : !company.is_active
      )
    }

    setFilteredCompanies(filtered)
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
      status: 'all'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
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
  const uploadLogo = async (file: File, companyName: string): Promise<string> => {
    if (!company?.id) throw new Error('No hay información de empresa')
    
    const fileExtension = file.name.split('.').pop()
    const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '')}_logo.${fileExtension}`
    const filePath = `logo/${company.id}/${fileName}`
    
    console.log('Subiendo logo:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      companyId: company.id
    })
    
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      })
    
    if (error) {
      console.error('Error subiendo logo:', error)
      throw error
    }
    
    console.log('Logo subido exitosamente:', data)
    
    // Crear URL firmada con expiración de 1 año
    const { data: signedUrlData } = await supabase.storage
      .from('profile-photos')
      .createSignedUrl(filePath, 365 * 24 * 60 * 60) // 1 año
    
    if (!signedUrlData?.signedUrl) {
      throw new Error('No se pudo crear la URL firmada')
    }
    
    console.log('URL firmada creada:', signedUrlData.signedUrl)
    return signedUrlData.signedUrl
  }

  // Función para eliminar logo del storage
  const deleteLogoFromStorage = async (logoUrl: string) => {
    try {
      // Extraer el path del archivo de la URL
      let filePath = ''
      if (logoUrl.includes('/storage/v1/object/public/profile-photos/')) {
        filePath = logoUrl.split('/storage/v1/object/public/profile-photos/')[1]
      } else if (logoUrl.includes('/storage/v1/object/sign/profile-photos/')) {
        filePath = logoUrl.split('/storage/v1/object/sign/profile-photos/')[1].split('?')[0]
      }
      
      if (filePath) {
        await supabase.storage
          .from('profile-photos')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Error eliminando logo del storage:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!company) return

    try {
      let logoUrl = null
      
      // Subir logo si se seleccionó uno
      if (logoFile) {
        setUploadingLogo(true)
        logoUrl = await uploadLogo(logoFile, formData.name)
      }
      
      if (editingCompany) {
        // Actualizar aseguradora existente
        const updateData = { ...formData }
        if (logoUrl) {
          // Eliminar logo anterior si existe
          if (editingCompany.logo_url) {
            await deleteLogoFromStorage(editingCompany.logo_url)
          }
          updateData.logo_url = logoUrl
        }
        
        const { error } = await supabase
          .from('insurance_companies')
          .update(updateData)
          .eq('id', editingCompany.id)

        if (error) {
          throw error
        }

        toast.success('Aseguradora actualizada correctamente')
      } else {
        // Crear nueva aseguradora
        if (!company?.id) {
          throw new Error('No hay información de empresa disponible')
        }
        
        const { error } = await supabase
          .from('insurance_companies')
          .insert([{
            ...formData,
            logo_url: logoUrl,
            company_id: company.id
          }])

        if (error) {
          throw error
        }

        toast.success('Aseguradora creada correctamente')
      }

      setShowModal(false)
      setEditingCompany(null)
      resetForm()
      loadInsuranceCompanies()
    } catch (error) {
      console.error('Error saving insurance company:', error)
      toast.error('Error al guardar la aseguradora')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleView = (company: InsuranceCompany) => {
    setViewingCompany(company)
    setShowViewModal(true)
  }

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      contact_person: company.contact_person,
      email: company.email,
      phone: company.phone,
      address: company.address,
      portal_url: company.portal_url,
      api_endpoint: company.api_endpoint,
      billing_terms: company.billing_terms,
      is_active: company.is_active,
      logo_url: company.logo_url
    })
    // Limpiar estados de logo para edición
    setLogoFile(null)
    setLogoPreview(null)
    setUploadingLogo(false)
    setShowModal(true)
  }

  const handleDelete = (company: InsuranceCompany) => {
    setDeletingCompany(company)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCompany) return

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', deletingCompany.id)

      if (error) {
        throw error
      }

      toast.success('Aseguradora eliminada correctamente')
      setShowDeleteModal(false)
      setDeletingCompany(null)
      loadInsuranceCompanies()
    } catch (error) {
      console.error('Error deleting insurance company:', error)
      toast.error('Error al eliminar la aseguradora')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      portal_url: '',
      api_endpoint: '',
      billing_terms: 30,
      is_active: true,
      logo_url: undefined
    })
    setLogoFile(null)
    setLogoPreview(null)
    setUploadingLogo(false)
  }

  const handleNewCompany = () => {
    setEditingCompany(null)
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
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

        {/* Filtros */}
        <Card className="app-card">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, contacto, email o teléfono..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="sm:w-48">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activas</option>
                  <option value="inactive">Solo inactivas</option>
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

        {/* Lista de aseguradoras */}
        <Card className="app-card">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Aseguradoras ({filteredCompanies.length} de {insuranceCompanies.length})
            </h3>
          </CardHeader>
          <CardBody>
            {insuranceCompanies.length > 0 ? (
              <div className="space-y-4">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                  <div key={company.id} className="insurance-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      {/* Logo/Foto de la aseguradora */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-white" />
                        )}
                      </div>
                      
                      {/* Información de la aseguradora */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {company.name}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {company.contact_person && (
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Contacto:</span>
                                  <span>{company.contact_person}</span>
                                </div>
                              )}
                              
                              {company.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>{company.email}</span>
                                </div>
                              )}
                              
                              {company.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{company.phone}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{company.billing_terms} días de pago</span>
                              </div>
                              
                              {company.address && (
                                <div className="flex items-center space-x-2 md:col-span-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{company.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Estado y acciones */}
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <Badge variant={company.is_active ? 'success' : 'danger'}>
                              {company.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                            
                            <div className="action-buttons flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(company)}
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(company)}
                                title="Editar aseguradora"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(company)}
                                title="Eliminar aseguradora"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No se encontraron aseguradoras
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
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal para crear/editar aseguradora */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nombre de la Aseguradora *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Input
                label="Persona de Contacto"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Input
                label="Portal Web"
                name="portal_url"
                type="url"
                value={formData.portal_url}
                onChange={handleInputChange}
                placeholder="https://"
              />
            </div>

            <div>
              <Input
                label="API Endpoint"
                name="api_endpoint"
                value={formData.api_endpoint}
                onChange={handleInputChange}
                placeholder="https://api.aseguradora.com"
              />
            </div>

            <div>
              <Input
                label="Términos de Pago (días)"
                name="billing_terms"
                type="number"
                value={formData.billing_terms}
                onChange={handleInputChange}
                min="1"
                max="365"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            {/* Logo de la aseguradora */}
            <div className="md:col-span-2">
              <label className="form-label">Logo de la Aseguradora (Opcional)</label>
              <div className="space-y-4">
                {/* Preview del logo actual o seleccionado */}
                {(logoPreview || editingCompany?.logo_url) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img 
                        src={logoPreview || editingCompany?.logo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreview(null)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
                
                {/* Input de archivo */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos: JPG, PNG, GIF. Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
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
            <Button 
              type="submit"
              disabled={uploadingLogo}
            >
              {uploadingLogo ? 'Subiendo logo...' : (editingCompany ? 'Actualizar' : 'Crear') + ' Aseguradora'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver detalles de aseguradora */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Aseguradora"
        size="lg"
      >
        {viewingCompany && (
          <div className="space-y-6">
            {/* Header con nombre y estado */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  {viewingCompany.logo_url ? (
                    <img 
                      src={viewingCompany.logo_url} 
                      alt={viewingCompany.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingCompany.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {viewingCompany.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={viewingCompany.is_active ? 'success' : 'danger'}>
                      {viewingCompany.is_active ? 'Activa' : 'Inactiva'}
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
                  {viewingCompany.contact_person && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Persona de Contacto</p>
                        <p className="font-medium text-gray-900">{viewingCompany.contact_person}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${viewingCompany.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {viewingCompany.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <a href={`tel:${viewingCompany.phone}`} className="font-medium text-gray-900">
                          {viewingCompany.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información Técnica</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Términos de Pago</p>
                      <p className="font-medium text-gray-900">{viewingCompany.billing_terms} días</p>
                    </div>
                  </div>
                  
                  {viewingCompany.portal_url && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Portal Web</p>
                        <a 
                          href={viewingCompany.portal_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {viewingCompany.portal_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {viewingCompany.api_endpoint && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">API Endpoint</p>
                        <p className="font-medium text-gray-900 font-mono text-sm">{viewingCompany.api_endpoint}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            {viewingCompany.address && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Dirección</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-gray-900">{viewingCompany.address}</p>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creada:</span> {new Date(viewingCompany.created_at).toLocaleDateString('es-ES')}
              </div>
              <div>
                <span className="font-medium">Actualizada:</span> {new Date(viewingCompany.updated_at).toLocaleDateString('es-ES')}
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
                  handleEdit(viewingCompany)
                }}
              >
                Editar Aseguradora
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Aseguradora"
      >
        {deletingCompany && (
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Estás seguro de que quieres eliminar la aseguradora{' '}
              <strong>{deletingCompany.name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
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
          title="Editar Logo de Aseguradora"
          circular={false}
        />
      )}
      </Layout>
    </ProtectedRoute>
  )
}
