import { NextRequest, NextResponse } from 'next/server';

// Simple mock API endpoint to handle file uploads without S3
export async function PUT(request: NextRequest) {
  try {
    // Log detalles de la solicitud
    console.log("[MOCK UPLOAD] Received file upload request");
    
    // Obtener el objectKey de la URL
    const url = new URL(request.url);
    const objectKey = url.searchParams.get('key') || 'unknown-file';
    
    const contentType = request.headers.get('Content-Type');
    const contentLength = request.headers.get('Content-Length');
    
    console.log(`[MOCK UPLOAD] Object Key: ${objectKey}`);
    console.log(`[MOCK UPLOAD] Content-Type: ${contentType}`);
    console.log(`[MOCK UPLOAD] Content-Length: ${contentLength}`);
    
    // Determinar el tipo de archivo por la extensión
    const fileType = objectKey.includes('video') ? 'video' : 'image';
    console.log(`[MOCK UPLOAD] File Type: ${fileType}`);
    
    // Intentar leer una parte del cuerpo para mostrar el formato
    // Esto es solo para diagnóstico, limitamos la cantidad leída para archivos grandes
    try {
      const bodyText = await request.text();
      const previewSize = Math.min(bodyText.length, 200);
      console.log(`[MOCK UPLOAD] Body preview (primeros ${previewSize} bytes):`);
      console.log(bodyText.substring(0, previewSize) + (bodyText.length > previewSize ? '...' : ''));
    } catch (readError) {
      console.log(`[MOCK UPLOAD] No se pudo leer el cuerpo: ${readError}`);
    }
    
    // Simular un procesamiento de archivo exitoso
    console.log('[MOCK UPLOAD] Simulando procesamiento exitoso...');
    
    // Simular un pequeño retraso para hacer el proceso más realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Construir una URL simulada para el archivo
    // Esto simula una URL de S3 para que el frontend pueda mostrar algo
    const mockS3Url = `https://mock-s3-bucket.s3.amazonaws.com/${objectKey}`;
    console.log(`[MOCK UPLOAD] Mock S3 URL: ${mockS3Url}`);
    
    // Return a successful response with the mock S3 URL
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'ETag': `"${Date.now().toString(16)}"`,
        'Location': mockS3Url
      }
    });
  } catch (error) {
    console.error('[MOCK UPLOAD] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length'
    }
  });
} 