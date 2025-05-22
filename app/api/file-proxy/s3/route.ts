import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy para servir archivos de S3 con firmados desde nuestro backend
 * Esto soluciona problemas de CORS y permisos de acceso con URLs S3
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener la URL del archivo de S3 desde los parámetros de consulta
    const url = request.nextUrl.searchParams.get("url");
    
    if (!url) {
      return NextResponse.json(
        { error: "Se requiere parámetro 'url'" },
        { status: 400 }
      );
    }

    // Extraer la URL base sin parámetros de consulta para S3
    let cleanUrl = url;
    if (url.includes('?')) {
      cleanUrl = url.split('?')[0];
    }

    console.log("Proxy S3: Obteniendo archivo desde", cleanUrl);

    // Hacer una petición para obtener el archivo
    // Usamos la URL completa con parámetros para la autenticación
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'VehicleInspection/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Error al obtener archivo: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Error al obtener archivo: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Obtener el tipo de contenido
    const contentType = response.headers.get('Content-Type') || inferContentType(cleanUrl);
    
    // Obtener los datos binarios
    const data = await response.arrayBuffer();
    
    // Crear una respuesta con los datos
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', data.byteLength.toString());
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    
    // Crear la respuesta
    return new NextResponse(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error en proxy S3:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

/**
 * Infiere el tipo de contenido basado en la extensión del archivo
 */
function inferContentType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'pdf': 'application/pdf',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// Configuración para aumentar el límite de tiempo de respuesta en Vercel
export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
}; 