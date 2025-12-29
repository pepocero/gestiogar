'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  CheckCircle, 
  X, 
  Zap, 
  Crown,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3,
  Users,
  FileText,
  Wrench,
  Calendar,
  Building2,
  Phone,
  Star,
  TrendingUp,
  Award,
  Infinity
} from 'lucide-react'

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <Image
                  src="/logo.png"
                  alt="Gestiogar Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestiogar</h1>
                <p className="text-xs text-blue-100">Gestión Profesional</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/plans" 
                className="text-white hover:text-blue-100 transition-colors font-medium border-b-2 border-white"
              >
                Planes
              </Link>
              <Link 
                href="/auth/login" 
                className="text-white hover:text-blue-100 transition-colors font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-white text-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Registrarse Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
            <span className="text-white text-sm font-medium">Elige el plan perfecto para tu empresa</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Planes y Precios
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Desde una prueba gratuita hasta acceso completo a todas las funcionalidades
          </p>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan Demo */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-8 py-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">Plan Demo</h3>
                  <Zap className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-600">Perfecto para probar todas las funcionalidades</p>
              </div>
              
              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-extrabold text-gray-900">Gratis</span>
                    <span className="text-xl text-gray-500 ml-2">/siempre</span>
                  </div>
                  <p className="text-gray-600">Sin tarjeta de crédito requerida</p>
                </div>

                <Link
                  href="/auth/login"
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 transition-all font-semibold text-center block mb-8"
                >
                  Probar Ahora
                </Link>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-lg mb-4">Incluye:</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Acceso completo a todas las funcionalidades</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Gestión de clientes ilimitada</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Gestión de técnicos y trabajos</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Presupuestos y facturas</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Integración con aseguradoras</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Reportes y analytics</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Sistema modular expandible</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Soporte por email</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Datos de demostración precargados</span>
                    </div>
                    <div className="flex items-start">
                      <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400 line-through">Sin guardar datos propios</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Pro */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden hover:shadow-2xl transition-all relative">
              {/* Badge Popular */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-bl-xl font-bold text-sm flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Más Popular
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">Gestiogar Pro</h3>
                  <Crown className="h-8 w-8 text-yellow-300" />
                </div>
                <p className="text-blue-100">Acceso completo para empresas profesionales</p>
              </div>
              
              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-extrabold text-gray-900">14,99€</span>
                    <span className="text-xl text-gray-500 ml-2">/mes</span>
                  </div>
                  <p className="text-gray-600">Facturación mensual, cancela cuando quieras</p>
                </div>

                <Link
                  href="/auth/register"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-center block mb-8 shadow-lg hover:shadow-xl"
                >
                  Comenzar Ahora
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </Link>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-lg mb-4">Todo del Plan Demo, más:</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Guardar tus propios datos</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Clientes ilimitados</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Técnicos ilimitados</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Trabajos y presupuestos ilimitados</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Facturación completa</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Reportes avanzados y exportación</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Módulos adicionales disponibles</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Soporte prioritario</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Backups automáticos diarios</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Actualizaciones automáticas</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">API de integración</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Personalización avanzada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comparación de Funcionalidades
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas saber para elegir el plan correcto
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left font-bold text-gray-900">Funcionalidad</th>
                  <th className="border border-gray-300 px-6 py-4 text-center font-bold text-gray-900">Plan Demo</th>
                  <th className="border border-gray-300 px-6 py-4 text-center font-bold text-blue-600 bg-blue-50">Gestiogar Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Gestión de Clientes</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Gestión de Técnicos</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Trabajos y Presupuestos</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Facturación</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Integración con Aseguradoras</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Reportes y Analytics</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Guardar Datos Propios</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Límites de Uso</td>
                  <td className="border border-gray-300 px-6 py-4 text-center text-gray-500">Solo demo</td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50 font-medium text-blue-600">Ilimitado</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Soporte</td>
                  <td className="border border-gray-300 px-6 py-4 text-center text-gray-500">Email</td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50 font-medium text-blue-600">Prioritario</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">Backups Automáticos</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4 font-medium">API de Integración</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <X className="h-5 w-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Prueba el Plan Demo gratis o comienza directamente con Gestiogar Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all font-semibold text-lg inline-flex items-center justify-center"
            >
              Probar Demo Gratis
            </Link>
            <Link
              href="/auth/register"
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all font-semibold text-lg inline-flex items-center justify-center"
            >
              Comenzar con Pro
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">&copy; 2025 Gestiogar. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

