// app/modules/holidays-vacations/src/components/HolidaysList.tsx
import { useState } from 'react'
import { Card, Button, Table, Badge, Modal } from '@/components/ui'
import { Plus, Edit, Trash2, Calendar, Filter } from 'lucide-react'
import { useHolidays } from '../hooks/useHolidays'
import { HolidayForm } from './HolidayForm'

export function HolidaysList() {
  const {
    holidays,
    loading,
    error,
    deleteHoliday
  } = useHolidays()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  
  const getTipoColor = (tipo: string) => {
    const colors = {
      festivo_nacional: 'blue',
      festivo_local: 'green',
      festivo_empresa: 'purple',
      puente: 'orange'
    }
    return colors[tipo] || 'gray'
  }
  
  const getTipoLabel = (tipo: string) => {
    const labels = {
      festivo_nacional: 'Nacional',
      festivo_local: 'Local',
      festivo_empresa: 'Empresa',
      puente: 'Puente'
    }
    return labels[tipo] || tipo
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este día festivo?')) {
      try {
        await deleteHoliday(id)
        toast.success('Día festivo eliminado correctamente')
      } catch (error) {
        toast.error('Error eliminando el día festivo')
      }
    }
  }
  
  const filteredHolidays = filterType === 'all' 
    ? holidays 
    : holidays.filter(holiday => holiday.tipo === filterType)
  
  if (loading) return <div>Cargando días festivos...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-blue-500" />
              <h1 className="text-2xl font-bold">Días Festivos</h1>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos los tipos</option>
                <option value="festivo_nacional">Nacionales</option>
                <option value="festivo_local">Locales</option>
                <option value="festivo_empresa">Empresa</option>
                <option value="puente">Puentes</option>
              </select>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Día Festivo
              </Button>
            </div>
          </div>
          
          <Table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Repetir Anual</th>
                <th>Aplica a Todos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHolidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td className="font-medium">{holiday.nombre}</td>
                  <td>
                    {new Date(holiday.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <Badge color={getTipoColor(holiday.tipo)}>
                      {getTipoLabel(holiday.tipo)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={holiday.repetir_anual ? 'success' : 'secondary'}>
                      {holiday.repetir_anual ? 'Sí' : 'No'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={holiday.aplica_todos ? 'success' : 'secondary'}>
                      {holiday.aplica_todos ? 'Sí' : 'No'}
                    </Badge>
                  </td>
                  <td className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(holiday.id)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      color="red"
                      onClick={() => handleDelete(holiday.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {filteredHolidays.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay días festivos
              </h3>
              <p className="text-gray-500 mb-4">
                {filterType === 'all' 
                  ? 'Comienza agregando tu primer día festivo.'
                  : 'No hay días festivos de este tipo.'}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Día Festivo
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {showForm && (
        <Modal isOpen={showForm} onClose={() => {
          setShowForm(false)
          setEditingId(null)
        }}>
          <HolidayForm
            id={editingId}
            onSuccess={() => {
              setShowForm(false)
              setEditingId(null)
            }}
          />
        </Modal>
      )}
    </>
  )
}

