import ModulePageClient from './ModulePageClient'

// Generar rutas estáticas para módulos conocidos
// Esto es necesario para exportación estática de Next.js
export async function generateStaticParams() {
  // Lista de slugs de módulos conocidos que se generarán como páginas estáticas
  return [
    { slug: 'vehicles' },
    { slug: 'vehicle-management' },
    { slug: 'holidays-vacations' },
    { slug: 'default' },
  ]
}

// Configurar la página para que se genere estáticamente
export const dynamicParams = true // Permitir otros módulos dinámicos en runtime

export default function ModulePage() {
  return <ModulePageClient />
}
