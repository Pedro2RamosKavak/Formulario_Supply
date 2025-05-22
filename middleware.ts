import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  // '/api/cloudinary-signature',
  // '/api/upload'
];

export function middleware(request: NextRequest) {
  // Bypass authentication for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Obtener la ruta actual
  const path = request.nextUrl.pathname;
  
  // Si es una ruta pública, permitir el acceso sin autenticación
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // For other routes, continue with normal flow
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 