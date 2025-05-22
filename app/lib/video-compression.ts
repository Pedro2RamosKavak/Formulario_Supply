'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Cargar FFmpeg desde CDN
  await ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm"
  });

  return ffmpeg;
}

export async function compressVideo(
  file: File,
  targetSizeMB: number = 10,
  onProgress?: (progress: number) => void
): Promise<File> {
  try {
    const ffmpeg = await initFFmpeg();
    
    // Convertir el archivo a un ArrayBuffer
    const data = await file.arrayBuffer();
    const inputFileName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputFileName = 'output.mp4';

    // Escribir el archivo en la memoria virtual de FFmpeg
    ffmpeg.writeFile(inputFileName, new Uint8Array(data));

    // Calcular el bitrate objetivo basado en el tamaño deseado
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const durationSeconds = 30; // Asumimos 30 segundos como máximo
    const targetBitrate = Math.floor((targetSizeBytes * 8) / durationSeconds);

    // Configurar el callback de progreso
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    // Ejecutar la compresión con configuración más agresiva
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'veryslow', // Más lento pero mejor compresión
      '-crf', '28', // Control de calidad (18-28 es un buen rango, mayor número = más compresión)
      '-b:v', `${targetBitrate}k`,
      '-maxrate', `${targetBitrate * 1.5}k`,
      '-bufsize', `${targetBitrate * 2}k`,
      '-c:a', 'aac',
      '-b:a', '96k', // Reducir bitrate de audio
      '-ac', '1', // Convertir a mono
      '-movflags', '+faststart',
      '-y',
      outputFileName
    ]);

    // Leer el archivo comprimido
    const compressedData = await ffmpeg.readFile(outputFileName);
    const compressedBlob = new Blob([compressedData], { type: 'video/mp4' });
    
    // Crear un nuevo archivo con el video comprimido
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4', {
      type: 'video/mp4'
    });

    // Limpiar archivos temporales
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir video:', error);
    throw error;
  }
} 