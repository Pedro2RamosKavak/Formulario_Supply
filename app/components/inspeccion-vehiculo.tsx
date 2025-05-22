'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile, FileUploadProgress, FileUploadResult } from '../lib/file-service';

interface FileState {
  file: File | null;
  url: string | null;
  uploading: boolean;
  error: string | null;
  progress: FileUploadProgress | null;
}

interface FileStates {
  [key: string]: FileState;
}

// Archivos requeridos
const REQUIRED_FILES = [
  'frontal',
  'trasera',
  'lateral_izquierdo',
  'lateral_derecho',
  'interior_frontal',
  'interior_trasero',
  'videoFile'
];

export default function InspeccionVehiculo() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Estados de los archivos
  const [fileStates, setFileStates] = useState<FileStates>(() => {
    const initialStates: FileStates = {};
    REQUIRED_FILES.forEach(key => {
      initialStates[key] = {
        file: null,
        url: null,
        uploading: false,
        error: null,
        progress: null
      };
    });
    return initialStates;
  });

  const [progress, setProgress] = useState(0);
  const [uploadingStage, setUploadingStage] = useState('');
  const [success, setSuccess] = useState(false);

  // Manejo de cambios en campos de formulario
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  }, []);

  // Manejo de cambios en archivos
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log(`Archivo seleccionado (${fieldName}):`, file.name, `(${Math.round(file.size/1024/1024)}MB)`);

    setFileStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        file,
        uploading: true,
        error: null,
        progress: null
      }
    }));

    try {
      console.log(`Iniciando subida de ${fieldName}...`);
      const result = await uploadFile(file, (progress: FileUploadProgress) => {
        console.log(`Progreso de ${fieldName}:`, progress);
        setFileStates(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            progress
          }
        }));
      });

      console.log(`Archivo ${fieldName} subido exitosamente:`, result.url);
      setFileStates(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          url: result.url,
          uploading: false,
          error: null
        }
      }));
    } catch (error) {
      console.error(`Error al subir ${fieldName}:`, error);
      setFileStates(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          uploading: false,
          error: error instanceof Error ? error.message : 'Error desconocido al subir el archivo'
        }
      }));
    }
  }, []);

  // Envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);
    setProgress(5);
    setUploadingStage('Preparando archivos');
    setSuccess(false);

    try {
      // 1. Verificar archivos requeridos
      const missingFiles = REQUIRED_FILES.filter(key => !fileStates[key].file);
      if (missingFiles.length > 0) {
        throw new Error(`Faltan los siguientes archivos: ${missingFiles.join(', ')}`);
      }
      setProgress(15);
      setUploadingStage('Solicitando URLs de subida');

      // 2. Pedir presigned URLs
      const presignedResp = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredFiles: REQUIRED_FILES,
          email: formValues.email || '',
          answers: formValues
        })
      });
      if (!presignedResp.ok) throw new Error('Error al obtener presigned URLs');
      const { id, uploadUrls } = await presignedResp.json();
      setProgress(30);
      setUploadingStage('Subiendo archivos a S3');

      // 3. Subir archivos a S3
      const s3Urls: Record<string, string> = {};
      let fileCount = 0;
      for (const key of REQUIRED_FILES) {
        const file = fileStates[key].file;
        const url = uploadUrls[key];
        if (!file || !url) throw new Error(`Falta archivo o URL para ${key}`);
        const contentType = key === 'videoFile' ? 'video/mp4' : 'image/jpeg';
        const uploadResp = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file
        });
        if (!uploadResp.ok) throw new Error(`Error al subir ${key} a S3`);
        const s3Url = url.split('?')[0];
        s3Urls[key] = s3Url;
        fileCount++;
        setProgress(30 + Math.round((fileCount / REQUIRED_FILES.length) * 40));
      }
      setUploadingStage('Guardando inspección');
      setProgress(75);

      // 4. Enviar datos finales al backend
      const finalData = {
        id,
        ...formValues,
        ...s3Urls
      };
      const saveResp = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const saveResult = await saveResp.json();
      if (!saveResult.success) throw new Error(saveResult.message || 'Error al guardar la inspección');

      setProgress(100);
      setUploadingStage('¡Listo!');
      setSuccess(true);
      setTimeout(() => {
        setProgress(0);
        setUploadingStage('');
        setSuccess(false);
        // router.push('/inspecciones'); // Opcional: redirigir
      }, 2000);
      alert(`Inspección guardada correctamente (ID: ${id})`);
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Error desconocido');
      setProgress(0);
      setUploadingStage('');
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos del formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Nombre del propietario:
            <input
              type="text"
              name="ownerName"
              value={formValues.ownerName || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </label>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Placa:
            <input
              type="text"
              name="licensePlate"
              value={formValues.licensePlate || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </label>
        </div>
      </div>
      
      {/* Archivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_FILES.map(fieldName => (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ')}:
              <input
                type="file"
                accept={fieldName === 'videoFile' ? 'video/*' : 'image/*'}
                onChange={(e) => handleFileChange(e, fieldName)}
                className="mt-1 block w-full text-sm"
              />
            </label>
            
            {fileStates[fieldName].uploading && fileStates[fieldName].progress && (
              <div className="text-sm">
                {fileStates[fieldName].progress.stage === 'compressing' && (
                  <div>
                    <p>Comprimiendo: {Math.round(fileStates[fieldName].progress.progress)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${fileStates[fieldName].progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {fileStates[fieldName].progress.stage === 'uploading' && (
                  <div>
                    <p>Subiendo: {Math.round(fileStates[fieldName].progress.progress)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${fileStates[fieldName].progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {fileStates[fieldName].error && (
              <p className="text-red-500 text-sm">{fileStates[fieldName].error}</p>
            )}
            
            {fileStates[fieldName].url && (
              <p className="text-green-500 text-sm">Archivo subido correctamente</p>
            )}
          </div>
        ))}
      </div>
      
      {submissionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {submissionError}
        </div>
      )}

      {/* Barra de progreso global y mensajes de etapa */}
      {(isSubmitting || progress > 0) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm font-medium">{uploadingStage}</span>
            <span className="ml-auto text-xs text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          ¡Inspección enviada con éxito!
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={isSubmitting || REQUIRED_FILES.some(key => fileStates[key].uploading)}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Inspección'}
      </button>
    </form>
  );
} 