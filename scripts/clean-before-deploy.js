const fs = require('fs');
const path = require('path');

/**
 * Script para limpiar archivos grandes antes del deploy en Cloudflare Pages
 * Elimina archivos de cache que exceden los 25 MiB
 */

const dirsToClean = [
  '.next/cache',
  'node_modules/.cache',
  '.cache',
];

const cleanDirectory = (dir) => {
  const fullPath = path.join(process.cwd(), dir);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Limpiando: ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✓ ${dir} eliminado exitosamente`);
    } catch (error) {
      console.error(`✗ Error al eliminar ${dir}:`, error.message);
    }
  } else {
    console.log(`⊗ ${dir} no existe, omitiendo...`);
  }
};

console.log('🧹 Iniciando limpieza pre-deploy para Cloudflare Pages...\n');

dirsToClean.forEach(cleanDirectory);

console.log('\n✅ Limpieza completada. El proyecto está listo para deploy.');

