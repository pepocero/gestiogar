'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useModules } from '@/contexts/ModulesContext'

export default function DebugModulesPage() {
  const { company, user } = useAuth()
  const { modules, loading } = useModules()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<any>({})

  const runTests = async () => {
    const results: any = {}
    
    try {
      // Test 1: Verificar si las tablas existen
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['modules', 'module_data'])
      
      results.tablesExist = {
        success: !tablesError,
        data: tables,
        error: tablesError
      }

      // Test 2: Intentar consultar módulos directamente
      const { data: modulesDirect, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('company_id', company?.id)
      
      results.modulesDirect = {
        success: !modulesError,
        data: modulesDirect,
        error: modulesError
      }

      // Test 3: Verificar políticas RLS
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'modules')
      
      results.rlsPolicies = {
        success: !policiesError,
        data: policies,
        error: policiesError
      }

      // Test 4: Verificar función user_company_id
      const { data: functionTest, error: functionError } = await supabase
        .rpc('user_company_id')
      
      results.userCompanyIdFunction = {
        success: !functionError,
        data: functionTest,
        error: functionError
      }

    } catch (error) {
      results.generalError = error
    }

    setTestResults(results)
  }

  useEffect(() => {
    setDebugInfo({
      company: company,
      user: user,
      modules: modules,
      loading: loading
    })
  }, [company, user, modules, loading])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Debug Módulos</h1>
        <Button onClick={runTests}>Ejecutar Tests</Button>
      </div>

      {/* Información del contexto */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Información del Contexto</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Card>

      {/* Resultados de tests */}
      {Object.keys(testResults).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Resultados de Tests</h2>
          <div className="space-y-4">
            {Object.entries(testResults).map(([key, result]: [string, any]) => (
              <div key={key} className="border rounded p-4">
                <h3 className="font-medium text-gray-900">{key}</h3>
                <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅ Éxito' : '❌ Error'}
                </div>
                {result.error && (
                  <div className="text-red-600 text-sm mt-2">
                    Error: {JSON.stringify(result.error, null, 2)}
                  </div>
                )}
                {result.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Botón para verificar tablas de módulos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Verificar Tablas de Módulos</h2>
        <Button 
          onClick={async () => {
            try {
              // Verificar si las tablas existen
              const response = await fetch('/api/create-modules-tables', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              const result = await response.json()
              
              if (result.success) {
                alert('✅ Las tablas de módulos ya existen')
              } else {
                alert('❌ ' + result.error + '\n\nInstrucciones:\n' + result.instructions)
              }
            } catch (error) {
              alert('Error: ' + error)
            }
          }}
        >
          Verificar Tablas de Módulos
        </Button>
      </Card>

      {/* Información sobre el problema */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Diagnóstico del Problema</h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">Problema Identificado:</h3>
            <p className="text-blue-800 text-sm mt-2">
              Los módulos instalados no aparecen en el sidebar porque probablemente las tablas <code>modules</code> y <code>module_data</code> no existen en la base de datos.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">Solución:</h3>
            <ol className="text-green-800 text-sm mt-2 list-decimal list-inside space-y-1">
              <li>Ejecutar el SQL de creación de tablas en Supabase Dashboard</li>
              <li>Verificar que las políticas RLS estén configuradas correctamente</li>
              <li>Reiniciar la aplicación para que cargue los módulos</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
