'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Plus, Upload, Settings, Trash2, Play, Pause, Eye, Package, ArrowLeft, Store, Download, Star, Users, Calendar, Truck, Receipt } from 'lucide-react'
import Link from 'next/link'
import { Module } from '@/types/module'
import { getModules, updateModule, deleteModule, installModule } from '@/lib/modules'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

// Definir los módulos disponibles en la tienda
const AVAILABLE_MODULES = [
  {
    id: 'holidays-vacations',
    name: 'Gestión de Días Festivos y Vacaciones',
    version: '1.0.0',
    description: 'Gestiona los días festivos y vacaciones de los técnicos. Incluye calendario de vacaciones, solicitudes de días libres y planificación de horarios.',
    author: 'Gestiogar Team',
    category: 'recursos-humanos',
    icon: 'Calendar',
    price: 'Gratis',
    rating: 4.8,
    downloads: 1250,
    features: [
      'Calendario de días festivos',
      'Solicitudes de vacaciones',
      'Aprobación de días libres',
      'Integración con horarios de trabajo',
      'Reportes de ausencias',
      'Notificaciones automáticas'
    ],
    manifest: {
      name: 'Gestión de Días Festivos y Vacaciones',
      version: '1.0.0',
      description: 'Gestiona los días festivos y vacaciones de los técnicos',
      author: 'Gestiogar Team',
      license: 'MIT',
      config: {
        title: 'Días Festivos y Vacaciones',
        description: 'Administra los días festivos y vacaciones de tu equipo',
        icon: 'Calendar',
        fields: [
          {
            name: 'tecnico',
            label: 'Técnico',
            type: 'select',
            required: true,
            dynamic: true,
            source: 'technicians',
            options: [
              { value: 'todos', label: 'Todos los técnicos' }
            ]
          },
          {
            name: 'tipo',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
              { value: 'festivo', label: 'Día Festivo Nacional' },
              { value: 'local', label: 'Día Festivo Local' },
              { value: 'empresa', label: 'Día Festivo de Empresa' },
              { value: 'vacaciones', label: 'Vacaciones' }
            ]
          },
          {
            name: 'nombre',
            label: 'Nombre del Día Festivo',
            type: 'text',
            required: true
          },
          {
            name: 'fecha_inicio',
            label: 'Fecha de Inicio',
            type: 'date',
            required: true
          },
          {
            name: 'fecha_fin',
            label: 'Fecha de Fin',
            type: 'date',
            required: false
          },
          {
            name: 'repetir_anual',
            label: 'Repetir Anualmente',
            type: 'boolean',
            required: false
          },
          {
            name: 'descripcion',
            label: 'Descripción',
            type: 'textarea',
            required: false
          }
        ]
      }
    }
  },
  {
    id: 'vehicle-management',
    name: 'Gestión de Vehículos de Servicio',
    version: '1.2.0',
    description: 'Administra la flota de vehículos de la empresa. Control de mantenimientos, combustible, seguros y asignación a técnicos.',
    author: 'Gestiogar Team',
    category: 'logistica',
    icon: 'Truck',
    price: 'Gratis',
    rating: 4.6,
    downloads: 980,
    features: [
      'Registro de vehículos',
      'Control de mantenimientos',
      'Seguimiento de combustible',
      'Gestión de seguros',
      'Asignación a técnicos',
      'Reportes de uso'
    ],
    manifest: {
      name: 'Gestión de Vehículos de Servicio',
      version: '1.2.0',
      description: 'Administra la flota de vehículos de la empresa',
      author: 'Gestiogar Team',
      license: 'MIT',
      config: {
        title: 'Vehículos',
        description: 'Gestiona tu flota de vehículos de servicio',
        icon: 'Truck',
        fields: [
          {
            name: 'marca',
            label: 'Marca',
            type: 'text',
            required: true
          },
          {
            name: 'modelo',
            label: 'Modelo',
            type: 'text',
            required: true
          },
          {
            name: 'placa',
            label: 'Placa',
            type: 'text',
            required: true
          },
          {
            name: 'año',
            label: 'Año',
            type: 'number',
            required: true
          },
          {
            name: 'tipo_combustible',
            label: 'Tipo de Combustible',
            type: 'select',
            required: true,
            options: [
              { value: 'gasolina', label: 'Gasolina' },
              { value: 'diesel', label: 'Diésel' },
              { value: 'electrico', label: 'Eléctrico' },
              { value: 'hibrido', label: 'Híbrido' }
            ]
          },
          {
            name: 'tecnico',
            label: 'Técnico Asignado',
            type: 'select',
            required: true,
            dynamic: true,
            source: 'technicians',
            options: [
              { value: 'sin_asignar', label: 'Sin asignar' }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'expense-tracker',
    name: 'Control de Gastos Operativos',
    version: '1.1.0',
    description: 'Registra y controla todos los gastos operativos de la empresa. Categorización, aprobaciones y reportes detallados.',
    author: 'Gestiogar Team',
    category: 'finanzas',
    icon: 'Receipt',
    price: 'Gratis',
    rating: 4.7,
    downloads: 1100,
    features: [
      'Registro de gastos',
      'Categorización automática',
      'Aprobaciones de gastos',
      'Integración con facturas',
      'Reportes financieros',
      'Control de presupuestos'
    ],
    manifest: {
      name: 'Control de Gastos Operativos',
      version: '1.1.0',
      description: 'Registra y controla todos los gastos operativos',
      author: 'Gestiogar Team',
      license: 'MIT',
      config: {
        title: 'Gastos',
        description: 'Controla los gastos operativos de tu empresa',
        icon: 'Receipt',
        fields: [
          {
            name: 'concepto',
            label: 'Concepto del Gasto',
            type: 'text',
            required: true
          },
          {
            name: 'monto',
            label: 'Monto',
            type: 'number',
            required: true
          },
          {
            name: 'categoria',
            label: 'Categoría',
            type: 'select',
            required: true,
            options: [
              { value: 'combustible', label: 'Combustible' },
              { value: 'herramientas', label: 'Herramientas' },
              { value: 'materiales', label: 'Materiales' },
              { value: 'mantenimiento', label: 'Mantenimiento' },
              { value: 'otros', label: 'Otros' }
            ]
          },
          {
            name: 'fecha',
            label: 'Fecha',
            type: 'date',
            required: true
          },
          {
            name: 'descripcion',
            label: 'Descripción',
            type: 'textarea',
            required: false
          }
        ]
      }
    }
  }
]

export default function ModulesPage() {
  const { user, company } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'installed' | 'store'>('installed')

  useEffect(() => {
    if (company?.id) {
      loadModules(company.id)
    }
  }, [company?.id])

  const loadModules = async (companyId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getModules(companyId)
      console.log('Módulos cargados:', data)
      setModules(data)
      
      // Si no hay datos pero tampoco hay error, las tablas están funcionando
      if (data.length === 0) {
        setError(null) // Sin error, solo no hay módulos instalados
      }
    } catch (error: any) {
      console.error('Error loading modules:', error)
      setModules([])
      
      // Si las tablas no existen, establecer error específico
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        setError('tables_missing')
      } else {
        setError('other')
        toast.error('Error cargando módulos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInstallModule = async () => {
    if (!file || !user?.id || !company?.id) return

    try {
      setLoading(true)
      const newModule = await installModule(file, company.id, user.id)
      setModules(prev => [...prev, newModule])
      setShowInstallModal(false)
      setFile(null)
      toast.success('Módulo instalado correctamente')
    } catch (error) {
      console.error('Error installing module:', error)
      toast.error('Error instalando módulo')
    } finally {
      setLoading(false)
    }
  }

  const handleInstallFromStore = async (moduleData: any) => {
    if (!user?.id || !company?.id) return

    try {
      setLoading(true)
      
      // Verificar si el módulo ya está instalado
      const existingModule = modules.find(m => m.slug === moduleData.id)
      
      if (existingModule) {
        // Actualizar módulo existente con nueva configuración
        const updatedModule = await updateModule(existingModule.id, {
          config: moduleData.manifest.config,
          version: moduleData.version,
          description: moduleData.description
        })
        
        setModules(prev => 
          prev.map(m => m.id === existingModule.id ? updatedModule : m)
        )
        
        toast.success(`${moduleData.name} actualizado correctamente`)
      } else {
        // Crear manifest con la estructura correcta que espera el validador
        const manifest = {
          name: moduleData.name,
          slug: moduleData.id,
          version: moduleData.version,
          description: moduleData.description,
          author: moduleData.author,
          license: 'MIT',
          icon: moduleData.icon,
          fields: moduleData.manifest.config.fields,
          displayName: moduleData.manifest.config.title,
          displayDescription: moduleData.manifest.config.description,
          config: moduleData.manifest.config,
          database: moduleData.manifest.database // Incluir información de base de datos
        }
        
        // Crear un archivo JSON temporal con el manifest del módulo
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
        const file = new File([blob], `${moduleData.id}.json`, { type: 'application/json' })
        
        const newModule = await installModule(file, company.id, user.id)
        setModules(prev => [...prev, newModule])
        
        // Mostrar notificación de éxito con información sobre tablas
        let successMessage = `${moduleData.name} instalado correctamente`
        
        if (moduleData.manifest.database?.create_tables && moduleData.manifest.database?.tables) {
          successMessage += `. Nota: Este módulo requiere crear tablas en la base de datos. Ve a la documentación del módulo para las instrucciones.`
        }
        
        toast.success(successMessage, { duration: 6000 })
      }
    } catch (error) {
      console.error('Error installing module from store:', error)
      toast.error('Error instalando módulo desde la tienda')
    } finally {
      setLoading(false)
    }
  }

  const isModuleInstalled = (moduleId: string) => {
    return modules.some(module => module.slug === moduleId)
  }

  const handleToggleModule = async (module: Module) => {
    try {
      const updatedModule = await updateModule(module.id, {
        is_active: !module.is_active
      })
      setModules(prev => 
        prev.map(m => m.id === module.id ? updatedModule : m)
      )
      toast.success(`Módulo ${updatedModule.is_active ? 'activado' : 'desactivado'}`)
    } catch (error) {
      console.error('Error toggling module:', error)
      toast.error('Error actualizando módulo')
    }
  }

  const handleDeleteModule = async (module: Module) => {
    if (!confirm(`¿Estás seguro de eliminar el módulo "${module.name}"?`)) return

    try {
      if (!company?.id) return
      await deleteModule(module.id, company.id)
      setModules(prev => prev.filter(m => m.id !== module.id))
      toast.success('Módulo eliminado correctamente')
    } catch (error) {
      console.error('Error deleting module:', error)
      toast.error('Error eliminando módulo')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        toast.error('El archivo debe ser un JSON válido')
        return
      }
      setFile(selectedFile)
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
      {/* Botón de volver */}
      <div className="flex items-center mb-4">
        <Link
          href="/settings"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Configuración
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los módulos adicionales del sistema
          </p>
        </div>
        <Button
          onClick={() => setShowInstallModal(true)}
          className="btn-primary"
          disabled={error === 'tables_missing'}
        >
          <Plus className="h-5 w-5 mr-2" />
          Instalar Módulo
        </Button>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('installed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'installed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Módulos Instalados
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'store'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Store className="h-4 w-4 inline mr-2" />
            Tienda de Módulos
          </button>
        </nav>
      </div>

      <Card className="app-card">
        <div className="p-6">
          {activeTab === 'installed' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Módulos Instalados
              </h2>
              
              {error === 'tables_missing' ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Sistema de Módulos no Inicializado
                </h3>
                <p className="text-yellow-700 mb-4">
                  Para usar módulos, primero necesitas crear las tablas en Supabase.
                </p>
                <div className="text-left bg-white p-4 rounded border">
                  <h4 className="font-medium text-yellow-800 mb-2">Pasos para solucionarlo:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Ve a tu proyecto en Supabase Dashboard</li>
                    <li>2. Abre el SQL Editor</li>
                    <li>3. Ejecuta el contenido de: <code className="bg-gray-100 px-1 rounded">database/create_modules_tables.sql</code></li>
                    <li>4. Refresca esta página</li>
                  </ol>
                </div>
                <a 
                  href="../INSTALAR_MODULOS_README.md" 
                  className="inline-block mt-4 text-yellow-800 underline hover:text-yellow-900"
                  target="_blank"
                >
                  Descargar instrucciones detalladas →
                </a>
              </div>
              <p className="text-gray-500">Una vez inicializado, aparecerá aquí la lista de módulos instalados.</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Sin módulos instalados
                </h3>
                <p className="text-blue-700 mb-4">
                  El sistema de módulos está funcionando correctamente. 
                  Puedes instalar tu primer módulo ahora mismo.
                </p>
              </div>
              <p className="text-gray-500">Instala módulos desde archivos JSON o crea uno personalizado.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-500">v{module.version}</p>
                      </div>
                    </div>
                    <Badge
                      variant={module.is_active ? 'success' : 'gray'}
                      className="text-xs"
                    >
                      {module.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  
                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedModule(module)
                          setShowDetailsModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleModule(module)}
                      >
                        {module.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteModule(module)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tienda de Módulos
              </h2>
              <p className="text-gray-600 mb-6">
                Explora y instala módulos adicionales para ampliar las funcionalidades de tu sistema.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {AVAILABLE_MODULES.map((moduleData) => {
                  const installed = isModuleInstalled(moduleData.id)
                  return (
                    <div key={moduleData.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                            {moduleData.icon === 'Calendar' && <Calendar className="h-6 w-6 text-primary-600" />}
                            {moduleData.icon === 'Truck' && <Truck className="h-6 w-6 text-primary-600" />}
                            {moduleData.icon === 'Receipt' && <Receipt className="h-6 w-6 text-primary-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{moduleData.name}</h3>
                            <p className="text-sm text-gray-500">v{moduleData.version}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{moduleData.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {moduleData.description}
                      </p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Características principales:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {moduleData.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
                              {feature}
                            </li>
                          ))}
                          {moduleData.features.length > 3 && (
                            <li className="text-primary-600 text-xs">
                              +{moduleData.features.length - 3} características más
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {moduleData.downloads.toLocaleString()}
                          </span>
                          <span className="font-medium text-green-600">{moduleData.price}</span>
                        </div>
                        <Badge variant="gray" className="text-xs">
                          {moduleData.category}
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant={installed ? "outline" : "primary"}
                          onClick={() => handleInstallFromStore(moduleData)}
                          disabled={loading}
                          className="flex-1"
                        >
                          {installed ? (
                            <>
                              <Settings className="h-4 w-4 mr-2" />
                              Actualizar
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Instalar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedModule({
                              id: moduleData.id,
                              slug: moduleData.id,
                              name: moduleData.name,
                              version: moduleData.version,
                              description: moduleData.description,
                              icon: moduleData.icon,
                              config: moduleData.manifest.config,
                              is_active: true,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              company_id: company?.id || '',
                              created_by: user?.id || ''
                            } as Module)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Modal para instalar módulo */}
      <Modal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Instalar Nuevo Módulo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo del Módulo (JSON)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="module-file"
              />
              <label htmlFor="module-file" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Haz clic para seleccionar archivo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona un archivo JSON válido con el manifiesto del módulo
                </p>
              </label>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Formato del Manifiesto</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• <strong>name:</strong> Nombre del módulo</p>
              <p>• <strong>version:</strong> Versión (ej: "1.0.0")</p>
              <p>• <strong>description:</strong> Descripción del módulo</p>
              <p>• <strong>author:</strong> Autor del módulo</p>
              <p>• <strong>config:</strong> Configuración del módulo</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowInstallModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleInstallModule}
              disabled={!file}
            >
              Instalar Módulo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para detalles del módulo */}
      {selectedModule && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedModule.name} - Detalles`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Versión</label>
                <p className="text-gray-900">{selectedModule.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <Badge 
                  variant={selectedModule.is_active ? 'success' : 'gray'}
                  className="ml-2"
                >
                  {selectedModule.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Icono</label>
              <p className="text-gray-900">{selectedModule.icon}</p>
            </div>
            
            {selectedModule.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <p className="text-gray-900">{selectedModule.description}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">Configuración</label>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(selectedModule.config, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
