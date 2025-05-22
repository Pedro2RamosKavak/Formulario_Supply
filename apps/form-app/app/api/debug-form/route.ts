import { type NextRequest, NextResponse } from "next/server"

/**
 * Endpoint para depuración de formulario - simula una respuesta exitosa
 */
export async function POST(request: NextRequest) {
  try {
    // Log para depuración
    console.log('[DEBUG-FORM] Recibida solicitud');
    console.log(`[DEBUG-FORM] URL: ${request.url}`);
    console.log(`[DEBUG-FORM] Método: ${request.method}`);
    console.log(`[DEBUG-FORM] Headers:`, Object.fromEntries(request.headers.entries()));
    
    // Intentar parsear el cuerpo de la solicitud
    const body = await request.json();
    
    // Extraer información sobre archivos para mostrar un log más limpio
    const filesInfo = Object.entries(body.fileReferences || {}).reduce((info, [key, fileName]) => {
      info[key] = fileName ? `✓ ${fileName}` : '✗ (no file)';
      return info;
    }, {} as Record<string, string>);
    
    // Registrar un resumen de los datos
    console.log('[DEBUG-FORM] Resumen de datos recibidos:');
    console.log(`  - Nombre: ${body.name || 'No proporcionado'}`);
    console.log(`  - Email: ${body.email || 'No proporcionado'}`);
    console.log(`  - Teléfono: ${body.phone || 'No proporcionado'}`);
    console.log(`  - Placa: ${body.licensePlate || 'No proporcionada'}`);
    console.log(`  - Archivos: ${Object.keys(filesInfo).length > 0 ? JSON.stringify(filesInfo) : 'Ninguno'}`);
    
    // Registro detallado (solo en desarrollo)
    console.log('[DEBUG-FORM] Datos completos recibidos:', JSON.stringify(body, null, 2));

    // Generar un ID único para la inspección simulada
    const inspectionId = `insp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[DEBUG-FORM] ID generado: ${inspectionId}`);

    // Simular procesamiento y responder con éxito
    console.log('[DEBUG-FORM] Simulando procesamiento exitoso...');
    
    // Simular un pequeño retraso para hacer el proceso más realista
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('[DEBUG-FORM] Procesamiento completado, enviando respuesta exitosa');
    
    return NextResponse.json({
      success: true,
      message: "Formulario recibido correctamente",
      id: inspectionId,
      data: body,
      mockMode: true
    });
  } catch (error) {
    console.error('[DEBUG-FORM] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        mockMode: true
      },
      { status: 500 }
    );
  }
} 