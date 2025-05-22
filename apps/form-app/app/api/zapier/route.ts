import { type NextRequest, NextResponse } from "next/server";

// URL del webhook de Zapier
const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/10702199/275d6f8/";

export async function POST(request: NextRequest) {
  console.log("[ZAPIER-ENDPOINT] Recibida solicitud a API Zapier");
  
  try {
    // Recibir los datos
    const data = await request.json();
    console.log("[ZAPIER-ENDPOINT] Datos recibidos:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Determinar el tipo de datos (inicial o completo)
    const isInitial = !!data.formType && data.formType === 'initial';
    const type = isInitial ? 'initial' : 'complete';
    
    // Crear payload para Zapier
    const payload = {
      ...data,
      submission_type: type,
      step: type === 'initial' ? 'Initial Step' : 'Complete',
      submission_date: new Date().toISOString(),
      formatted_date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    // Convertir arrays a strings separados por comas
    if (Array.isArray(payload.conditions)) {
      payload.conditions = payload.conditions.join(', ');
    }
    
    if (Array.isArray(payload.safetyItems)) {
      payload.safetyItems = payload.safetyItems.join(', ');
    }
    
    console.log("[ZAPIER-ENDPOINT] Enviando a Zapier:", JSON.stringify(payload).substring(0, 200) + "...");
    
    // Asegurar que la URL de Zapier sea válida
    if (!ZAPIER_WEBHOOK_URL || !ZAPIER_WEBHOOK_URL.startsWith('https://hooks.zapier.com/')) {
      throw new Error('La URL del webhook de Zapier no es válida');
    }
    
    console.log(`[ZAPIER-ENDPOINT] URL del webhook: ${ZAPIER_WEBHOOK_URL}`);
    
    // Enviar a Zapier
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VehicleInspection/1.0',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error al enviar a Zapier: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("[ZAPIER-ENDPOINT] Respuesta de Zapier:", result);
    
    // Devolver respuesta
    return NextResponse.json({
      success: true,
      zapier_response: result
    });
    
  } catch (error: any) {
    console.error("[ZAPIER-ENDPOINT] Error:", error);
    return NextResponse.json(
      {
        success: false, 
        message: "Error al procesar la solicitud", 
        error: error.message
      },
      { status: 500 }
    );
  }
} 