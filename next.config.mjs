/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Configuración para resolver problemas con fs y path
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Optimización de HMR para desarrollo
    if (dev) {
      // Reducir la frecuencia de compilación
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,           // Desactivar polling
        aggregateTimeout: 300, // Esperar antes de recompilar
        ignored: /node_modules/ // Ignorar node_modules
      };

      // Optimizar resolución de módulos
      config.resolve.preferRelative = true;
    }

    return config;
  },
  // Reducir la verbosidad en la consola
  onDemandEntries: {
    // Tiempo en ms que la página permanece en la memoria
    maxInactiveAge: 60 * 60 * 1000,
    // Número de páginas que mantener en memoria
    pagesBufferLength: 2,
  },
  // Deshabilitar estricto para reducir re-renders
  reactStrictMode: false,
}

export default nextConfig
