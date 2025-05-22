'use client';

import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Types
export interface FileUploadProgress {
  progress: number;
  stage: 'compressing' | 'uploading' | 'complete';
}

export interface FileUploadResult {
  url: string;
  size: number;
  type: string;
}

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const TARGET_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

// FFmpeg initialization
let ffmpeg: any = null;

async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;

  console.log('Inicializando FFmpeg...');
  ffmpeg = createFFmpeg({
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.6/dist/ffmpeg-core.js',
    log: true
  });
  try {
    await ffmpeg.load();
    console.log('FFmpeg inicializado correctamente');
    return ffmpeg;
  } catch (error) {
    console.error('Error al inicializar FFmpeg:', error);
    throw error;
  }
}

// Image compression
async function compressImage(file: File): Promise<File> {
  console.log(`Comprimiendo imagen: ${file.name} (${Math.round(file.size/1024)}KB)`);
  
  // Aquí iría la lógica de compresión de imagen
  // Por ahora retornamos el archivo original
  return file;
}

// Video compression
async function compressVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  console.log(`Iniciando compresión de video: ${file.name} (${Math.round(file.size/1024/1024)}MB)`);
  
  try {
    const ffmpeg = await initFFmpeg();
    const inputFileName = 'input.mp4';
    const outputFileName = 'output.mp4';

    // Write file to FFmpeg virtual filesystem
    const data = await file.arrayBuffer();
    ffmpeg.writeFile(inputFileName, new Uint8Array(data));

    // Set up progress callback
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        console.log(`Progreso de compresión: ${Math.round(progress * 100)}%`);
        onProgress(progress * 100);
      });
    }

    // Run compression
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'veryslow',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-ac', '1',
      '-movflags', '+faststart',
      '-y',
      outputFileName
    ]);

    // Read compressed file
    const compressedData = await ffmpeg.readFile(outputFileName);
    const compressedBlob = new Blob([compressedData], { type: 'video/mp4' });
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4', {
      type: 'video/mp4'
    });

    console.log(`Video comprimido: ${Math.round(file.size/1024/1024)}MB → ${Math.round(compressedFile.size/1024/1024)}MB`);

    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir video:', error);
    throw error;
  }
}

// Main export functions
export async function uploadFile(
  file: File,
  onProgress?: (progress: FileUploadProgress) => void
): Promise<FileUploadResult> {
  try {
    if (!file) throw new Error('No se proporcionó ningún archivo');

    // Validate file size
    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
      throw new Error(`La imagen excede el tamaño máximo permitido de ${MAX_IMAGE_SIZE/1024/1024}MB`);
    }
    if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
      throw new Error(`El video excede el tamaño máximo permitido de ${MAX_VIDEO_SIZE/1024/1024}MB`);
    }

    let processedFile = file;
    
    // Compress if needed
    if (file.type.startsWith('video/') && file.size > TARGET_VIDEO_SIZE) {
      if (onProgress) onProgress({ progress: 0, stage: 'compressing' });
      console.log('Video excede 10MB, iniciando compresión...');
      processedFile = await compressVideo(file, (progress) => {
        if (onProgress) onProgress({ progress: progress * 0.5, stage: 'compressing' });
      });
    } else if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
      if (onProgress) onProgress({ progress: 0, stage: 'compressing' });
      processedFile = await compressImage(file);
    }

    return {
      url: '',
      size: processedFile.size,
      type: processedFile.type
    };
  } catch (error) {
    console.error('Error al procesar archivo:', error);
    throw error;
  }
} 