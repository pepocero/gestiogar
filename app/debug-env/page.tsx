'use client'

export default function DebugEnvPage() {
  // En build time, estas variables se reemplazan con sus valores
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug: Variables de Entorno</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">NEXT_PUBLIC_SUPABASE_URL</h2>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all">
              {supabaseUrl || '❌ UNDEFINED'}
            </p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all">
              {supabaseKey ? `${supabaseKey.substring(0, 50)}... (${supabaseKey.length} caracteres)` : '❌ UNDEFINED'}
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">¿Cómo interpretar?</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Si ves las URLs/keys completas = Variables configuradas correctamente</li>
              <li>❌ Si dice "UNDEFINED" = Variables NO se aplicaron en el build</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <p className="text-sm">
              <strong>Nota:</strong> Con <code className="bg-white px-1 rounded">output: 'export'</code>, 
              las variables se reemplazan en <strong>build time</strong>, no en runtime.
              Si ves UNDEFINED, necesitas hacer un nuevo deployment en Cloudflare.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

