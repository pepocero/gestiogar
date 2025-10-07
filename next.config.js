/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Requerido para export estático
    domains: ['liqxrhrwiasewfvasems.supabase.co', 'pbdsuhmwxqiwbpgyrhqt.supabase.co'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Configuración para Cloudflare Pages (exportación estática)
  output: 'export',
  compress: true,
  poweredByHeader: false,
  trailingSlash: true,
  // Reducir el tamaño de archivos de webpack
  webpack: (config, { isServer }) => {
    // Deshabilitar cache en producción para evitar archivos grandes
    if (process.env.NODE_ENV === 'production') {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
