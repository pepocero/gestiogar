// app/modules/holidays-vacations/src/components/HolidayForm.tsx
import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'
import { useHolidays } from '../hooks/useHolidays'
import { HolidaysService } from '../services/holidaysService'
import type { HolidayFormData } from '../types/holiday'
import toast from 'react-hot-toast'

interface HolidayFormProps {
  id?: string | null
  onSuccess: () => void
}

export function HolidayForm({ id, onSuccess }: HolidayFormProps) {
  const { createHoliday, updateHoliday } = useHolidays()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>({
    nombre: '',
    fecha: '',
    tipo: 'festivo_nacional',
    repetir_anual: false,
    descripcion: '',
    aplica_todos: true
  })
  
  const isEditing = !!id
  
  useEffect(() => {
    if (isEditing && id) {
      loadHoliday()
    }
  }, [id, isEditing])
  
  const loadHoliday = async () => {
    try {
      const holiday = await HolidaysService.getById(id!)
      setFormData({
        nombre: holiday.nombre,
        fecha: holiday.fecha,
        tipo: holiday.tipo,
        repetir_anual: holiday.repetir_anual,
        descripcion: holiday.descripcion || '',
        aplica_todos: holiday.aplica_todos
      })
    } catch (error) {
      toast.error('Error cargando día festivo')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isEditing) {
        await updateHoliday(id!, formData)
        toast.success('Día festivo actualizado correctamente')
      } else {
        await createHoliday(formData)
        toast.success('Día festivo creado correctamente')
      }
      onSuccess()
    } catch (error) {
      toast.error('Error guardando día festivo')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? 'Editar Día Festivo' : 'Nuevo Día Festivo'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Día Festivo *
          </label>
          <Input
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Día de la Independencia"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha *
          </label>
          <Input
            name="fecha"
            type="date"
            value={formData.fecha}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo *
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="festivo_nacional">Día Festivo Nacional</option>
            <option value="festivo_local">Día Festivo Local</option>
            <option value="festivo_empresa">Día Festivo de Empresa</option>
            <option value="puente">Día Puente</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              name="repetir_anual"
              type="checkbox"
              checked={formData.repetir_anual}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Repetir anualmente
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              name="aplica_todos"
              type="checkbox"
              checked={formData.aplica_todos}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Aplica a todos los empleados
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Descripción opcional del día festivo"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  )
}






