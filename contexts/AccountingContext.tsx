'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  AccountingSummary,
  AccountingTransaction,
  AccountingTransactionFilters,
  AccountingTransactionInput,
  calculateAccountingSummary,
  createAccountingTransaction,
  deleteAccountingTransaction,
  fetchAccountingTransactions,
  updateAccountingTransaction
} from '@/lib/accounting'
import toast from 'react-hot-toast'

interface AccountingContextType {
  transactions: AccountingTransaction[]
  loading: boolean
  summary: AccountingSummary
  filters: AccountingTransactionFilters
  setFilters: (filters: AccountingTransactionFilters) => void
  refreshTransactions: () => Promise<void>
  addTransaction: (input: AccountingTransactionInput) => Promise<void>
  editTransaction: (id: string, updates: Partial<AccountingTransactionInput>) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined)

const defaultSummary: AccountingSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  totalTaxes: 0,
  netCashFlow: 0,
  pendingCount: 0,
  pendingAmount: 0
}

export function AccountingProvider({ children }: { children: React.ReactNode }) {
  const { company, user } = useAuth()
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<AccountingTransactionFilters>(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      fromDate: firstDay.toISOString().slice(0, 10),
      toDate: now.toISOString().slice(0, 10),
      type: 'all',
      status: 'all'
    }
  })

  const summary = useMemo(() => calculateAccountingSummary(transactions), [transactions])

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, filters.fromDate, filters.toDate, filters.type, filters.status, filters.search])

  const loadTransactions = async () => {
    if (!company?.id) {
      setTransactions([])
      setLoading(false)
      // Solo log en modo debug (menos visible que console.log)
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Accounting] loadTransactions skipped: no company (esperando carga de company)')
      }
      return
    }

    try {
      setLoading(true)
      const data = await fetchAccountingTransactions(company.id, filters)
      setTransactions(data)
    } catch (error) {
      toast.error('Error cargando movimientos contables')
    } finally {
      setLoading(false)
    }
  }

  const refreshTransactions = async () => {
    await loadTransactions()
  }

  const addTransaction = async (input: AccountingTransactionInput) => {
    if (!company?.id || !user?.id) {
      toast.error('No se pudo obtener la empresa o el usuario')
      return
    }

    try {
      const newTransaction = await createAccountingTransaction({
        ...input,
        company_id: company.id,
        created_by: user.id
      })
      setTransactions((prev) => [newTransaction, ...prev])
      toast.success('Movimiento registrado correctamente')
    } catch (error: any) {
      console.error('[Accounting] addTransaction error', error)
      toast.error('Error al registrar el movimiento')
    }
  }

  const editTransaction = async (
    id: string,
    updates: Partial<AccountingTransactionInput>
  ) => {
    if (!company?.id) {
      toast.error('No se pudo obtener la empresa')
      return
    }

    try {
      const updated = await updateAccountingTransaction(id, company.id, updates)
      setTransactions((prev) =>
        prev.map((txn) => (txn.id === id ? { ...txn, ...updated } : txn))
      )
      toast.success('Movimiento actualizado correctamente')
    } catch (error) {
      console.error('[Accounting] editTransaction error', error)
      toast.error('Error al actualizar el movimiento')
    }
  }

  const removeTransaction = async (id: string) => {
    if (!company?.id) {
      toast.error('No se pudo obtener la empresa')
      return
    }

    try {
      await deleteAccountingTransaction(id, company.id)
      setTransactions((prev) => prev.filter((txn) => txn.id !== id))
      toast.success('Movimiento eliminado correctamente')
    } catch (error) {
      console.error('[Accounting] removeTransaction error', error)
      toast.error('Error al eliminar el movimiento')
    }
  }

  const value: AccountingContextType = {
    transactions,
    loading,
    summary,
    filters,
    setFilters,
    refreshTransactions,
    addTransaction,
    editTransaction,
    removeTransaction
  }

  return <AccountingContext.Provider value={value}>{children}</AccountingContext.Provider>
}

export function useAccounting() {
  const context = useContext(AccountingContext)
  if (context === undefined) {
    throw new Error('useAccounting debe usarse dentro de AccountingProvider')
  }
  return context
}

