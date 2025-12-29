'use client'

import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { Modal, Input, Badge } from '@/components/ui'
import { useAccounting } from '@/contexts/AccountingContext'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, RefreshCw, TrendingUp, TrendingDown, PieChart, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

type TransactionFormState = {
  date: string
  type: 'income' | 'expense' | 'tax' | 'transfer' | 'adjustment'
  category: string
  sub_category: string
  net_amount: string
  tax_rate: string
  payment_method: string
  status: 'pending' | 'paid' | 'cancelled'
  due_date: string
  notes: string
}

const TODAY = new Date().toISOString().slice(0, 10)

export default function AccountingPage() {
  const { company } = useAuth()
  const {
    transactions,
    loading,
    summary,
    filters,
    setFilters,
    refreshTransactions,
    addTransaction,
    removeTransaction
  } = useAccounting()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TransactionFormState>({
    date: TODAY,
    type: 'income',
    category: '',
    sub_category: '',
    net_amount: '',
    tax_rate: '21',
    payment_method: '',
    status: 'paid',
    due_date: '',
    notes: ''
  })

  const incomeVsExpenses = useMemo(() => {
    const income = summary.totalIncome
    const expenses = summary.totalExpenses + summary.totalTaxes
    return { income, expenses, difference: income - expenses }
  }, [summary])

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({
      ...filters,
      [key]: value === 'all' ? 'all' : value
    })
  }

  const resetForm = () => {
    setForm({
      date: TODAY,
      type: 'income',
      category: '',
      sub_category: '',
      net_amount: '',
      tax_rate: '21',
      payment_method: '',
      status: 'paid',
      due_date: '',
      notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.category.trim()) {
      toast.error('La categoría es obligatoria')
      return
    }

    const netAmount = parseFloat(form.net_amount || '0')
    if (Number.isNaN(netAmount) || netAmount <= 0) {
      toast.error('Introduce un importe válido')
      return
    }

    const taxRate = parseFloat(form.tax_rate || '0')
    const taxAmount = Number((netAmount * (taxRate / 100)).toFixed(2))
    const totalAmount = Number((netAmount + taxAmount).toFixed(2))

    try {
      setSaving(true)
      await addTransaction({
        company_id: company!.id,
        date: form.date,
        type: form.type,
        category: form.category,
        sub_category: form.sub_category || null,
        amount: totalAmount,
        net_amount: netAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        payment_method: form.payment_method || null,
        status: form.status,
        due_date: form.due_date || null,
        notes: form.notes || null
      })
      setShowModal(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('¿Seguro que quieres eliminar este movimiento?')
    if (!confirmDelete) return

    await removeTransaction(id)
  }

  const hasTransactions = transactions.length > 0
  const isInitialLoading = loading && !hasTransactions
  const isRefreshing = loading && hasTransactions

  if (isInitialLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando movimientos contables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SubscriptionBanner />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contabilidad</h1>
          <p className="text-gray-600">
            Controla los movimientos financieros de {company?.name || 'tu empresa'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => refreshTransactions()}
            loading={isRefreshing}
            disabled={isRefreshing}
          >
            <div className="relative flex items-center">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-gray-500'}`} />
              {isRefreshing && (
                <span className="sr-only">Actualizando</span>
              )}
            </div>
            Actualizar
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {isRefreshing && (
        <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 border border-primary-100 px-3 py-2 rounded-md">
          <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span>Actualizando movimientos...</span>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
              <option value="tax">Impuestos</option>
              <option value="transfer">Transferencias</option>
              <option value="adjustment">Ajustes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos</option>
              <option value="paid">Pagados</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Buscar por categoría, subcategoría o notas"
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          title="Ingresos"
          value={summary.totalIncome}
          highlight="text-green-600"
        />
        <SummaryCard
          icon={<TrendingDown className="h-6 w-6 text-red-500" />}
          title="Gastos + Impuestos"
          value={summary.totalExpenses + summary.totalTaxes}
          highlight="text-red-600"
        />
        <SummaryCard
          icon={<PieChart className="h-6 w-6 text-blue-500" />}
          title="Flujo de Caja"
          value={incomeVsExpenses.difference}
          highlight={incomeVsExpenses.difference >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <SummaryCard
          icon={<AlertCircle className="h-6 w-6 text-orange-500" />}
          title="Pendiente de cobro/pago"
          value={summary.pendingAmount}
          extra={`${summary.pendingCount} movimientos`}
          highlight="text-orange-600"
        />
      </div>

      {/* Tabla de movimientos */}
      <Card>
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos contables</h2>
          <span className="text-sm text-gray-500">{transactions.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead className="text-right">Impuesto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay movimientos para el periodo seleccionado.
                  </td>
                </tr>
              )}
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    {format(new Date(txn.date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(txn.type)}>
                      {getTypeLabel(txn.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{txn.category}</p>
                      {txn.sub_category && (
                        <p className="text-xs text-gray-500">{txn.sub_category}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    {formatCurrency(txn.amount, txn.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-600">
                    {txn.tax_amount ? formatCurrency(txn.tax_amount, txn.currency) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(txn.status)}>
                      {getStatusLabel(txn.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-transparent hover:border-gray-200"
                      onClick={() => handleDelete(txn.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="Nuevo movimiento contable"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TransactionFormState['type'] })
                }
                className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
                <option value="tax">Impuesto</option>
                <option value="transfer">Transferencia</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <Input
              label="Método de pago"
              placeholder="Transferencia, efectivo, tarjeta..."
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Categoría"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <Input
              label="Subcategoría"
              value={form.sub_category}
              onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Importe neto"
              type="number"
              min="0"
              step="0.01"
              value={form.net_amount}
              onChange={(e) => setForm({ ...form, net_amount: e.target.value })}
              required
            />
            <Input
              label="Impuesto (%)"
              type="number"
              min="0"
              step="0.01"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TransactionFormState['status'] })
                }
                className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="paid">Pagado / Cobrado</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {form.status === 'pending' && (
            <Input
              label="Fecha de vencimiento"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Información adicional, referencias internas, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar movimiento'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

interface SummaryCardProps {
  icon: React.ReactNode
  title: string
  value: number
  highlight: string
  extra?: string
}

function SummaryCard({ icon, title, value, highlight, extra }: SummaryCardProps) {
  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-xl font-semibold ${highlight}`}>
            {formatCurrency(value)}
          </p>
          {extra && <p className="text-xs text-gray-500 mt-1">{extra}</p>}
        </div>
      </div>
    </Card>
  )
}

function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  )
}

function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${className}`}>{children}</td>
}

function getTypeLabel(type: TransactionFormState['type']) {
  switch (type) {
    case 'income':
      return 'Ingreso'
    case 'expense':
      return 'Gasto'
    case 'tax':
      return 'Impuesto'
    case 'transfer':
      return 'Transferencia'
    case 'adjustment':
      return 'Ajuste'
  }
}

function getTypeVariant(type: TransactionFormState['type']) {
  switch (type) {
    case 'income':
      return 'success'
    case 'expense':
      return 'danger'
    case 'tax':
      return 'warning'
    case 'transfer':
      return 'gray'
    case 'adjustment':
      return 'info'
    default:
      return 'gray'
  }
}

function getStatusLabel(status: TransactionFormState['status']) {
  switch (status) {
    case 'paid':
      return 'Pagado'
    case 'pending':
      return 'Pendiente'
    case 'cancelled':
      return 'Cancelado'
  }
}

function getStatusVariant(status: TransactionFormState['status']) {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'gray'
    default:
      return 'gray'
  }
}

function formatCurrency(value: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency
  }).format(value || 0)
}

