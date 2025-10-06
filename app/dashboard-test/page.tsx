'use client'

import React from 'react'

export default function DashboardTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Dashboard Test - Sin AuthContext
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
          <p className="text-gray-600 mb-2">
            Este es un dashboard de prueba que se carga SIN usar AuthContext.
          </p>
          <p className="text-gray-600 mb-4">
            Si puedes ver esta página, significa que el problema del dashboard principal
            está relacionado con el estado de autenticación o algún componente dependiente.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Estado Esperado</h3>
            <ul className="list-disc pl-6 text-blue-800">
              <li>Dashboard carga sin login</li>
              <li>Sin dependencias de AuthContext</li>
              <li>Sin componentes de módulos avanzados</li>
              <li>Interfaz básica funcional</li>
            </ul>
          </div>
          
          <div className="mt-6 text-center">
            <a 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Volver al Dashboard Principal
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

