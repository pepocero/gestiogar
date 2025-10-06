#!/usr/bin/env node

/**
 * Script de limpieza para desarrollo - Gestiogar
 * 
 * Este script ayuda a limpiar instancias múltiples de Supabase
 * y otros problemas comunes en desarrollo.
 * 
 * Uso: npm run cleanup
 */

const fs = require('fs')
const path = require('path')

console.log('🧹 Iniciando limpieza de desarrollo...')

// Función para limpiar archivos temporales
function cleanupTempFiles() {
  console.log('📁 Limpiando archivos temporales...')
  
  const tempDirs = [
    '.next',
    'node_modules/.cache',
    '.vercel',
    'dist',
    'build'
  ]
  
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`  🗑️ Eliminando ${dir}...`)
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
}

// Función para limpiar logs de desarrollo
function cleanupLogs() {
  console.log('📝 Limpiando logs de desarrollo...')
  
  const logFiles = [
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    '.eslintcache'
  ]
  
  logFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  🗑️ Eliminando ${file}...`)
      fs.unlinkSync(file)
    }
  })
}

// Función para verificar configuración de Supabase
function checkSupabaseConfig() {
  console.log('🔍 Verificando configuración de Supabase...')
  
  const supabaseFile = 'lib/supabase.ts'
  if (fs.existsSync(supabaseFile)) {
    const content = fs.readFileSync(supabaseFile, 'utf8')
    
    // Verificar que tenga el patrón singleton
    if (content.includes('__supabaseInitialized')) {
      console.log('  ✅ Patrón Singleton implementado')
    } else {
      console.log('  ⚠️ Patrón Singleton no encontrado')
    }
    
    // Verificar configuración de auth
    if (content.includes('persistSession: true')) {
      console.log('  ✅ Persistencia de sesión habilitada')
    } else {
      console.log('  ⚠️ Persistencia de sesión no configurada')
    }
  } else {
    console.log('  ❌ Archivo lib/supabase.ts no encontrado')
  }
}

// Función para verificar dependencias
function checkDependencies() {
  console.log('📦 Verificando dependencias...')
  
  const packageJson = 'package.json'
  if (fs.existsSync(packageJson)) {
    const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
    
    // Verificar versión de Supabase
    const supabaseVersion = content.dependencies?.['@supabase/supabase-js']
    if (supabaseVersion) {
      console.log(`  ✅ Supabase JS: ${supabaseVersion}`)
    } else {
      console.log('  ❌ Supabase JS no encontrado en dependencias')
    }
    
    // Verificar Next.js
    const nextVersion = content.dependencies?.['next']
    if (nextVersion) {
      console.log(`  ✅ Next.js: ${nextVersion}`)
    } else {
      console.log('  ❌ Next.js no encontrado en dependencias')
    }
  }
}

// Función para generar reporte de limpieza
function generateCleanupReport() {
  console.log('📊 Generando reporte de limpieza...')
  
  const report = {
    timestamp: new Date().toISOString(),
    cleanup: {
      tempFiles: 'Eliminados',
      logs: 'Eliminados',
      supabaseConfig: 'Verificado',
      dependencies: 'Verificadas'
    },
    recommendations: [
      'Reiniciar el servidor de desarrollo',
      'Limpiar caché del navegador',
      'Verificar que no haya múltiples instancias de Supabase',
      'Revisar logs de la consola del navegador'
    ]
  }
  
  fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2))
  console.log('  📄 Reporte guardado en cleanup-report.json')
}

// Función principal
function main() {
  try {
    cleanupTempFiles()
    cleanupLogs()
    checkSupabaseConfig()
    checkDependencies()
    generateCleanupReport()
    
    console.log('\n✅ Limpieza completada exitosamente!')
    console.log('\n📋 Próximos pasos:')
    console.log('  1. Ejecutar: npm run dev')
    console.log('  2. Abrir DevTools y verificar consola')
    console.log('  3. Buscar mensaje: "✅ Supabase inicializado correctamente"')
    console.log('  4. Verificar que NO aparezca: "Multiple GoTrueClient instances"')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main }
