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
  Clock
} from 'lucide-react'

export default function HomePage() {
  // Landing page simplificada sin dependencias de autenticación
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="GestioGar"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">GestioGar</h1>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-900">
                Iniciar Sesión
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestión Simplificada para <br />
            <span className="text-blue-600">Empresas de Reparaciones</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Centraliza clientes, técnicos, trabajos y presupuestos en una sola plataforma. 
            Diseñada específicamente para empresas que trabajan con aseguradoras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Comenzar Gratis
            </Link>
            <Link 
              href="/auth/login" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            ¿Quieres probarlo? Usa las credenciales demo
          </h2>
          <div className="bg-blue-600 text-white p-6 rounded-lg inline-block">
            <p className="text-lg mb-2"><strong>Demo Account</strong></p>
            <p className="mb-1">📧 Email: <code>demo@demo.com</code></p>
            <p>🔑 Password: <code>demodemo</code></p>
            <div className="mt-4">
              <Link 
                href="/auth/login" 
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Acceder Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para gestionar tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Desde la primera llamada del cliente hasta la facturación final, 
              GestioGar te acompaña en cada paso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gestión de Clientes */}
            <div className="text-center p-6">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Gestión de Clientes</h3>
              <p className="text-gray-600">
                Base de datos centralizada con historial completo de servicios. 
                Ideal para empresas que trabajan con aseguradoras.
              </p>
            </div>

            {/* Gestión de Técnicos */}
            <div className="text-center p-6">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Gestión de Técnicos</h3>
              <p className="text-gray-600">
                Asigna trabajos según especialidad y proximidad. 
                Controla horarios y rendimiento del equipo.
              </p>
            </div>

            {/* Trabajos y Presupuestos */}
            <div className="text-center p-6">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trabajos y Presupuestos</h3>
              <p className="text-gray-600">
                Desde la creación del presupuesto hasta la factura final. 
                Seguimiento completo del ciclo de vida.
              </p>
            </div>

            {/* Integración con Aseguradoras */}
            <div className="text-center p-6">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Aseguradoras</h3>
              <p className="text-gray-600">
                Gestiona casos de seguro y comunicación con aseguradoras. 
                Automatiza procesos administrativos.
              </p>
            </div>

            {/* Reportes y Analytics */}
            <div className="text-center p-6">
              <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics y Reportes</h3>
              <p className="text-gray-600">
                Dashboard con métricas en tiempo real. 
                Decisiones basadas en datos reales de tu negocio.
              </p>
            </div>

            {/* Sistema Modular */}
            <div className="text-center p-6">
              <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sistema Modular</h3>
              <p className="text-gray-600">
                Expande funcionalidades con módulos especializados. 
                Personaliza la plataforma según tus necesidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para digitalizar tu empresa?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Únete empresas que ya están usando GestioGar para mejorar su eficiencia 
            y aumentar su productividad.
          </p>
          <Link 
            href="/auth/register" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium inline-flex items-center"
          >
            Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/logo.png"
                  alt="GestioGar"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span className="ml-2 text-xl font-bold">GestioGar</span>
              </div>
              <p className="text-gray-400">
                Plataforma de gestión para empresas de reparaciones del hogar.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/register" className="hover:text-white">Registrarse</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Iniciar Sesión</Link></li>
                <li><span className="hover:text-white cursor-pointer">Demo Account</span></li>
                <li><span className="hover:text-white cursor-pointer">Características</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><span className="hover:text-white cursor-pointer">Sobre nosotros</span></li>
                <li><span className="hover:text-white cursor-pointer">Contacto</span></li>
                <li><span className="hover:text-white cursor-pointer">Precios</span></li>
                <li><span className="hover:text-white cursor-pointer">Blog</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><span className="hover:text-white cursor-pointer">Ayuda</span></li>
                <li><span className="hover:text-white cursor-pointer">Documentación</span></li>
                <li><span className="hover:text-white cursor-pointer">Estado del sistema</span></li>
                <li><span className="hover:text-white cursor-pointer">Privacidad</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GestioGar. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}