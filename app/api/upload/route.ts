/**
 * API endpoint para manejar la subida de archivos
 * Este endpoint recibe archivos y los sube a Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar límites
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false
  }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB para el endpoint

/**
 * Función para comprimir la imagen en el servidor usando sharp
 */
async function compressImageBuffer(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!mimeType.startsWith('image/')) {
    return buffer;
  }
  
  try {
    let sharpInstance = sharp(buffer);
    
    // Redimensionar si es necesario (máximo 800px de ancho)
    sharpInstance = sharpInstance.resize({
      width: 800,
      height: undefined,
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Comprimir según el tipo de imagen
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return await sharpInstance.jpeg({ quality: 60 }).toBuffer();
    } else if (mimeType === 'image/png') {
      return await sharpInstance.png({ quality: 60 }).toBuffer();
    } else if (mimeType === 'image/webp') {
      return await sharpInstance.webp({ quality: 60 }).toBuffer();
    }
    
    return buffer;
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    return buffer;
  }
}

/**
 * Manejador POST para subir archivos
 */
export async function POST(request: NextRequest) {
  // Eliminar toda la lógica de Cloudinary y dejar el endpoint vacío o con un mensaje deprecado.
  return NextResponse.json(
    { 
      success: false,
      error: 'Este endpoint ya no está disponible'
    },
    { status: 400 }
  );
} 