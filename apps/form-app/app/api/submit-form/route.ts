import { type NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// Función para subir archivo a S3
async function uploadFileToS3(fileBuffer: Buffer, objectKey: string, contentType: string): Promise<string> {
  if (!hasRealCredentials || !s3) {
    console.log(`[S3-INTEGRATION] Modo simulación - no se sube ${objectKey}`);
    return `https://fake-s3-url.com/${objectKey}`;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3.send(command);
    const s3Url = `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${objectKey}`;
    console.log(`[S3-INTEGRATION] Archivo subido exitosamente: ${objectKey}`);
    return s3Url;
  } catch (error) {
    console.error(`[S3-INTEGRATION] Error al subir ${objectKey}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("[S3-INTEGRATION] Recibida solicitud en /api/submit-form");
  
  try {
    // Verificar si es una petición con FormData (archivos)
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Manejar subida de archivos
      console.log("[S3-INTEGRATION] Procesando FormData con archivos");
      
      const formData = await request.formData();
      
      // Generar ID único para la inspección
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const inspectionId = `insp_${timestamp}_${randomId}`;
      
      console.log(`[S3-INTEGRATION] ID generado: ${inspectionId}`);
      
      // Extraer datos del formulario
      const extractedData = {
        id: inspectionId,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        licensePlate: formData.get('licensePlate') as string,
        mileage: formData.get('mileage') as string,
        modelYear: formData.get('modelYear') as string,
        hasChassisNumber: formData.get('hasChassisNumber') as string,
        hasSecondKey: formData.get('hasSecondKey') as string,
        conditions: JSON.parse(formData.get('conditions') as string || '[]'),
        safetyItems: JSON.parse(formData.get('safetyItems') as string || '[]'),
        acWorking: formData.get('acWorking') as string,
        hasWindshieldDamage: formData.get('hasWindshieldDamage') as string,
        hasLightsDamage: formData.get('hasLightsDamage') as string,
        hasTireDamage: formData.get('hasTireDamage') as string,
        isOriginalSoundSystem: formData.get('isOriginalSoundSystem') as string,
      };
      
      // Procesar archivos y subirlos a S3
      const fileUrls: Record<string, string> = {};
      
      const fileFields = [
        { key: 'crlv', ext: 'jpg', contentType: 'image/jpeg' },
        { key: 'safetyItems', ext: 'jpg', contentType: 'image/jpeg' },
        { key: 'windshieldDamagePhoto', ext: 'jpg', contentType: 'image/jpeg' },
        { key: 'lightsDamagePhoto', ext: 'jpg', contentType: 'image/jpeg' },
        { key: 'tireDamagePhoto', ext: 'jpg', contentType: 'image/jpeg' },
        { key: 'video', ext: 'mp4', contentType: 'video/mp4' }
      ];
      
      for (const field of fileFields) {
        const file = formData.get(field.key) as File;
        if (file && file.size > 0) {
          console.log(`[S3-INTEGRATION] Procesando archivo ${field.key}: ${file.name} (${file.size} bytes)`);
          
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const objectKey = `inspections/${inspectionId}/${field.key}.${field.ext}`;
          
          try {
            const s3Url = await uploadFileToS3(buffer, objectKey, field.contentType);
            fileUrls[`${field.key}Url`] = s3Url;
            console.log(`[S3-INTEGRATION] URL generada para ${field.key}: ${s3Url.substring(0, 60)}...`);
          } catch (error) {
            console.error(`[S3-INTEGRATION] Error al subir ${field.key}:`, error);
            throw new Error(`Error al subir archivo ${field.key}`);
          }
        }
      }
      
      // Combinar datos del formulario con URLs de archivos
      const completeData = {
        ...extractedData,
        ...fileUrls
      };
      
      // Guardar metadatos en S3
      const metadataObject = {
        inspectionId: inspectionId,
        name: extractedData.name,
        email: extractedData.email,
        phone: extractedData.phone,
        licensePlate: extractedData.licensePlate,
        mileage: extractedData.mileage,
        modelYear: extractedData.modelYear,
        hasChassisNumber: extractedData.hasChassisNumber === 'sim',
        hasSecondKey: extractedData.hasSecondKey === 'sim',
        conditions: extractedData.conditions,
        safetyItems: extractedData.safetyItems,
        hasAirConditioner: extractedData.acWorking === 'sim',
        hasWindshieldDamage: extractedData.hasWindshieldDamage === 'sim',
        hasLightsDamage: extractedData.hasLightsDamage === 'sim',
        hasTiresDamage: extractedData.hasTireDamage === 'sim',
        hasOriginalSoundSystem: extractedData.isOriginalSoundSystem === 'sim',
        // URLs de archivos S3
        crlvFileUrl: fileUrls.crlvUrl,
        safetyItemsFileUrl: fileUrls.safetyItemsUrl,
        windshieldDamagePhotoUrl: fileUrls.windshieldDamagePhotoUrl,
        lightsDamagePhotoUrl: fileUrls.lightsDamagePhotoUrl,
        tireDamagePhotoUrl: fileUrls.tireDamagePhotoUrl,
        videoFileUrl: fileUrls.videoUrl,
        // Metadatos completos para permitir la revisión detallada
        rawFormData: completeData,
        submissionDate: new Date().toISOString(),
        mode: hasRealCredentials ? 'real' : 'simulation',
        status: "pending"
      };
      
      // Guardar los metadatos en S3 como un archivo JSON
      if (hasRealCredentials && s3) {
        try {
          console.log("[S3-INTEGRATION] Guardando metadatos en S3...");
          
          const metadataBuffer = Buffer.from(JSON.stringify(metadataObject));
          await uploadFileToS3(metadataBuffer, `inspections/${inspectionId}/metadata.json`, 'application/json');
          
          console.log("[S3-INTEGRATION] Metadatos guardados exitosamente en S3");
        } catch (error) {
          console.error("[S3-INTEGRATION] Error al guardar metadatos en S3:", error);
          throw new Error(`Error al guardar metadatos en S3: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      } else {
        console.log("[S3-INTEGRATION] Modo simulación - no se guardan metadatos en S3");
      }
      
      // Enviar datos completos a Zapier
      await sendToZapier(metadataObject, 'complete');
      
      console.log("[S3-INTEGRATION] Formulario procesado exitosamente");
      return NextResponse.json({ 
        success: true, 
        message: "Inspeção registrada com sucesso",
        inspectionId: inspectionId,
        mode: hasRealCredentials ? 'real' : 'simulation'
      });
    }
    
    // Manejar peticiones JSON (datos iniciales)
    const data = await request.json();
    console.log("[S3-INTEGRATION] Data recibida:", { 
      formType: data.formType 
    });
    
    // Envío de datos iniciales (primera pantalla)
    if (data.formType === 'initial') {
      console.log("[S3-INTEGRATION] Recibidos datos iniciales de usuario");
      
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