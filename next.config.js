/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['liqxrhrwiasewfvasems.supabase.co', 'pbdsuhmwxqiwbpgyrhqt.supabase.co'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimizaciones para Cloudflare Pages
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
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
