import { supabase } from './supabase'

export interface DashboardStats {
  activeJobs: number
  totalClients: number
  monthlyRevenue: number
  pendingEstimates: number
  totalTechnicians: number
  upcomingAppointments: number
}

export async function getDashboardStats(companyId: string): Promise<DashboardStats | null> {
  try {
    // Verificar que hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('No active session for dashboard stats')
      return null
    }
    if (!companyId) {
      console.warn('No companyId provided for dashboard stats')
      return null
    }

    // Obtener el mes actual para calculos mensuales
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Promise.all para ejecutar todas las consultas paralelamente
    const [
      jobsResult,
      clientsResult,
      revenueResult,
      estimatesResult,
      techniciansResult,
      appointmentsResult
    ] = await Promise.all([
      // Trabajos activos (status: 'pending', 'in_progress', 'scheduled')
      supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .in('status', ['pending', 'in_progress', 'scheduled']),

      // Total de clientes
      supabase
        .from('clients')
        .select('id', { count: 'exact' }),
        .eq('company_id', companyId),

      // Ingresos este mes (facturas pagadas)
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('paid_date', currentMonthStart.toISOString())
        .lt('paid_date', currentMonthEnd.toISOString()),

      // Presupuestos pendientes
      supabase
        .from('estimates')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'pending'),

      // Total técnicos activos
      supabase
        .from('technicians')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true),

      // Citas próximas (próximos 7 días)
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .lte('scheduled_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Manejar errores de cada consulta - continuar con valores por defecto si alguna falla
    if (jobsResult.error) {
      console.warn('Error fetching jobs:', jobsResult.error.message)
    }
    if (clientsResult.error) {
      console.warn('Error fetching clients:', clientsResult.error.message)
    }
    if (revenueResult.error) {
      console.warn('Error fetching revenue:', revenueResult.error.message)
    }
    if (estimatesResult.error) {
      console.warn('Error fetching estimates:', estimatesResult.error.message)
    }
    if (techniciansResult.error) {
      console.warn('Error fetching technicians:', techniciansResult.error.message)
    }
    if (appointmentsResult.error) {
      console.warn('Error fetching appointments:', appointmentsResult.error.message)
    }

    // Calcular ingresos mensuales
    const monthlyRevenue = revenueResult.data?.reduce((sum: number, invoice: any) => {
      return sum + (invoice.total_amount || 0)
    }, 0) || 0

    return {
      activeJobs: jobsResult.count || 0,
      totalClients: clientsResult.count || 0,
      monthlyRevenue,
      pendingEstimates: estimatesResult.count || 0,
      totalTechnicians: techniciansResult.count || 0,
      upcomingAppointments: appointmentsResult.count || 0
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return null
  }
}

export async function getRecentActivity(companyId: string): Promise<any[]> {
  try {
    // Verificar que hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('No active session for recent activity')
      return []
    }
    if (!companyId) {
      console.warn('No companyId provided for recent activity')
      return []
    }

    // Obtener actividad reciente: trabajos, facturas y estimaciones
    const [jobsResult, estimatesResult, invoicesResult] = await Promise.all([
      supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          created_at,
          client:clients(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('estimates')
        .select(`
          id,
          title,
          status,
          total_amount,
          created_at,
          client:clients(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          status,
          total_amount,
          created_at,
          client:clients(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    // Manejar errores silenciosamente - si alguna consulta falla, continuar con las demás
    if (jobsResult.error) {
      console.warn('Error fetching jobs for activity:', jobsResult.error.message)
    }
    if (estimatesResult.error) {
      console.warn('Error fetching estimates for activity:', estimatesResult.error.message)
    }
    if (invoicesResult.error) {
      console.warn('Error fetching invoices for activity:', invoicesResult.error.message)
    }

    // Combinar resultados y ordenar por fecha
    const activities = [
      ...(jobsResult.data || []).map((job: any) => ({
        id: job.id,
        type: 'job',
        title: job.title,
        status: job.status,
        amount: null,
        client: job.client ? `${job.client.first_name} ${job.client.last_name}` : 'Sin cliente',
        created_at: job.created_at
      })),
      ...(estimatesResult.data || []).map((estimate: any) => ({
        id: estimate.id,
        type: 'estimate',
        title: estimate.title,
        status: estimate.status,
        amount: estimate.total_amount,
        client: estimate.client ? `${estimate.client.first_name} ${estimate.client.last_name}` : 'Sin cliente',
        created_at: estimate.created_at
      })),
      ...(invoicesResult.data || []).map((invoice: any) => ({
        id: invoice.id,
        type: 'invoice',
        title: `Factura ${invoice.invoice_number}`,
        status: invoice.status,
        amount: invoice.total_amount,
        client: invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Sin cliente',
        created_at: invoice.created_at
      }))
    ]

    // Ordenar por fecha más reciente
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) // Mostrar solo los 5 más recientes

  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}
