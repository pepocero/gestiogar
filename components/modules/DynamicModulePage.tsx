'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Edit, Trash2, Save, X } from 'lucide-react'
import { getModuleData, createModuleData, updateModuleData, deleteModuleData } from '@/lib/modules'
import { ModuleData } from '@/types/module'
import toast from 'react-hot-toast'

interface DynamicModulePageProps {
  moduleId: string
  moduleName: string
  config: any
}

export default function DynamicModulePage({ moduleId, moduleName, config }: DynamicModulePageProps) {
  const [data, setData] = useState<ModuleData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ModuleData | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [moduleId])

  const loadData = async () => {
    try {
      setLoading(true)
      const moduleData = await getModuleData(moduleId)
      setData(moduleData)
    } catch (error) {
      console.error('Error loading module data:', error)
      toast.error('Error cargando datos del módulo')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const newData = await createModuleData({
        module_id: moduleId,
        data: formData
      })
      
      setData(prev => [newData, ...prev])
      setShowCreateModal(false)
      setFormData({})
      toast.success('Elemento creado correctamente')
    } catch (error) {
      console.error('Error creating data:', error)
      toast.error('Error creando elemento')
    }
  }

  const handleUpdate = async () => {
    if (!editingItem) return

    try {
      const updatedData = await updateModuleData(editingItem.id, {
        data: formData
      })
      
      setData(prev => prev.map(item => 
        item.id === editingItem.id ? updatedData : item
      ))
      setShowEditModal(false)
      setEditingItem(null)
      setFormData({})
      toast.success('Elemento actualizado correctamente')
    } catch (error) {
      console.error('Error updating data:', error)
      toast.error('Error actualizando elemento')
    }
  }

  const handleDelete = async (item: ModuleData) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return

    try {
      await deleteModuleData(item.id)
      setData(prev => prev.filter(d => d.id !== item.id))
      toast.success('Elemento eliminado correctamente')
    } catch (error) {
      console.error('Error deleting data:', error)
      toast.error('Error eliminando elemento')
    }
  }

  const handleEdit = (item: ModuleData) => {
    setEditingItem(item)
    setFormData(item.data)
    setShowEditModal(true)
  }

  const renderFormFields = (fields: any[], values: Record<string, any>, onChange: (key: string, value: any) => void) => {
    return fields.map((field) => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
          return (
            <Input
              key={field.name}
              label={field.label}
              type={field.type}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
          )
        case 'number':
          return (
            <Input
              key={field.name}
              label={field.label}
              type="number"
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, Number(e.target.value))}
              required={field.required}
            />
          )
        case 'textarea':
          return (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
              />
            </div>
          )
        case 'boolean':
          return (
            <div key={field.name} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={field.name}
                checked={values[field.name] || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
            </div>
          )
        default:
          return (
            <Input
              key={field.name}
              label={field.label}
              type="text"
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
          )
      }
    })
  }

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return JSON.stringify(item.data).toLowerCase().includes(searchLower)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{moduleName}</h1>
          <p className="text-gray-600 mt-1">
            {config.description || 'Gestiona los elementos de este módulo'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Nuevo
        </Button>
      </div>

      {/* Filtro de búsqueda */}
      <Card className="app-card">
        <div className="p-6">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar elementos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Lista de datos */}
      <Card className="app-card">
        <div className="p-6">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay elementos para mostrar</p>
              <p className="text-sm mt-1">Crea tu primer elemento para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {config.fields && config.fields.length > 0 ? (
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {config.fields.map((field: any) => (
                            <div key={field.name} className="text-sm">
                              <span className="font-medium text-gray-700">
                                {field.label}:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {item.data[field.name] !== undefined 
                                  ? String(item.data[field.name])
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {JSON.stringify(item.data, null, 2)}
                        </pre>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Creado: {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de creación */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Crear Nuevo Elemento - ${moduleName}`}
      >
        <div className="space-y-4">
          {config.fields && renderFormFields(
            config.fields,
            formData,
            (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                setFormData({})
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
            >
              <Save className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de edición */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingItem(null)
          setFormData({})
        }}
        title={`Editar Elemento - ${moduleName}`}
      >
        <div className="space-y-4">
          {editingItem && config.fields && renderFormFields(
            config.fields,
            formData,
            (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setEditingItem(null)
                setFormData({})
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
            >
              <Save className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
