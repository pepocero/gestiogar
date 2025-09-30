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
}

module.exports = nextConfig
