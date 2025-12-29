'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
// Layout ya se aplica automáticamente en ProtectedLayout
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseAdmin, supabaseTable, supabaseAdminTable } from '@/lib/supabase'
import { getPlanLimits, applyPlanLimit, canCreateItem } from '@/lib/subscription'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, X, Printer, FileText, Calendar, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvoicesPage() {
  const { company, loading: authLoading } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [autoGenerateNumber, setAutoGenerateNumber] = useState(true)
  const [subtotal, setSubtotal] = useState<number>(0)
  const [ivaPercentage, setIvaPercentage] = useState<number>(21)
  const [total, setTotal] = useState<number>(0)
  const [clients, setClients] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client_id: '',
    date_from: '',
    date_to: ''
  })
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const loadingRef = useRef(false)

  const loadClients = useCallback(async () => {
    if (!company?.id) return
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Invoices] loadClients start', company.id)
      }
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('company_id', company.id)
        .order('first_name')

      if (error) {
        throw error
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }, [company?.id])

  const fetchInvoices = useCallback(async () => {
    if (!company?.id || loadingRef.current) return
    
    loadingRef.current = true
    setLoadingInvoices(true)
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Invoices] fetchInvoices start', company.id)
      }
      // Obtener límites del plan
      const limits = await getPlanLimits(company.id)
      
      let query = supabaseTable('invoices')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          )
        `)
        .eq('company_id', company.id)
      
      // Aplicar límite según el plan
      query = applyPlanLimit(query, limits.max_invoices, 'created_at', true)

      const { data, error } = await query

      if (error) {
        throw error
      }

      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Error al cargar las facturas')
    } finally {
      setLoadingInvoices(false)
      loadingRef.current = false
    }
  }, [company?.id])

  // Calcular el total automáticamente cuando cambian subtotal o IVA
  React.useEffect(() => {
    const ivaAmount = subtotal * (ivaPercentage / 100)
    setTotal(subtotal + ivaAmount)
  }, [subtotal, ivaPercentage])

  // Cargar clientes y facturas al montar el componente
  useEffect(() => {
    // Esperar a que la autenticación termine y company esté disponible
    if (!authLoading && company?.id && !loadingRef.current) {
      loadClients()
      fetchInvoices()
    }
  }, [authLoading, company?.id, loadClients, fetchInvoices])

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (showCreateModal && company?.id) {
      loadClients()
    }
  }, [showCreateModal, company?.id, loadClients])

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...invoices]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        (invoice.client?.first_name?.toLowerCase().includes(searchLower)) ||
        (invoice.client?.last_name?.toLowerCase().includes(searchLower))
      )
    }

    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status)
    }

    if (filters.client_id) {
      filtered = filtered.filter(invoice => invoice.client_id === filters.client_id)
    }

    if (filters.date_from) {
      filtered = filtered.filter(invoice => invoice.issue_date >= filters.date_from)
    }

    if (filters.date_to) {
      filtered = filtered.filter(invoice => invoice.issue_date <= filters.date_to)
    }

    setFilteredInvoices(filtered)
  }

  // Efecto para aplicar filtros
  useEffect(() => {
    applyFilters()
  }, [invoices, filters])

  // Manejar cambios en filtros
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      client_id: '',
      date_from: '',
      date_to: ''
    })
  }

  // Manejar ver factura
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
    setShowViewModal(true)
  }

  // Manejar editar factura
  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
    setShowEditModal(true)
    // Pre-llenar los valores del formulario
    setSubtotal(invoice.net_amount || 0)
    setIvaPercentage(invoice.tax_amount ? (invoice.tax_amount / invoice.net_amount) * 100 : 21)
    setTotal(invoice.total_amount || 0)
  }

  // Manejar actualización de factura
  const handleUpdateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedInvoice || !company?.id) {
      toast.error('Error: No se pudo obtener la información de la factura')
      return
    }

    setIsUpdating(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      // Extraer datos del formulario
      const clientId = formData.get('client_id') as string
      const issueDate = formData.get('issue_date') as string
      const dueDate = formData.get('due_date') as string
      const description = formData.get('description') as string
      const invoiceNumber = formData.get('invoice_number') as string
      
      // Validaciones
      if (!clientId) {
        toast.error('Por favor selecciona un cliente')
        setIsUpdating(false)
        return
      }
      
      if (!issueDate) {
        toast.error('Por favor selecciona una fecha de factura')
        setIsUpdating(false)
        return
      }
      
      if (!dueDate) {
        toast.error('Por favor selecciona una fecha de vencimiento')
        setIsUpdating(false)
        return
      }
      
      if (subtotal <= 0) {
        toast.error('El subtotal debe ser mayor a 0')
        setIsUpdating(false)
        return
      }

      const ivaAmount = subtotal * (ivaPercentage / 100)
      const netAmount = subtotal

      const updateData = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        total_amount: total,
        tax_amount: ivaAmount,
        net_amount: netAmount,
        notes: description
      }

      console.log('Updating invoice with data:', updateData)

      // Actualizar en Supabase
      const { data, error } = await supabaseAdminTable('invoices')
        .update(updateData)
        .eq('id', selectedInvoice.id)
        .select()

      if (error) {
        console.error('Error updating invoice:', error)
        toast.error(`Error al actualizar la factura: ${error.message}`)
        setIsUpdating(false)
        return
      }

      console.log('Invoice updated successfully:', data)
      toast.success('Factura actualizada exitosamente')
      
      // Cerrar modal y resetear
      setShowEditModal(false)
      setSelectedInvoice(null)
      setSubtotal(0)
      setIvaPercentage(21)
      setTotal(0)
      
      // Recargar facturas
      fetchInvoices()
      
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Error inesperado al actualizar la factura')
      setIsUpdating(false)
    }
  }

  // Manejar eliminar factura
  const handleDeleteInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
    setShowDeleteModal(true)
  }

  // Confirmar eliminación
  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return

    setIsUpdating(true)
    try {
      const { error } = await supabaseAdminTable('invoices')
        .delete()
        .eq('id', selectedInvoice.id)

      if (error) {
        console.error('Error deleting invoice:', error)
        toast.error(`Error al eliminar la factura: ${error.message}`)
        return
      }

      toast.success('Factura eliminada exitosamente')
      setShowDeleteModal(false)
      setSelectedInvoice(null)
      fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Error inesperado al eliminar la factura')
    } finally {
      setIsUpdating(false)
    }
  }

  // Obtener color del badge según estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obtener texto del estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador'
      case 'sent':
        return 'Enviada'
      case 'paid':
        return 'Pagada'
      case 'overdue':
        return 'Vencida'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Imprimir factura
  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const invoiceContent = generateInvoiceHTML(invoice)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .client-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    // Agregar listener para cerrar la ventana después de imprimir o cancelar
    printWindow.addEventListener('afterprint', () => {
      printWindow.close()
    })
    
    // Fallback: cerrar la ventana después de 5 segundos si no se imprime
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close()
      }
    }, 5000)
    
    printWindow.print()
  }

  // Generar PDF de factura
  const handleGeneratePDF = async (invoice: any) => {
    try {
      // Crear un elemento temporal visible para el contenido
      const tempDiv = document.createElement('div')
      tempDiv.id = 'pdf-content'
      tempDiv.style.position = 'fixed'
      tempDiv.style.top = '50%'
      tempDiv.style.left = '50%'
      tempDiv.style.transform = 'translate(-50%, -50%)'
      tempDiv.style.width = '1000px' // Ancho mayor para A4 horizontal
      tempDiv.style.height = '650px' // Alto ajustado para A4 horizontal
      tempDiv.style.padding = '15px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '12px' // Fuente más legible
      tempDiv.style.lineHeight = '1.4' // Line-height más legible
      tempDiv.style.color = '#000000'
      tempDiv.style.backgroundColor = '#ffffff'
      tempDiv.style.zIndex = '9999'
      tempDiv.style.overflow = 'visible'
      tempDiv.style.boxSizing = 'border-box'
      tempDiv.style.border = '2px solid #333'
      tempDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
      tempDiv.style.display = 'block'
      tempDiv.style.visibility = 'visible'
      
      // Crear el contenido HTML
      const invoiceContent = generateInvoiceHTML(invoice)
      
      tempDiv.innerHTML = invoiceContent
      
      document.body.appendChild(tempDiv)

      // Esperar a que se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Usar html2pdf para generar el PDF
      const { default: html2pdf } = await import('html2pdf.js')
      
      const opt = {
        margin: [0.2, 0.2, 0.2, 0.2] as [number, number, number, number], // Márgenes muy pequeños
        filename: `factura_${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 }, // Mayor calidad de imagen
        html2canvas: { 
          scale: 2, // Escala alta para mejor resolución
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true,
          width: tempDiv.offsetWidth,
          height: tempDiv.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: tempDiv.offsetWidth,
          windowHeight: tempDiv.offsetHeight,
          dpi: 300, // DPI alto para mejor calidad
          letterRendering: true // Mejor renderizado de texto
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'landscape' as const
        }
      }

      console.log('Generating PDF for invoice:', invoice.invoice_number)
      console.log('Element dimensions:', {
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        content: tempDiv.innerHTML.length
      })

      await html2pdf().set(opt).from(tempDiv).save()
      
      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv)
      
      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
      
      // Limpiar en caso de error
      const tempDiv = document.getElementById('pdf-content')
      if (tempDiv) {
        document.body.removeChild(tempDiv)
      }
    }
  }

  // Generar HTML de la factura
  const generateInvoiceHTML = (invoice: any) => {
    const ivaAmount = invoice.tax_amount || 0
    const netAmount = invoice.net_amount || 0
    const totalAmount = invoice.total_amount || 0
    const ivaPercentage = netAmount > 0 ? ((ivaAmount / netAmount) * 100).toFixed(0) : '0'

    return `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="font-size: 26px; margin: 0; font-weight: bold; color: #333; text-rendering: optimizeLegibility;">FACTURA</h1>
        <h2 style="font-size: 18px; margin: 8px 0; color: #666; text-rendering: optimizeLegibility;">${company?.name || 'Empresa'}</h2>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px; background: #f9f9f9; border-radius: 5px;">
        <div style="flex: 1;">
          <strong>Número de Factura:</strong> ${invoice.invoice_number}<br>
          <strong>Fecha:</strong> ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}<br>
          <strong>Vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-ES')}
        </div>
        <div style="flex: 1;">
          <strong>Estado:</strong> ${getStatusText(invoice.status)}
        </div>
      </div>
      
      <div style="margin-bottom: 20px; padding: 12px; background: #f0f8ff; border-radius: 5px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">Cliente:</h3>
        <p style="margin: 0;">
          ${invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Cliente no encontrado'}
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; background-color: #333; color: white; font-weight: bold; text-rendering: optimizeLegibility;">Descripción</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; background-color: #333; color: white; font-weight: bold; text-rendering: optimizeLegibility;">Cantidad</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; background-color: #333; color: white; font-weight: bold; text-rendering: optimizeLegibility;">Precio Unitario</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; background-color: #333; color: white; font-weight: bold; text-rendering: optimizeLegibility;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; text-rendering: optimizeLegibility;">${invoice.notes || 'Servicios de reparación'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; text-rendering: optimizeLegibility;">1</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; text-rendering: optimizeLegibility;">€${netAmount.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; text-rendering: optimizeLegibility;">€${netAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="text-align: right; margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
        <p style="margin: 6px 0; font-size: 13px; text-rendering: optimizeLegibility;">Subtotal: €${netAmount.toFixed(2)}</p>
        <p style="margin: 6px 0; font-size: 13px; text-rendering: optimizeLegibility;">IVA (${ivaPercentage}%): €${ivaAmount.toFixed(2)}</p>
        <p style="margin: 6px 0; font-size: 18px; font-weight: bold; color: #333; border-top: 2px solid #333; padding-top: 8px; margin-top: 12px; text-rendering: optimizeLegibility;">Total: €${totalAmount.toFixed(2)}</p>
      </div>
    `
  }

  // Resetear valores cuando se cierre el modal
  const handleCloseModal = () => {
    setShowCreateModal(false)
    setAutoGenerateNumber(true)
    setSubtotal(0)
    setIvaPercentage(21)
    setTotal(0)
    setIsSubmitting(false)
  }

  // Generar número de factura automático
  const generateInvoiceNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}${day}-${random}`
  }

  // Manejar creación de factura
  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    console.log('=== INICIO CREACIÓN FACTURA ===')
    console.log('Company ID:', company?.id)
    
    if (!company?.id) {
      console.error('No company ID available')
      toast.error('Error: No se pudo obtener la información de la empresa')
      return
    }

    setIsSubmitting(true)
    console.log('isSubmitting set to true')
    
    try {
      const formData = new FormData(e.currentTarget)
      console.log('FormData created')
      
      // Extraer datos del formulario
      const clientId = formData.get('client_id') as string
      const issueDate = formData.get('issue_date') as string
      const dueDate = formData.get('due_date') as string
      const description = formData.get('description') as string
      const invoiceNumber = autoGenerateNumber ? generateInvoiceNumber() : (formData.get('invoice_number') as string)
      
      console.log('Form data extracted:', {
        clientId,
        issueDate,
        dueDate,
        description,
        invoiceNumber,
        autoGenerateNumber
      })
      
      // Validaciones
      if (!clientId) {
        console.log('Validation failed: No client selected')
        toast.error('Por favor selecciona un cliente')
        setIsSubmitting(false)
        return
      }
      
      if (!issueDate) {
        console.log('Validation failed: No issue date')
        toast.error('Por favor selecciona una fecha de factura')
        setIsSubmitting(false)
        return
      }
      
      if (!dueDate) {
        console.log('Validation failed: No due date')
        toast.error('Por favor selecciona una fecha de vencimiento')
        setIsSubmitting(false)
        return
      }
      
      if (subtotal <= 0) {
        console.log('Validation failed: Invalid subtotal')
        toast.error('El subtotal debe ser mayor a 0')
        setIsSubmitting(false)
        return
      }

      const ivaAmount = subtotal * (ivaPercentage / 100)
      const netAmount = subtotal

      const invoiceData = {
        company_id: company.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        total_amount: total,
        tax_amount: ivaAmount,
        net_amount: netAmount,
        notes: description,
        status: 'draft'
      }

      console.log('=== DATOS PARA INSERTAR ===')
      console.log('Invoice data:', invoiceData)
      console.log('Calculated values:', {
        subtotal,
        ivaPercentage,
        ivaAmount,
        total,
        netAmount
      })

      console.log('=== INTENTANDO INSERTAR EN SUPABASE ===')
      
      // Insertar en Supabase
      const { data, error } = await supabaseAdminTable('invoices')
        .insert(invoiceData)
        .select()

      console.log('=== RESPUESTA DE SUPABASE ===')
      console.log('Data:', data)
      console.log('Error:', error)

      if (error) {
        console.error('Error creating invoice:', error)
        toast.error(`Error al crear la factura: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      console.log('=== FACTURA CREADA EXITOSAMENTE ===')
      console.log('Invoice created successfully:', data)
      toast.success('Factura creada exitosamente')
      
      // Cerrar modal y resetear formulario
      handleCloseModal()
      
      // Resetear el formulario
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      
      // Recargar facturas
      fetchInvoices()
      
    } catch (error) {
      console.error('=== ERROR EN CATCH ===')
      console.error('Error creating invoice:', error)
      toast.error('Error inesperado al crear la factura')
      setIsSubmitting(false)
    }
  }
  return (
    <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
              <p className="text-gray-600">Gestiona las facturas de tu empresa</p>
            </div>
            <Button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Filtros</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div>
                  <label className="form-label">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Número, cliente..."
                      className="form-input pl-10"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-input"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="paid">Pagada</option>
                    <option value="overdue">Vencida</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Cliente</label>
                  <select 
                    className="form-input"
                    value={filters.client_id}
                    onChange={(e) => handleFilterChange('client_id', e.target.value)}
                  >
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Desde</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Hasta</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <Button 
                    variant="secondary" 
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Limpiar
                  </Button>
                  <Button variant="secondary">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                Lista de Facturas ({filteredInvoices.length} de {invoices.length})
              </h2>
            </CardHeader>
            <CardBody>
              {loadingInvoices ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-2 text-gray-500">Cargando facturas...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {invoices.length === 0 ? 'No hay facturas registradas' : 'No se encontraron facturas con los filtros aplicados'}
                </div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Vencimiento</th>
                      <th>Importe</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="font-medium">{invoice.invoice_number}</td>
                        <td>
                          {invoice.client ? 
                            `${invoice.client.first_name} ${invoice.client.last_name}` : 
                            'Cliente no encontrado'
                          }
                        </td>
                        <td>{new Date(invoice.issue_date).toLocaleDateString('es-ES')}</td>
                        <td>{new Date(invoice.due_date).toLocaleDateString('es-ES')}</td>
                        <td>€{invoice.total_amount.toFixed(2)}</td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                              title="Ver factura"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              title="Editar factura"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePrintInvoice(invoice)}
                              title="Imprimir factura"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleGeneratePDF(invoice)}
                              title="Generar PDF"
                              className="text-green-600 hover:text-green-700"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice)}
                              title="Eliminar factura"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          {/* Create Invoice Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            title="Nueva Factura"
          >
            <form className="space-y-4" onSubmit={handleCreateInvoice}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Cliente *</label>
                  <select className="form-input" name="client_id" required>
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha de Factura *</label>
                  <input type="date" className="form-input" name="issue_date" required />
                </div>
                <div>
                  <label className="form-label">Número de Factura</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoGenerate"
                        checked={autoGenerateNumber}
                        onChange={(e) => setAutoGenerateNumber(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="autoGenerate" className="text-sm text-gray-600">
                        Auto-generar número
                      </label>
                    </div>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="invoice_number"
                      placeholder={autoGenerateNumber ? "Se generará automáticamente" : "Ingresa el número de factura"}
                      disabled={autoGenerateNumber}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Fecha de Vencimiento *</label>
                  <input type="date" className="form-input" name="due_date" required />
                </div>
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-input" 
                  name="description"
                  rows={3}
                  placeholder="Descripción de los servicios..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Subtotal *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="0.00" 
                    value={subtotal || ''}
                    onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="form-label">IVA (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="21" 
                    value={ivaPercentage || ''}
                    onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="form-label">Total</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input font-semibold bg-gray-50" 
                    placeholder="0.00" 
                    value={total.toFixed(2)}
                    disabled 
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Subtotal: €{subtotal.toFixed(2)} + IVA: €{(subtotal * (ivaPercentage / 100)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Factura'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* View Invoice Modal */}
          <Modal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            title="Detalles de la Factura"
            size="lg"
          >
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Header con número y estado */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedInvoice.invoice_number}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedInvoice.status)}`}>
                          {getStatusText(selectedInvoice.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de la factura */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Información de la Factura</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de Emisión</p>
                          <p className="font-medium text-gray-900">{new Date(selectedInvoice.issue_date).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                          <p className="font-medium text-gray-900">{new Date(selectedInvoice.due_date).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Cliente</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium text-gray-900">
                            {selectedInvoice.client ? 
                              `${selectedInvoice.client.first_name} ${selectedInvoice.client.last_name}` : 
                              'Cliente no encontrado'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles financieros */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Detalles Financieros</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="font-medium text-gray-900">€{selectedInvoice.net_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IVA</p>
                      <p className="font-medium text-gray-900">€{selectedInvoice.tax_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-semibold text-lg text-gray-900">€{selectedInvoice.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedInvoice.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Descripción</h3>
                    <p className="text-gray-900">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Creada:</span> {new Date(selectedInvoice.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Actualizada:</span> {new Date(selectedInvoice.updated_at).toLocaleDateString('es-ES')}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                    className="flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleGeneratePDF(selectedInvoice)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Generar PDF</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditInvoice(selectedInvoice)
                    }}
                  >
                    Editar Factura
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Edit Invoice Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedInvoice(null)
              setSubtotal(0)
              setIvaPercentage(21)
              setTotal(0)
            }}
            title="Editar Factura"
          >
            {selectedInvoice && (
              <form className="space-y-4" onSubmit={handleUpdateInvoice}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Cliente *</label>
                    <select className="form-input" name="client_id" required defaultValue={selectedInvoice.client_id}>
                      <option value="">Seleccionar cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Fecha de Factura *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      name="issue_date" 
                      required 
                      defaultValue={selectedInvoice.issue_date}
                    />
                  </div>
                  <div>
                    <label className="form-label">Número de Factura *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="invoice_number"
                      required
                      defaultValue={selectedInvoice.invoice_number}
                    />
                  </div>
                  <div>
                    <label className="form-label">Fecha de Vencimiento *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      name="due_date" 
                      required 
                      defaultValue={selectedInvoice.due_date}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Descripción</label>
                  <textarea 
                    className="form-input" 
                    name="description"
                    rows={3}
                    placeholder="Descripción de los servicios..."
                    defaultValue={selectedInvoice.notes || ''}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Subtotal *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="0.00" 
                      value={subtotal || ''}
                      onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label">IVA (%)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="21" 
                      value={ivaPercentage || ''}
                      onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Total</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input font-semibold bg-gray-50" 
                      placeholder="0.00" 
                      value={total.toFixed(2)}
                      disabled 
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Subtotal: €{subtotal.toFixed(2)} + IVA: €{(subtotal * (ivaPercentage / 100)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedInvoice(null)
                      setSubtotal(0)
                      setIvaPercentage(21)
                      setTotal(0)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Actualizando...' : 'Actualizar Factura'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Delete Invoice Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Eliminar Factura"
          >
            {selectedInvoice && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ¿Estás seguro de que quieres eliminar la factura <strong>{selectedInvoice.invoice_number}</strong>?
                </p>
                <p className="text-sm text-red-600">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmDeleteInvoice}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
  )
}
