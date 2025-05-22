/**
 * Helpers para la subida de archivos
 */

'use client';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadResult {
  success: boolean;
  url: string;
  isPlaceholder?: boolean;
  error?: string;
}

interface UploadError extends Error {
  message: string;
}

/**
 * Genera un identificador único para un video
 */
function generateVideoId(file: File): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `video_${timestamp}_${randomId}`;
}

/**
 * Genera una URL de placeholder para un video
 */
function generateVideoPlaceholder(file: File): string {
  const videoId = generateVideoId(file);
  return `data:video/placeholder,${encodeURIComponent(JSON.stringify({
    id: videoId,
    name: file.name,
    size: file.size,
    type: file.type,
    timestamp: Date.now()
  }))}`;
}

/**
 * Comprime una imagen si es necesario
 */
async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_IMAGE_SIZE) {
    return file;
  }

  try {
    const imageCompression = (await import('browser-image-compression')).default;
    const options = {
      maxSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compresión completada: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB (${Math.round((1 - compressedFile.size/file.size) * 100)}% reducción)`);
    return new File([compressedFile], file.name, { type: file.type });
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    return file;
  }
}

/**
 * Genera un placeholder para errores
 */
function generateErrorPlaceholder(error: string): string {
  return `https://placehold.co/600x400/red/white?text=${encodeURIComponent(error)}`;
}

/**
 * Sube un archivo al servidor
 */
export async function uploadFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir archivo');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error en uploadFile:', error);
    throw error;
  }
}

/**
 * Sube múltiples archivos al servidor
 */
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(file => uploadFile(file)));
}

/**
 * Verifica si una URL es un placeholder de video
 */
export function isVideoPlaceholder(url: string): boolean {
  return url.startsWith('data:video/placeholder,');
}

/**
 * Extrae información de un placeholder de video
 */
export function getVideoPlaceholderInfo(url: string): any {
  if (!isVideoPlaceholder(url)) return null;
  
  try {
    const data = url.replace('data:video/placeholder,', '');
    return JSON.parse(decodeURIComponent(data));
  } catch (error) {
    console.error('Error al parsear placeholder de video:', error);
    return null;
  }
} 