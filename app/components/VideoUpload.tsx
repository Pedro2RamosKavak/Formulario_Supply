import React, { useCallback, useState } from 'react';
import { uploadFile, FileUploadProgress } from '../lib/file-service';

interface VideoUploadProps {
  onVideoUploaded: (url: string) => void;
  onError?: (error: Error) => void;
}

export default function VideoUpload({ onVideoUploaded, onError }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const handleVideoChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setCompressionProgress(0);
      
      // Verificar que es un video
      if (!file.type.startsWith('video/')) {
        throw new Error('Por favor selecciona un archivo de video válido');
      }
      
      console.log('Iniciando subida de video:', {
        name: file.name,
        size: Math.round(file.size / 1024 / 1024) + 'MB',
        type: file.type
      });
      
      // Subir el video usando nuestro nuevo servicio
      const result = await uploadFile(file, (progress: FileUploadProgress) => {
        if (progress.stage === 'compressing') {
          setIsCompressing(true);
          setCompressionProgress(progress.progress);
        } else if (progress.stage === 'uploading') {
          setIsCompressing(false);
          setUploadProgress(progress.progress);
        }
      });
      
      // Notificar éxito
      onVideoUploaded(result.url);
      setUploadProgress(100);
      
    } catch (error) {
      console.error('Error al subir video:', error);
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
    }
  }, [onVideoUploaded, onError]);
  
  return (
    <div className="relative">
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
        disabled={isUploading}
      />
      
      {isUploading && (
        <div className="mt-2">
          {isCompressing && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Comprimiendo video... {Math.round(compressionProgress)}%
              </p>
            </>
          )}
          
          {!isCompressing && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Subiendo video... {Math.round(uploadProgress)}%
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
} 