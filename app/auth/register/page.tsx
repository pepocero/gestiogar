'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createCompanyAndOwner, generateUniqueSlug } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const isFromPlans = searchParams.get('plan') === 'pro'
  const isFromDemo = searchParams.get('from') === 'demo'
  const [formData, setFormData] = useState({
    // Datos de la empresa
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyTaxId: '',
    // Datos del usuario
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // Generar slug único para la empresa
      const slug = await generateUniqueSlug(formData.companyName)

      // Crear empresa y usuario propietario
      const result = await createCompanyAndOwner(
        {
          name: formData.companyName,
          slug,
          address: formData.companyAddress,
          phone: formData.companyPhone,
          email: formData.companyEmail,
          website: formData.companyWebsite,
          tax_id: formData.companyTaxId,
        },
        {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        }
      )

      // Si viene desde planes, redirigir directamente a suscripción después del login
      if (isFromPlans) {
        // No cerrar sesión, redirigir directamente a suscripción
        toast.success('¡Cuenta creada! Redirigiendo al proceso de suscripción...')
        // Esperar un momento para que se guarde la sesión
        setTimeout(() => {
          window.location.href = '/settings/subscription?upgrade=true'
        }, 1000)
      } else {
        // Cerrar sesión y redirigir a login con parámetro de éxito
        await supabase.auth.signOut()
        router.push('/auth/login?registered=true')
      }
    } catch (error: any) {
      console.error('Error creating company:', error)
      toast.error(error.message || 'Error al crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear Nueva Empresa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Regístrate como propietario de una empresa de reparaciones
        </p>
        {isFromDemo && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 text-center">
              <strong>Nota:</strong> La cuenta demo no puede contratar planes. Por favor, crea una cuenta real para acceder a Gestiogar Pro.
            </p>
          </div>
        )}
        {isFromPlans && !isFromDemo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <strong>¡Excelente elección!</strong> Después de registrarte, serás redirigido al proceso de suscripción de PayPal para activar Gestiogar Pro.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Información de la Empresa */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="form-label">
                    Nombre de la Empresa *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="companyTaxId" className="form-label">
                    CIF/NIF
                  </label>
                  <input
                    id="companyTaxId"
                    name="companyTaxId"
                    type="text"
                    className="form-input"
                    value={formData.companyTaxId}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="form-label">
                    Teléfono
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    className="form-input"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="companyEmail" className="form-label">
                    Email de la Empresa
                  </label>
                  <input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    className="form-input"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="companyAddress" className="form-label">
                    Dirección
                  </label>
                  <input
                    id="companyAddress"
                    name="companyAddress"
                    type="text"
                    className="form-input"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="companyWebsite" className="form-label">
                    Sitio Web
                  </label>
                  <input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    className="form-input"
                    placeholder="https://"
                    value={formData.companyWebsite}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Información del Propietario */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información del Propietario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    Nombre *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">
                    Apellidos *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="form-label">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Contraseña *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="form-input"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmar Contraseña *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary btn-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Creando Empresa...
                  </div>
                ) : (
                  'Crear Empresa'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una empresa?{' '}
                <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}





