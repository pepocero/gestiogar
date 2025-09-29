'use client'

import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download,
  FileText,
  PieChart,
  Activity
} from 'lucide-react'

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
              <p className="text-gray-600">Análisis y estadísticas de tu empresa</p>
            </div>
            <Button className="btn-primary">
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>

          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Financial Reports */}
            <Card>
              <CardHeader title="Reportes Financieros" />
              <CardBody>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ingresos y Gastos
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Rentabilidad
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Facturas Pendientes
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Operational Reports */}
            <Card>
              <CardHeader title="Reportes Operacionales" />
              <CardBody>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Trabajos Realizados
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Programación
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Rendimiento Técnicos
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Customer Reports */}
            <Card>
              <CardHeader title="Reportes de Clientes" />
              <CardBody>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Satisfacción Cliente
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <PieChart className="h-4 w-4 mr-2" />
                    Segmentación
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Frecuencia de Servicios
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
                    <p className="text-2xl font-semibold text-gray-900">€0</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Trabajos Completados</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Crecimiento</p>
                    <p className="text-2xl font-semibold text-gray-900">0%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader title="Resumen de Actividad" />
            <CardBody>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Los gráficos se mostrarán aquí cuando haya datos disponibles</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
