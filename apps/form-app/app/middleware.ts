import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Obtener la ruta de la solicitud
  const pathname = request.nextUrl.pathname
  
  // Log para todas las solicitudes a la API
  if (pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE] ${request.method} - ${pathname}`)
    
    // Para solicitudes PUT (cargas de archivos), registrar más detalles
    if (request.method === 'PUT') {
      console.log(`[MIDDLEWARE] Content-Type: ${request.headers.get('Content-Type')}`)
      console.log(`[MIDDLEWARE] Content-Length: ${request.headers.get('Content-Length')}`)
    }
  }
  
  // Continuar con la solicitud normal
  return NextResponse.next()
}

// Configurar las rutas en las que se ejecutará el middleware
export const config = {
  matcher: [
    '/api/:path*',
  ],
} 