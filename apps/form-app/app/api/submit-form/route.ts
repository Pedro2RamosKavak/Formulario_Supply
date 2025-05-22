import { type NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Región de S3
const AWS_REGION = process.env.AWS_REGION || 'sa-east-1';

// Bucket para almacenar los archivos
const BUCKET = process.env.BUCKET || 'multimedia-form-pdr';

// Detectar si tenemos credenciales reales de AWS
const hasRealCredentials = !!(process.env.AWS_ACCESS_KEY_ID && 
                              process.env.AWS_ACCESS_KEY_ID !== 'AKIAXXXXXXXXXXXXXXXX' && 
                              process.env.AWS_SECRET_ACCESS_KEY && 
                              process.env.AWS_SECRET_ACCESS_KEY !== 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

console.log(`[S3-CONFIG] Modo: ${hasRealCredentials ? 'REAL S3' : 'SIMULACIÓN'}`);
console.log(`[S3-CONFIG] Region: ${AWS_REGION}, Bucket: ${BUCKET}`);
console.log(`[S3-CONFIG] Credentials: ${hasRealCredentials ? 'CONFIGURADAS' : 'NO CONFIGURADAS'}`);

// Function to send data to Zapier webhook using our internal API
async function sendToZapier(data: any, type: 'initial' | 'complete' = 'complete') {
  try {
    // Agregar el tipo de formulario para que nuestra API interna lo reconozca
    const payload = {
      ...data,
      formType: type === 'initial' ? 'initial' : undefined
    };
    
    // Obtener la URL de la API
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Asegurarnos de que estamos usando la URL correcta
    if (!apiUrl) {
      apiUrl = '/api';
    } else if (!apiUrl.endsWith('/api')) {
      apiUrl = `${apiUrl}/api`;
    }
    
    const zapierEndpoint = `${apiUrl}/zapier`;
    
    // Llamar a nuestra API interna para enviar a Zapier
    const response = await fetch(zapierEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      return true;
    } else {
      console.error(`Error desde API interna: ${response.status}`);
      return false;
    }
  } catch (error) {
    // Si falla el envío a Zapier, no afectamos la funcionalidad principal
    console.error('Error al enviar datos a Zapier:', error);
    return false;
  }
}

// Initialize S3 client - solo si tenemos credenciales reales
const s3 = hasRealCredentials ? new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null;

// Generate mock URL for testing when we don't have real AWS credentials
function generateMockUrl(objectKey: string): string {
  return `http://localhost:3000/api/upload-mock?key=${encodeURIComponent(objectKey)}`;
}

export async function POST(request: NextRequest) {
  console.log("[S3-INTEGRATION] Recibida solicitud en /api/submit-form");
  
  try {
    const data = await request.json();
    console.log("[S3-INTEGRATION] Data recibida:", { 
      type: Array.isArray(data.requiredFiles) ? 'URL request' : (data.id ? 'Data submission' : 'Unknown'),
      requiredFiles: data.requiredFiles,
      id: data.id 
    });
    
    // Etapa 1: Solicitud de presigned URLs
    if (Array.isArray(data.requiredFiles)) {
      console.log(`[S3-INTEGRATION] Procesando solicitud de URLs para ${data.requiredFiles.length} archivos`);
      
      // Generar un ID único para la inspección
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const inspectionId = `insp_${timestamp}_${randomId}`;
      console.log(`[S3-INTEGRATION] ID generado: ${inspectionId}`);
      
      // Generar presigned URLs para cada archivo requerido
      const uploadUrls: Record<string, string> = {};
      
      for (const key of data.requiredFiles) {
        const ext = key === 'video' ? 'mp4' : 'jpg';
        const objectKey = `inspections/${inspectionId}/${key}.${ext}`;
        
        try {
          let url: string;
          
          if (hasRealCredentials && s3) {
            // Generar presigned URL usando S3 real
            const command = new PutObjectCommand({
              Bucket: BUCKET,
              Key: objectKey,
              ContentType: key === 'video' ? 'video/mp4' : 'image/jpeg',
            });
            
            url = await getSignedUrl(s3, command, { expiresIn: 600 });
            console.log(`[S3-INTEGRATION] URL real generada para ${key}: ${url.substring(0, 60)}...`);
          } else {
            // Generar URL simulada para desarrollo
            url = generateMockUrl(objectKey);
            console.log(`[S3-INTEGRATION] URL simulada generada para ${key}: ${url}`);
          }
          
          uploadUrls[key] = url;
        } catch (error) {
          console.error(`[S3-INTEGRATION] Error al generar URL para ${key}:`, error);
          throw new Error(`No se pudo generar URL para ${key}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      return NextResponse.json({ 
        id: inspectionId, 
        uploadUrls,
        message: "URLs generadas exitosamente",
        mode: hasRealCredentials ? 'real' : 'simulation'
      });
    }

    // Etapa 2: Guardar los datos finales de la inspección
    if (data.id) {
      console.log(`[S3-INTEGRATION] Guardando datos finales de inspección: ${data.id}`);
      
      // Para depuración, muestra las URLs recibidas
      const receivedUrls = {
        crlvUrl: data.crlvUrl ? '✓' : '✗',
        safetyItemsUrl: data.safetyItemsUrl ? '✓' : '✗',
        windshieldDamagePhotoUrl: data.windshieldDamagePhotoUrl ? '✓' : '✗',
        lightsDamagePhotoUrl: data.lightsDamagePhotoUrl ? '✓' : '✗',
        tireDamagePhotoUrl: data.tireDamagePhotoUrl ? '✓' : '✗',
        videoUrl: data.videoUrl ? '✓' : '✗',
      };
      console.log("[S3-INTEGRATION] URLs recibidas:", receivedUrls);
      
      const formData = {
        inspectionId: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        licensePlate: data.licensePlate,
        mileage: data.mileage,
        modelYear: data.modelYear,
        hasChassisNumber: data.hasChassisNumber === 'sim',
        hasSecondKey: data.hasSecondKey === 'sim',
        conditions: data.conditions,
        safetyItems: data.safetyItems,
        hasAirConditioner: data.acWorking === 'sim',
        hasWindshieldDamage: data.hasWindshieldDamage === 'sim',
        hasLightsDamage: data.hasLightsDamage === 'sim',
        hasTiresDamage: data.hasTireDamage === 'sim',
        hasOriginalSoundSystem: data.isOriginalSoundSystem === 'sim',
        // URLs de archivos S3
        crlvFileUrl: data.crlvUrl,
        safetyItemsFileUrl: data.safetyItemsUrl,
        windshieldDamagePhotoUrl: data.windshieldDamagePhotoUrl,
        lightsDamagePhotoUrl: data.lightsDamagePhotoUrl,
        tireDamagePhotoUrl: data.tireDamagePhotoUrl,
        videoFileUrl: data.videoUrl,
        // Metadatos completos para permitir la revisión detallada
        rawFormData: data,
        submissionDate: new Date().toISOString(),
        mode: hasRealCredentials ? 'real' : 'simulation',
        status: "pending"
      };
      
      // Guardar los datos en S3 como un archivo JSON
      if (hasRealCredentials && s3) {
        try {
          console.log("[S3-INTEGRATION] Guardando datos en S3...");
          
          // Convertir el objeto a JSON y luego a un Buffer
          const formDataBuffer = Buffer.from(JSON.stringify(formData));
          
          // Crear el comando para subir el archivo a S3
          const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: `inspections/${data.id}/metadata.json`,
            Body: formDataBuffer,
            ContentType: 'application/json',
          });
          
          // Enviar el comando a S3
          await s3.send(command);
          console.log("[S3-INTEGRATION] Datos guardados exitosamente en S3");
        } catch (error) {
          console.error("[S3-INTEGRATION] Error al guardar datos en S3:", error);
          throw new Error(`Error al guardar datos en S3: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      } else {
        console.log("[S3-INTEGRATION] Modo simulación - no se guardan datos en S3");
      }
      
      // Enviar datos completos a Zapier
      await sendToZapier(formData, 'complete');
      
      console.log("[S3-INTEGRATION] Datos guardados exitosamente");
      return NextResponse.json({ 
        success: true, 
        message: "Inspeção registrada com sucesso",
        inspectionId: data.id,
        mode: hasRealCredentials ? 'real' : 'simulation'
      });
    }
    
    // Etapa 3: Envío de datos iniciales (primera pantalla)
    if (data.formType === 'initial' && !Array.isArray(data.requiredFiles) && !data.id) {
      console.log("[S3-INTEGRATION] Recibidos datos iniciales de usuario");
      
      // Datos iniciales ya vienen en el formato correcto, sin anidamiento
      const initialData = {
        email: data.email,
        name: data.name,
        phone: data.phone,
        licensePlate: data.licensePlate,
        mileage: data.mileage,
        modelYear: data.modelYear,
        submissionDate: new Date().toISOString(),
        formStep: 'initial',
        completionStatus: 'incomplete'
      };
      
      // Enviar datos iniciales a Zapier
      await sendToZapier(initialData, 'initial');
      
      return NextResponse.json({
        success: true,
        message: "Dados iniciais registrados"
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: "Requisição inválida" 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error("[S3-INTEGRATION] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro ao processar o formulário", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 