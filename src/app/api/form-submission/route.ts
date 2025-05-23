import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Configuración de S3 con variables de entorno
const AWS_REGION = process.env.AWS_REGION || 'your-region';
const BUCKET = process.env.BUCKET || 'your-bucket-name';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_PLACEHOLDER';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY_PLACEHOLDER';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

console.log('[CONFIG] Inicializando cliente S3 con credenciales de entorno:');
console.log('[CONFIG] AWS_REGION:', AWS_REGION);
console.log('[CONFIG] BUCKET:', BUCKET);
console.log('[CONFIG] AWS_ACCESS_KEY_ID configurado:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('[CONFIG] AWS_SECRET_ACCESS_KEY configurado:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('[CONFIG] BACKEND_API_URL:', BACKEND_API_URL);

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

export async function POST(request: Request) {
  console.log('[DEBUG] Recibida solicitud de envío de formulario');
  
  try {
    // Obtener los datos del formulario
    const formData = await request.formData();
    console.log('[DEBUG] Campos del formulario:', [...formData.keys()]);
    
    // Generar un ID único para esta inspección
    const inspectionId = randomUUID();
    console.log(`[DEBUG] ID de inspección generado: ${inspectionId}`);
    
    // Objeto para almacenar las URLs de los archivos subidos
    const fileUrls: { [key: string]: string } = {};
    
    // Lista de tipos de archivos que esperamos
    const fileTypes = ['crlvFile', 'safetyItemsFile', 'windshieldDamagePhoto', 'lightsDamagePhoto', 'tireDamagePhoto', 'videoFile'];
    
    // Procesar cada archivo
    for (const fileType of fileTypes) {
      const file = formData.get(fileType) as File;
      
      if (file && file instanceof File) {
        console.log(`[DEBUG] Procesando archivo: ${fileType}, tamaño: ${file.size} bytes, tipo: ${file.type}`);
        
        // Generar un nombre de archivo único
        const fileExtension = file.name.split('.').pop();
        const fileName = `${inspectionId}/${fileType}.${fileExtension}`;
        
        // Convertir el archivo a un buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Subir a S3
        console.log(`[DEBUG] Subiendo archivo a S3: ${fileName}, tamaño: ${buffer.length} bytes`);
        try {
          const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: buffer,
            ContentType: file.type
          });
          
          console.log('[DEBUG] Comando S3 creado, enviando...');
          await s3Client.send(command);
          console.log(`[DEBUG] Archivo subido exitosamente a S3: ${fileName}`);
          
          // Guardar la URL del archivo
          fileUrls[fileType] = `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
          
          // Eliminar el archivo del formData para no guardarlo en la base de datos
          formData.delete(fileType);
        } catch (s3Error) {
          console.error(`[ERROR] Error al subir archivo a S3: ${fileName}`, s3Error);
          console.error('[ERROR] Detalles del error:', JSON.stringify(s3Error, null, 2));
          throw s3Error;
        }
      } else {
        console.log(`[DEBUG] No se encontró el archivo: ${fileType}`);
      }
    }
    
    // Crear objeto con todos los datos del formulario
    const formValues: { [key: string]: any } = {};
    
    formData.forEach((value, key) => {
      formValues[key] = value;
    });
    
    // Combinar los datos del formulario con las URLs de los archivos
    const submissionData = {
      id: inspectionId,
      createdAt: new Date().toISOString(),
      formData: formValues,
      fileUrls
    };
    
    // Aquí podríamos guardar submissionData en una base de datos
    console.log('[DEBUG] Datos del formulario guardados:', submissionData);
    
    // Enviar los datos al backend principal para que aparezcan en el panel de revisión
    try {
      console.log(`[DEBUG] Enviando datos al backend: ${BACKEND_API_URL}/submit/final`);
      
      // Mapear los datos al formato esperado por el backend
      const backendData = {
        id: inspectionId,
        email: formValues.email || '',
        ownerName: formValues.name || '',
        phone: formValues.phone || '',
        licensePlate: formValues.licensePlate || '',
        vehicleBrand: '', // No tenemos este campo en el formulario
        vehicleModel: '', // No tenemos este campo en el formulario
        vehicleYear: formValues.modelYear || '',
        currentKm: formValues.mileage || '',
        
        // URLs de archivos
        crlvPhotoUrl: fileUrls.crlvFile || '',
        safetyItemsPhotoUrl: fileUrls.safetyItemsFile || '',
        windshieldPhotoUrl: fileUrls.windshieldDamagePhoto || '',
        lightsPhotoUrl: fileUrls.lightsDamagePhoto || '',
        tiresPhotoUrl: fileUrls.tireDamagePhoto || '',
        videoFileUrl: fileUrls.videoFile || '',
        
        // Respuestas adicionales
        hasChassisNumber: formValues.hasChassisNumber || '',
        hasSecondKey: formValues.hasSecondKey || '',
        vehicleConditions: formValues.conditions ? JSON.parse(formValues.conditions) : [],
        safetyItems: formValues.safetyItems ? JSON.parse(formValues.safetyItems) : [],
        hasAirConditioner: formValues.acWorking || '',
        hasWindshieldDamage: formValues.hasWindshieldDamage || '',
        hasLightsDamage: formValues.hasLightsDamage || '',
        hasTiresDamage: formValues.hasTireDamage || '',
        hasOriginalSoundSystem: formValues.isOriginalSoundSystem || ''
      };
      
      console.log('[DEBUG] Datos preparados para el backend:', backendData);
      
      // Enviar al endpoint de submit/final del backend
      const backendResponse = await fetch(`${BACKEND_API_URL}/submit/final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      });
      
      if (!backendResponse.ok) {
        console.error(`[ERROR] Error al enviar datos al backend: ${backendResponse.status}`);
        console.error(`[ERROR] Respuesta del backend: ${await backendResponse.text()}`);
      } else {
        const responseData = await backendResponse.json();
        console.log('[DEBUG] Datos enviados al backend correctamente. Respuesta:', responseData);
      }
    } catch (backendError) {
      console.error('[ERROR] Error al enviar al backend:', backendError);
      // No interrumpimos el flujo principal si falla el envío al backend
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Formulário enviado com sucesso', 
      inspectionId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('[ERROR] Error al procesar el formulario:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao processar o formulário' 
    }, { status: 500 });
  }
} 