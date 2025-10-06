import { ModuleManager } from './moduleManager'

/**
 * Script para inicializar el módulo de demostración de inventario-herramientas
 * Esto simula la carga de un módulo desde archivos reales
 */
export async function initializeDemoModule() {
  try {
    console.log('🔧 Inicializando módulo demo: inventario-herramientas')
    
    // Manifest del módulo de inventario-herramientas
    const demoManifest = {
      name: "Inventario de Herramientas Avanzado",
      slug: "inventario-herramientas",
      version: "2.0.0",
      description: "Sistema completo de gestión de herramientas con funcionalidades avanzadas",
      author: "Gestiogar Team",
      icon: "Wrench",
      category: "inventario" as const,
      dependencies: [],
      permissions: [
        "read_herramientas",
        "write_herramientas", 
        "delete_herramientas",
        "manage_maintenance"
      ],
      routes: [
        {
          path: "/inventario/herramientas",
          component: "HerramientasList",
          title: "Listado de Herramientas",
          protected: true
        },
        {
          path: "/inventario/herramientas/nueva",
          component: "HerramientasForm", 
          title: "Nueva Herramienta",
          protected: true
        },
        {
          path: "/inventario/mantenimientos",
          component: "MantenimientosDashboard",
          title: "Mantenimientos",
          protected: true
        }
      ],
      hooks: [
        "sidebar_menu",
        "dashboard_widgets", 
        "after_create_herramienta",
        "before_delete_herramienta",
        "send_notification"
      ],
      database: {
        create_tables: true,
        tables: [
          "herramientas",
          "mantenimientos",
          "marcas",
          "categorias"
        ]
      },
      fields: [
        {
          name: "nombre",
          label: "Nombre de la herramienta",
          type: "text" as const,
          required: true,
          validation: "required|min:2|max:50",
          description: "Nombre específico de la herramienta"
        },
        {
          name: "marca",
          label: "Marca",
          type: "text" as const,
          required: true,
          validation: "required|max:30",
          description: "Marca o fabricante"
        },
        {
          name: "estado",
          label: "Estado",
          type: "select" as const,
          required: true,
          description: "Estado actual",
          options: [
            {"value": "excelente", "label": "Excelente"},
            {"value": "bueno", "label": "Bueno"},
            {"value": "regular", "label": "Regular"},
            {"value": "reparar", "label": "Necesita reparación"},
            {"value": "no_funciona", "label": "No funciona"}
          ],
          validation: "required|in:excelente,bueno,regular,reparar,no_funciona"
        }
      ],
      displayName: "Herramientas Avanzadas",
      displayDescription: "Gestión completa de inventario de herramientas"
    }

    // Registrar el módulo
    await ModuleManager.registerModule(demoManifest)
    
    console.log('✅ Módulo demo inicializado correctamente')
    
  } catch (error) {
    console.error('❌ Error inicializando módulo demo:', error)
  }
}

// Auto-inicializar cuando se importa este módulo
// initializeDemoModule() // Commented out to avoid auto-initialization
