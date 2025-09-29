'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { updateCompany, updateUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Save, User, Building2, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  const { company, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Formulario de empresa
  const [companyForm, setCompanyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
  })

  // Formulario de usuario
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
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

    if (profile) {
      setUserForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      })
    }
  }, [company, profile])

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCompanySave = async () => {
    if (!company) return

    setLoading(true)
    try {
      const updatedCompany = await updateCompany(company.id, companyForm)
      if (updatedCompany) {
        toast.success('Información de la empresa actualizada')
      }
    } catch (error) {
      console.error('Error updating company:', error)
      toast.error('Error al actualizar la empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSave = async () => {
    if (!profile) return

    setLoading(true)
    try {
      await updateProfile(userForm)
      toast.success('Perfil actualizado')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile || !company) return

    setLoading(true)
    try {
      // Subir archivo a Supabase Storage
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${company.id}/logo.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        throw error
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName)

      // Actualizar empresa con nueva URL del logo
      const updatedCompany = await updateCompany(company.id, {
        logo_url: publicUrl
      })

      if (updatedCompany) {
        toast.success('Logo actualizado correctamente')
        setShowLogoModal(false)
        setLogoFile(null)
        setLogoPreview(null)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Error al subir el logo')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configuración
          </h1>
          <p className="text-gray-600">
            Gestiona la información de tu empresa y perfil personal.
          </p>
        </div>

        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Información de la Empresa
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Nombre de la Empresa"
                  name="name"
                  value={companyForm.name}
                  onChange={handleCompanyInputChange}
                />
              </div>

              <div>
                <Input
                  label="CIF/NIF"
                  name="tax_id"
                  value={companyForm.tax_id}
                  onChange={handleCompanyInputChange}
                />
              </div>

              <div>
                <Input
                  label="Teléfono"
                  name="phone"
                  value={companyForm.phone}
                  onChange={handleCompanyInputChange}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={companyForm.email}
                  onChange={handleCompanyInputChange}
                />
              </div>

              <div>
                <Input
                  label="Sitio Web"
                  name="website"
                  type="url"
                  value={companyForm.website}
                  onChange={handleCompanyInputChange}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Dirección"
                  name="address"
                  value={companyForm.address}
                  onChange={handleCompanyInputChange}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCompanySave}
                loading={loading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Logo de la Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Logo de la Empresa
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {company?.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt="Logo de la empresa"
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Sube un logo para tu empresa. Se mostrará en el dashboard y en los documentos.
                </p>
                <Button
                  onClick={() => setShowLogoModal(true)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Cambiar Logo</span>
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Perfil del Usuario */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Perfil Personal
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Nombre"
                  name="first_name"
                  value={userForm.first_name}
                  onChange={handleUserInputChange}
                />
              </div>

              <div>
                <Input
                  label="Apellidos"
                  name="last_name"
                  value={userForm.last_name}
                  onChange={handleUserInputChange}
                />
              </div>

              <div>
                <Input
                  label="Teléfono"
                  name="phone"
                  value={userForm.phone}
                  onChange={handleUserInputChange}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  value={profile?.email || ''}
                  disabled
                  helperText="El email no se puede cambiar"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleUserSave}
                loading={loading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Información del Sistema
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Rol de Usuario</label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-primary-100 text-primary-800">
                    {profile?.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">ID de la Empresa</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {company?.id}
                  </code>
                </div>
              </div>

              <div>
                <label className="form-label">Slug de la Empresa</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {company?.slug}
                  </code>
                </div>
              </div>

              <div>
                <label className="form-label">Fecha de Registro</label>
                <div className="mt-1 text-sm text-gray-600">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal para subir logo */}
      <Modal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        title="Subir Logo de la Empresa"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Seleccionar Archivo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="form-input"
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          {logoPreview && (
            <div>
              <label className="form-label">Vista Previa</label>
              <div className="mt-1">
                <img
                  src={logoPreview}
                  alt="Vista previa del logo"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogoUpload}
              loading={loading}
              disabled={!logoFile}
            >
              Subir Logo
            </Button>
          </div>
        </div>
      </Modal>
      </Layout>
    </ProtectedRoute>
  )
}
