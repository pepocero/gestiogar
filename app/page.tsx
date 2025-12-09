'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Building2, 
  Users, 
  FileText, 
  Wrench, 
  Shield, 
  Calendar, 
  BarChart3, 
  CheckCircle,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header con gradiente sutil */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
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
            </div>
            <div className="hidden md:flex items-center space-x-4">
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

      {/* Hero Section - Mejorado con animaciones y gradientes */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-24 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-white text-sm font-medium">Sistema Multitenant · Totalmente Personalizable</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Gestión Simplificada para
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Empresas de Reparaciones
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Centraliza clientes, técnicos, trabajos y presupuestos en una sola plataforma. 
              Diseñada específicamente para empresas que trabajan con <span className="font-semibold text-white">aseguradoras</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/auth/register" 
                className="group bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl font-semibold text-lg inline-flex items-center justify-center"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/auth/login" 
                className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all font-semibold text-lg"
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-blue-200">Gratis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-blue-200">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">∞</div>
                <div className="text-sm text-blue-200">Usuarios</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Account Section - Destacado */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-yellow-50 border-y-4 border-orange-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <Zap className="h-6 w-6 mr-2" />
                    Prueba la Demo Ahora
                  </h2>
                  <p className="text-orange-100">Explora todas las funcionalidades sin registro</p>
                </div>
                <Award className="h-16 w-16 text-orange-200 opacity-50" />
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center mb-3">
                    <Mail className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Email</span>
                  </div>
                  <code className="text-lg font-mono font-bold text-gray-900 bg-white px-4 py-2 rounded-lg block">
                    demo@demo.com
                  </code>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center mb-3">
                    <Shield className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Password</span>
                  </div>
                  <code className="text-lg font-mono font-bold text-gray-900 bg-white px-4 py-2 rounded-lg block">
                    demodemo
                  </code>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/auth/login" 
                  className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Acceder a la Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Grid mejorado */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4 font-medium">
              <Star className="h-4 w-4 mr-2" />
              Funcionalidades Completas
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Todo lo que necesitas para
              <br />
              <span className="text-blue-600">gestionar tu negocio</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde la primera llamada del cliente hasta la facturación final, 
              Gestiogar te acompaña en cada paso con herramientas profesionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gestión de Clientes */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Gestión de Clientes</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Base de datos centralizada con historial completo de servicios. 
                Ideal para empresas que trabajan con aseguradoras.
              </p>
              <div className="mt-4 flex items-center justify-center text-blue-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Historial completo
              </div>
            </div>

            {/* Gestión de Técnicos */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Gestión de Técnicos</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Asigna trabajos según especialidad y proximidad. 
                Controla horarios y rendimiento del equipo.
              </p>
              <div className="mt-4 flex items-center justify-center text-green-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Asignación inteligente
              </div>
            </div>

            {/* Trabajos y Presupuestos */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Trabajos y Presupuestos</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Desde la creación del presupuesto hasta la factura final. 
                Seguimiento completo del ciclo de vida.
              </p>
              <div className="mt-4 flex items-center justify-center text-purple-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Ciclo completo
              </div>
            </div>

            {/* Integración con Aseguradoras */}
            <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Aseguradoras</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Gestiona casos de seguro y comunicación con aseguradoras. 
                Automatiza procesos administrativos.
              </p>
              <div className="mt-4 flex items-center justify-center text-red-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Comunicación directa
              </div>
            </div>

            {/* Reportes y Analytics */}
            <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Analytics y Reportes</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Dashboard con métricas en tiempo real. 
                Decisiones basadas en datos reales de tu negocio.
              </p>
              <div className="mt-4 flex items-center justify-center text-yellow-700 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Datos en tiempo real
              </div>
            </div>

            {/* Sistema Modular */}
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Sistema Modular</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Expande funcionalidades con módulos especializados. 
                Personaliza la plataforma según tus necesidades.
              </p>
              <div className="mt-4 flex items-center justify-center text-indigo-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                100% personalizable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Nuevo */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Gestiogar?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La plataforma pensada para empresas de reparaciones que quieren crecer
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aumenta tu Productividad</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Automatiza tareas repetitivas, reduce errores y ahorra hasta 10 horas semanales 
                    en gestión administrativa.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Rápido y Fácil de Usar</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Interfaz intuitiva diseñada para técnicos y administradores. 
                    Empieza a trabajar en menos de 5 minutos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Seguro y Confiable</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Datos protegidos con encriptación de nivel empresarial. 
                    Backups automáticos y cumplimiento RGPD.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Multitenant Avanzado</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cada empresa tiene sus propios datos completamente aislados. 
                    Seguridad y privacidad garantizadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Rediseñado */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white py-24 overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para digitalizar tu empresa?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Únete a las empresas que ya están usando Gestiogar para mejorar su eficiencia 
            y aumentar su productividad.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/auth/register" 
              className="group bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl font-bold text-lg inline-flex items-center justify-center"
            >
              Crear Cuenta Gratis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/auth/login" 
              className="border-2 border-white text-white px-10 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all font-bold text-lg"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
              <span>Gratis para siempre</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
              <span>Sin límites</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mejorado */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <Image
                    src="/logo.png"
                    alt="Gestiogar Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </div>
                <span className="ml-3 text-2xl font-bold">Gestiogar</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Plataforma de gestión integral para empresas de reparaciones del hogar. 
                Diseñada para maximizar tu eficiencia y rentabilidad.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <Phone className="h-5 w-5 text-gray-400" />
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <Mail className="h-5 w-5 text-gray-400" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Producto</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Demo Account</Link></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Características</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Soporte</h3>
              <ul className="space-y-3 text-gray-400">
                <li><span className="hover:text-white cursor-pointer transition-colors">Centro de Ayuda</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Documentación</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Contacto</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Privacidad</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">&copy; 2025 Gestiogar. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-gray-400 text-sm">
              <span className="hover:text-white cursor-pointer transition-colors">Términos</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
              <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
