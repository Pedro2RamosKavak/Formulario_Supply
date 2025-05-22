import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen antes de subirla
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  console.log(`Comprimiendo imagen ${file.name} (${Math.round(file.size / 1024)}KB)...`);
  
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compresión completada: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB (${Math.round((1 - compressedFile.size/file.size) * 100)}% reducción)`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    return file;
  }
}

/**
 * Sube un archivo a Cloudinary a través del endpoint del servidor
 * @param file Archivo a subir
 * @returns URL del archivo subido
 */
export async function uploadFileToCloudinary(file: File): Promise<string> {
  try {
    console.log(`Preparando subida a Cloudinary: ${file.name} (${Math.round(file.size / 1024)} KB, tipo: ${file.type})`);
    
    // Para imágenes, comprimir antes de subir
    const compressedFile = await compressImage(file);
    
    // Convertir archivo a blob para envío
    const blob = new Blob([await compressedFile.arrayBuffer()], { type: compressedFile.type });
    
    // Crear FormData
    const formData = new FormData();
    formData.append('file', blob, compressedFile.name);
    
    // Enviar al endpoint del servidor que maneja la subida a Cloudinary
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Error en respuesta del servidor: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    if (!data.success || !data.url) {
      throw new Error(`Error al subir archivo: ${JSON.stringify(data)}`);
    }
    
    console.log(`Archivo subido con éxito a Cloudinary: ${data.url}`);
    return data.url;
  } catch (error: any) {
    console.error('Error al subir archivo a Cloudinary:', error);
    
    // Devolver una URL de imagen de error para que no rompa la aplicación
    return `https://placehold.co/600x400/red/white?text=${encodeURIComponent('Error: ' + (error.message || 'Desconocido'))}`;
  }
} 