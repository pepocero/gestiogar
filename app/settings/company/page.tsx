'use client'

import { useState, useEffect } from 'react'
// Layout ya se aplica automáticamente en ProtectedLayout
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ImageEditor } from '@/components/ui/ImageEditor'
import { useAuth } from '@/contexts/AuthContext'
import { updateCompany, updateUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Save, Building2, Camera, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CompanySettingsPage() {
  const { company, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  // Formulario de empresa
  const [companyForm, setCompanyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
  })

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        tax_id: company.tax_id || '',
      })
    }
  }, [company])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateCompany = async () => {
    if (!company) return
    
    setLoading(true)
    try {
      await updateCompany(company.id, companyForm)
      toast.success('Información de la empresa actualizada')
    } catch (error: any) {
      console.error('Error updating company:', error)
      toast.error(error.message || 'Error al actualizar la empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile || !company) return

    setUploadingLogo(true)
    try {
      const fileExt = logoFile.name.split('.').pop()
      const cleanName = (company.name || 'empresa')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 50)
      const fileName = `${cleanName || 'logo'}_${company.id}.${fileExt}`
      const filePath = `logo/${company.id}/${fileName}`

      // Subir logo (sobrescribe si existe)
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, logoFile, {
          upsert: true,
          contentType: logoFile.type
        })

      if (uploadError) throw uploadError

      // Generar URL firmada (1 año)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error('No se pudo generar la URL del logo')
      }

      await updateCompany(company.id, { logo_url: signedUrlData.signedUrl })
      
      toast.success('Logo actualizado correctamente')
      setShowLogoModal(false)
      setLogoFile(null)
      setLogoPreview(null)
      
      // Recargar página para actualizar imagen
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      toast.error('Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const openImageEditor = (file: File) => {
    setSelectedImageFile(file)
    setShowImageEditor(true)
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
          {/* Botón de volver */}
          <div className="flex items-center">
            <Link
              href="/settings"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Configuración
            </Link>
          </div>

          <div className="flex items-center mb-8">
            <Building2 className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
              <p className="text-gray-600 mt-1">
                Gestiona la información y configuración de tu empresa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <Card className="app-card">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="form-label">
                      Nombre de la Empresa
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={companyForm.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="companyTaxId" className="form-label">
                      CIF/NIF
                    </label>
                    <Input
                      id="companyTaxId"
                      name="tax_id"
                      type="text"
                      value={companyForm.tax_id}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="companyPhone" className="form-label">
                      Teléfono
                    </label>
                    <Input
                      id="companyPhone"
                      name="phone"
                      type="tel"
                      value={companyForm.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="companyEmail" className="form-label">
                      Email de la Empresa
                    </label>
                    <Input
                      id="companyEmail"
                      name="email"
                      type="email"
                      value={companyForm.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="companyWebsite" className="form-label">
                      Sitio Web
                    </label>
                    <Input
                      id="companyWebsite"
                      name="website"
                      type="url"
                      value={companyForm.website}
                      onChange={handleInputChange}
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyAddress" className="form-label">
                      Dirección
                    </label>
                    <Input
                      id="companyAddress"
                      name="address"
                      type="text"
                      value={companyForm.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <Button
                    onClick={handleUpdateCompany}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Actualizando...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Actualizar Empresa
                      </>
                    )}
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Logo de la Empresa */}
            <Card className="app-card">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Logo de la Empresa</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt="Logo de la empresa"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Building2 className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => setShowLogoModal(true)}
                      variant="outline"
                      className="btn-outline"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Cambiar Logo
                    </Button>
                  </div>

                  <p className="text-sm text-gray-600 text-center">
                    Recomendamos usar imágenes de 200x200 píxeles o más para una mejor calidad.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Modal para subir logo */}
          <Modal
            isOpen={showLogoModal}
            onClose={() => setShowLogoModal(false)}
            title="Subir Logo de la Empresa"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              {logoPreview && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">Vista previa:</div>
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Vista previa"
                      className="w-32 h-32 object-contain border border-gray-200 rounded-lg"
                    />
                  </div>
                    <Button
                      onClick={() => openImageEditor(logoFile!)}
                      variant="outline"
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Editar Imagen
                    </Button>
                </div>
              )}

              {logoPreview && (
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowLogoModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <div className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Subiendo...
                      </div>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Logo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Modal>

          {/* Modal para editor de imágenes */}
          {showImageEditor && selectedImageFile && (
            <ImageEditor
              isOpen={showImageEditor}
              imageFile={selectedImageFile}
              onSave={(editedFile) => {
                const file = new File([editedFile], 'logo.png', { type: 'image/png' })
                setLogoFile(file)
                setLogoPreview(URL.createObjectURL(editedFile))
                setShowImageEditor(false)
              }}
              onClose={() => setShowImageEditor(false)}
            />
          )}
        </div>
  )
}
