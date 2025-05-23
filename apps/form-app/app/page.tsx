"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  // Estados para manejar valores del formulario
  const [currentStep, setCurrentStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Estados para la barra de progreso
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licensePlate: '',
    mileage: '',
    modelYear: '',
    hasChassisNumber: '',
    hasSecondKey: '',
    crlvFile: null as string | null,
    conditions: [] as string[],
    safetyItems: [] as string[],
    acWorking: '',
    hasWindshieldDamage: '',
    hasLightsDamage: '',
    hasTireDamage: '',
    isOriginalSoundSystem: '',
    safetyItemsFile: null as string | null,
    // Campos específicos para cada tipo de daño
    windshieldDamagePhoto: null as string | null,
    lightsDamagePhoto: null as string | null,
    tireDamagePhoto: null as string | null,
    videoFile: null as string | null,
    termsAccepted: false
  });
  
  const [yearError, setYearError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: boolean}>({});
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({});
  
  // Referencias para los elementos de archivo
  const crlvFileRef = useRef<HTMLInputElement>(null);
  const itemsFileRef = useRef<HTMLInputElement>(null);
  const windshieldDamagePhotoRef = useRef<HTMLInputElement>(null);
  const lightsDamagePhotoRef = useRef<HTMLInputElement>(null);
  const tireDamagePhotoRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  
  const totalSteps = 6;
  
  // Calcular el progreso actual
  const progress = Math.round(((currentStep - 1) / totalSteps) * 100);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedStep = localStorage.getItem('currentStep');
    const savedFormData = localStorage.getItem('formData');
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Guardar cambios en localStorage cuando el estado cambia
  useEffect(() => {
    localStorage.setItem('currentStep', currentStep.toString());
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [currentStep, formData]);

  // Prevenir que el usuario salga durante el envío
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (submitting) {
        event.preventDefault();
        event.returnValue = 'O formulário está sendo enviado. Tem certeza de que deseja sair?';
        return 'O formulário está sendo enviado. Tem certeza de que deseja sair?';
      }
    };

    if (submitting) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submitting]);

  // Función para actualizar los datos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name.startsWith('condition-')) {
        const conditionValue = name.replace('condition-', '');
        setFormData(prev => {
          const updatedConditions = checked 
            ? [...prev.conditions, conditionValue]
            : prev.conditions.filter(item => item !== conditionValue);
            
          return { ...prev, conditions: updatedConditions };
        });
      } else if (name.startsWith('safety-')) {
        const safetyValue = name.replace('safety-', '');
        setFormData(prev => {
          const updatedSafetyItems = checked 
            ? [...prev.safetyItems, safetyValue]
            : prev.safetyItems.filter(item => item !== safetyValue);
            
          return { ...prev, safetyItems: updatedSafetyItems };
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validar año
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yearValue = e.target.value;
    setFormData(prev => ({ ...prev, modelYear: yearValue }));
    
    const currentYear = new Date().getFullYear();
    if (parseInt(yearValue, 10) > currentYear) {
      setYearError(`O ano não pode ser maior que ${currentYear}`);
    } else {
      setYearError('');
    }
  };

  // Validar email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    setFormData(prev => ({ ...prev, email: emailValue }));
    
    // Expresión regular para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('Por favor, insira um e-mail válido');
    } else {
      setEmailError('');
    }
  };

  // Manejar clicks en botones de carga
  const handlePhotoClick = (fileRef: React.RefObject<HTMLInputElement | null>) => {
    if (fileRef.current) {
      fileRef.current.setAttribute('capture', 'environment');
      fileRef.current.setAttribute('accept', 'image/*');
      fileRef.current.click();
    }
  };

  const handleUploadClick = (fileRef: React.RefObject<HTMLInputElement | null>) => {
    if (fileRef.current) {
      fileRef.current.removeAttribute('capture');
      fileRef.current.click();
    }
  };

  const handleVideoRecordClick = () => {
    if (videoFileRef.current) {
      videoFileRef.current.setAttribute('capture', 'camcorder');
      videoFileRef.current.setAttribute('accept', 'video/*');
      videoFileRef.current.click();
    }
  };

  // Manejar cambios en archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
      
      if (fileType === 'crlv') {
        setFormData(prev => ({ ...prev, crlvFile: URL.createObjectURL(file) }));
      } else if (fileType === 'safetyItems') {
        setFormData(prev => ({ ...prev, safetyItemsFile: URL.createObjectURL(file) }));
      } else if (fileType === 'windshieldDamagePhoto') {
        setFormData(prev => ({ ...prev, windshieldDamagePhoto: URL.createObjectURL(file) }));
      } else if (fileType === 'lightsDamagePhoto') {
        setFormData(prev => ({ ...prev, lightsDamagePhoto: URL.createObjectURL(file) }));
      } else if (fileType === 'tireDamagePhoto') {
        setFormData(prev => ({ ...prev, tireDamagePhoto: URL.createObjectURL(file) }));
      } else if (fileType === 'video') {
        setFormData(prev => ({ ...prev, videoFile: URL.createObjectURL(file) }));
      }
      
      setFormErrors(prev => ({ ...prev, [fileType]: false }));
    }
  };
  
  // Validar paso actual
  const validateCurrentStep = () => {
    let isValid = true;
    const errors: {[key: string]: boolean} = {};
    
    switch(currentStep) {
      case 2: // Información General
        if (!formData.name) {
          errors.name = true;
          isValid = false;
        }
        if (!formData.email || emailError) {
          errors.email = true;
          isValid = false;
        }
        if (!formData.phone) {
          errors.phone = true;
          isValid = false;
        }
        if (!formData.licensePlate) {
          errors.licensePlate = true;
          isValid = false;
        }
        if (!formData.mileage) {
          errors.mileage = true;
          isValid = false;
        }
        if (!formData.modelYear || yearError) {
          errors.modelYear = true;
          isValid = false;
        }
        break;
      case 3: // Documentación e Itens Básicos
        if (!formData.hasChassisNumber) {
          errors.hasChassisNumber = true;
          isValid = false;
        }
        if (!formData.hasSecondKey) {
          errors.hasSecondKey = true;
          isValid = false;
        }
        if (!formData.crlvFile) {
          errors.crlv = true;
          isValid = false;
        }
        break;
      case 4: // Condiciones del Vehículo
        if (formData.conditions.length === 0) {
          errors.conditions = true;
          isValid = false;
        }
        if (formData.safetyItems.length === 0) {
          errors.safetyItems = true;
          isValid = false;
        }
        if (!formData.acWorking) {
          errors.acWorking = true;
          isValid = false;
        }
        if (!formData.hasWindshieldDamage) {
          errors.hasWindshieldDamage = true;
          isValid = false;
        }
        if (!formData.hasLightsDamage) {
          errors.hasLightsDamage = true;
          isValid = false;
        }
        if (!formData.hasTireDamage) {
          errors.hasTireDamage = true;
          isValid = false;
        }
        if (!formData.isOriginalSoundSystem) {
          errors.isOriginalSoundSystem = true;
          isValid = false;
        }
        
        // Si el vehículo tiene ítems de seguridad y no se ha seleccionado "Não possuo nenhum dos itens acima"
        if (formData.safetyItems.length > 0 && !formData.safetyItems.includes('nenhum') && !formData.safetyItemsFile) {
          errors.safetyItemsFile = true;
          isValid = false;
        }
        
        // Validar fotos específicas para cada tipo de daño
        if (formData.hasWindshieldDamage === 'sim' && !formData.windshieldDamagePhoto) {
          errors.windshieldDamagePhoto = true;
          isValid = false;
        }
        
        if (formData.hasLightsDamage === 'sim' && !formData.lightsDamagePhoto) {
          errors.lightsDamagePhoto = true;
          isValid = false;
        }
        
        if (formData.hasTireDamage === 'sim' && !formData.tireDamagePhoto) {
          errors.tireDamagePhoto = true;
          isValid = false;
        }
        break;
      case 5: // Video
        if (!formData.videoFile) {
          errors.video = true;
          isValid = false;
        }
        break;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  // Función para enviar datos iniciales al backend (Zapier integration)
  const sendInitialData = async () => {
    try {
      console.log('[ZAPIER-INTEGRATION] Enviando datos iniciales...');
      
      const initialData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licensePlate: formData.licensePlate,
        mileage: formData.mileage,
        modelYear: formData.modelYear,
        formType: 'initial'
      };
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://formulario-supply-kavak.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/zapier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialData),
      });
      
      if (response.ok) {
        console.log('[ZAPIER-INTEGRATION] Datos iniciales enviados exitosamente');
      } else {
        console.warn('[ZAPIER-INTEGRATION] Error al enviar datos iniciales:', response.status);
      }
    } catch (error) {
      console.warn('[ZAPIER-INTEGRATION] Error al enviar datos iniciales:', error);
      // No interrumpimos el flujo si falla el envío inicial
    }
  };

  // Función principal para enviar el formulario completo
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setSubmitError('Por favor, complete todos los campos requeridos.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setUploadProgress(0);
    setUploadStep('Preparando envío...');
    setUploadingFiles({});

    try {
      console.log('[SUBMIT] Iniciando envío del formulario...');
      setUploadProgress(10);
      setUploadStep('Verificando archivos...');

      // Determinar qué archivos son requeridos basado en las respuestas
      const requiredFiles = [
        'crlvFile',
        ...(formData.safetyItems.length > 0 && !formData.safetyItems.includes('nenhum') ? ['safetyItemsFile'] : []),
        ...(formData.hasWindshieldDamage === 'sim' ? ['windshieldDamagePhoto'] : []),
        ...(formData.hasLightsDamage === 'sim' ? ['lightsDamagePhoto'] : []),
        ...(formData.hasTireDamage === 'sim' ? ['tireDamagePhoto'] : []),
        'videoFile'
      ];

      console.log('[SUBMIT] Archivos requeridos:', requiredFiles);

      // Mapeo de nombres de archivos
      const fileMapping: Record<string, string> = {
        crlvFile: 'crlv',
        safetyItemsFile: 'safetyItems',
        windshieldDamagePhoto: 'windshieldDamagePhoto',
        lightsDamagePhoto: 'lightsDamagePhoto',
        tireDamagePhoto: 'tireDamagePhoto',
        videoFile: 'video'
      };

      // 1. Obtener URLs pre-firmadas del backend
      setUploadProgress(20);
      setUploadStep('Conectando con el servidor...');
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://formulario-supply-kavak.onrender.com';
      
      const signedUrlsResponse = await fetch(`${backendUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          requiredFiles 
        }),
      });
      
      if (!signedUrlsResponse.ok) {
        const errorData = await signedUrlsResponse.json();
        throw new Error(errorData.error || 'Error al obtener URLs del backend');
      }
      
      const signedUrlsData = await signedUrlsResponse.json();
      console.log('[SUBMIT] URLs pre-firmadas obtenidas:', Object.keys(signedUrlsData.uploadUrls));
      const inspectionId = signedUrlsData.id;
      
      setUploadProgress(30);
      setUploadStep('Preparando subida de archivos...');
      
      // 2. Subir cada archivo usando las URLs pre-firmadas
      const uploadPromises = [];
      const s3Urls: Record<string, string> = {};
      const totalFiles = requiredFiles.length;
      let completedFiles = 0;
      
      for (const fileKey of requiredFiles) {
        const localFileKey = fileMapping[fileKey];
        const file = uploadedFiles[localFileKey];
        const signedUrl = signedUrlsData.uploadUrls[fileKey];
        
        if (file && signedUrl) {
          console.log(`[SUBMIT] Subiendo archivo ${fileKey} (${file.name}) para S3...`);
          setUploadingFiles(prev => ({ ...prev, [fileKey]: true }));
          setUploadStep(`Subiendo ${fileKey === 'videoFile' ? 'video' : 'imagen'}...`);
          
          // Crear promesa para subir el archivo
          const uploadPromise = fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': fileKey === 'videoFile' ? 'video/mp4' : 'image/jpeg',
            },
            body: file,
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Error al subir archivo ${fileKey}: ${response.status} ${response.statusText}`);
            }
            
            // Marcar archivo como completado
            setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
            completedFiles++;
            const fileProgress = 30 + (completedFiles / totalFiles) * 50; // 30% - 80%
            setUploadProgress(Math.round(fileProgress));
            setUploadStep(`Archivo ${completedFiles}/${totalFiles} completado`);
            
            // Extraer la URL del archivo en S3 de la respuesta
            const s3Url = signedUrl.split('?')[0]; // Quitar parámetros de query
            s3Urls[`${fileKey}Url`] = s3Url;
            console.log(`[SUBMIT] Archivo ${fileKey} subido correctamente para ${s3Url.substring(0, 60)}...`);
            return s3Url;
          });
          
          uploadPromises.push(uploadPromise);
        } else {
          console.warn(`[SUBMIT] No se encontró archivo para ${fileKey} o URL firmada`);
        }
      }
      
      // Esperar a que se completen todas las subidas
      console.log('[SUBMIT] Esperando que se completen todas las subidas...');
      setUploadStep('Finalizando subidas...');
      await Promise.all(uploadPromises);
      console.log('[SUBMIT] Todas las subidas completadas');
      
      setUploadProgress(85);
      setUploadStep('Guardando información...');
      
      // 3. Enviar datos finales al backend Express.js
      console.log('[SUBMIT] Enviando datos finales al backend...');
      const finalPayload = {
        id: inspectionId,
        email: formData.email,
        ownerName: formData.name,
        contactPhone: formData.phone,
        licensePlate: formData.licensePlate,
        currentKm: formData.mileage,
        modelYear: formData.modelYear,
        hasChassisNumber: formData.hasChassisNumber,
        hasSecondKey: formData.hasSecondKey,
        vehicleConditions: formData.conditions,
        safetyItems: formData.safetyItems,
        acWorking: formData.acWorking,
        hasWindshieldDamage: formData.hasWindshieldDamage,
        hasLightsDamage: formData.hasLightsDamage,
        hasTiresDamage: formData.hasTireDamage,
        hasOriginalSoundSystem: formData.isOriginalSoundSystem,
        ...s3Urls
      };
      
      const submitResponse = await fetch(`${backendUrl}/api/submit/final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
      });
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Error al enviar datos finales');
      }
      
      const submitResult = await submitResponse.json();
      console.log('[SUBMIT] Formulario enviado exitosamente:', submitResult);
      
      setUploadProgress(100);
      setUploadStep('¡Completado exitosamente!');
      
      // Pequeña pausa para mostrar el progreso completo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar la UI para mostrar éxito
      setFormSubmitted(true);
      setCurrentStep(7);
      
      // Limpiar localStorage
      localStorage.removeItem('currentStep');
      localStorage.removeItem('formData');
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("[ERROR] Error al enviar el formulario:", error);
      setSubmitError(error.message || 'Ocorreu um erro ao enviar o formulário. Tente novamente.');
      setUploadProgress(0);
      setUploadStep('');
    } finally {
      setSubmitting(false);
      setUploadingFiles({});
    }
  };

  // Función para ir al paso anterior
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Función para ir al paso siguiente
  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Solo validamos si no estamos en el paso de introducción
      if (currentStep === 1 || validateCurrentStep()) {
        // Si estamos pasando del paso 2 al 3, enviar datos iniciales a la API
        if (currentStep === 2) {
          sendInitialData();
        }
        
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const renderFormStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Olá, vamos começar a sua inspeção virtual
            </h2>

            <p className="mb-4 text-lg">
              Nosso compromisso é garantir total clareza em cada etapa do processo e assegurar a integridade 
              do seu veículo. Assim, conseguimos te oferecer uma pré-oferta justa, baseada em informações precisas.
            </p>

            <div className="mb-6 bg-[#f8f9fa] p-4 rounded-lg border-l-4 border-blue-700">
              <h3 className="font-medium text-lg mb-2">📌 Informações importantes:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-2">📷</span>
                  <span>
                    Durante este questionário, solicitaremos o envio de vídeo e fotos do seu veículo. 
                    Essas etapas são obrigatórias para que possamos avançar com a proposta de compra.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span>
                    Se não puder realizar esse envio agora, recomendamos que retorne mais tarde 
                    ou entre em contato conosco para agendar uma inspeção presencial.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>
                    No momento da entrega do veículo em uma de nossas unidades, realizaremos uma inspeção 
                    expressa para validar os dados fornecidos neste formulário. Por isso, pedimos 
                    transparência e honestidade ao preenchê-lo.
                  </span>
                </li>
              </ul>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Informações Gerais
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual o nome do titular do veículo?*
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Digite o nome completo do titular"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual o seu e-mail?* (preferencialmente o mesmo usado no site Kavak)
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`w-full p-2 border ${emailError || formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Digite seu email"
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
                {formErrors.email && !emailError && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual o número do seu celular?*
                </label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="(00) 00000-0000"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual a placa do veículo?*
                </label>
                <input 
                  type="text" 
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.licensePlate ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="ABC1234"
                />
                {formErrors.licensePlate && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual a quilometragem atual do veículo (sem arredondamentos)?*
                </label>
                <input 
                  type="number" 
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${formErrors.mileage ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Digite a quilometragem atual"
                />
                {formErrors.mileage && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Qual o ano modelo do veículo?*
                </label>
                <input 
                  type="number" 
                  name="modelYear"
                  value={formData.modelYear}
                  onChange={handleYearChange}
                  className={`w-full p-2 border ${yearError || formErrors.modelYear ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Digite o ano do modelo"
                  max={new Date().getFullYear()}
                />
                {yearError && (
                  <p className="text-red-500 text-xs mt-1">{yearError}</p>
                )}
                {formErrors.modelYear && !yearError && (
                  <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                )}
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Documentação e Itens Básicos
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Todos os vidros têm a gravação do número do chassi?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="chassi-sim" 
                      name="hasChassisNumber" 
                      value="sim" 
                      checked={formData.hasChassisNumber === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.hasChassisNumber ? 'text-red-500' : ''}
                      required
                    />
                    <label htmlFor="chassi-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="chassi-nao" 
                      name="hasChassisNumber" 
                      value="nao" 
                      checked={formData.hasChassisNumber === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.hasChassisNumber ? 'text-red-500' : ''}
                      required
                    />
                    <label htmlFor="chassi-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.hasChassisNumber && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Você possui a segunda chave do veículo?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="chave-sim" 
                      name="hasSecondKey" 
                      value="sim" 
                      checked={formData.hasSecondKey === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.hasSecondKey ? 'text-red-500' : ''}
                      required
                    />
                    <label htmlFor="chave-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="chave-nao" 
                      name="hasSecondKey" 
                      value="nao" 
                      checked={formData.hasSecondKey === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.hasSecondKey ? 'text-red-500' : ''}
                      required
                    />
                    <label htmlFor="chave-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.hasSecondKey && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Envie o CRLV do veículo (foto obrigatória)*
                </label>
                <div className="file-upload-container">
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-blue-600 font-medium">Clique para fazer upload ou tire uma foto</span>
                      <span className="text-gray-500 text-sm mt-1">Arraste e solte um arquivo ou use a câmera do seu dispositivo</span>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <button 
                        type="button" 
                        onClick={() => handlePhotoClick(crlvFileRef)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Tirar foto
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleUploadClick(crlvFileRef)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload
                      </button>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={crlvFileRef}
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'crlv')}
                  />
                  
                  {formErrors.crlv && (
                    <p className="text-red-500 text-xs mt-2">Por favor, envie a foto do CRLV.</p>
                  )}
                  
                  {formData.crlvFile && (
                    <div className="mt-3">
                      <p className="text-green-500 text-xs">Arquivo carregado com sucesso!</p>
                      <div className="mt-2 relative h-32 bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={formData.crlvFile}
                          alt="CRLV do veículo" 
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Condições do Veículo
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  O seu veículo possui alguma das características abaixo?*
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'roubo', label: 'Histórico de roubo e furto' },
                    { id: 'blindado', label: 'É blindado' },
                    { id: 'gas', label: 'Tem Kit gás (GNV)' },
                    { id: 'dano', label: 'Dano estrutural' },
                    { id: 'leilao', label: 'Já teve passagem por leilão' },
                    { id: 'batida', label: 'Já teve batida' },
                    { id: 'modificacao', label: 'Possui modificação na estrutura' },
                    { id: 'rebaixado', label: 'Rebaixado' },
                    { id: 'performance', label: 'Alterações de performance (escape, remap, etc.)' },
                    { id: 'nenhum', label: 'Nenhuma das opções acima' }
                  ].map(option => (
                    <div key={option.id} className="flex items-start">
                      <input 
                        type="checkbox" 
                        id={`condition-${option.id}`}
                        name={`condition-${option.id}`}
                        checked={formData.conditions.includes(option.id)}
                        onChange={handleInputChange} 
                        className={`mt-1 mr-2 ${formErrors.conditions ? 'border-red-500' : ''}`}
                      />
                      <label htmlFor={`condition-${option.id}`} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {formErrors.conditions && (
                  <p className="text-red-500 text-xs mt-1">Por favor, selecione pelo menos uma opção</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Quais itens de segurança o veículo possui?*
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'chave', label: 'Chave de roda' },
                    { id: 'estepe', label: 'Estepe' },
                    { id: 'triangulo', label: 'Triângulo' },
                    { id: 'macaco', label: 'Macaco' },
                    { id: 'nenhum', label: 'Não possuo nenhum dos itens acima' }
                  ].map(option => (
                    <div key={option.id} className="flex items-start">
                      <input 
                        type="checkbox" 
                        id={`safety-${option.id}`}
                        name={`safety-${option.id}`}
                        checked={formData.safetyItems.includes(option.id)}
                        onChange={handleInputChange}
                        className={`mt-1 mr-2 ${formErrors.safetyItems ? 'border-red-500' : ''}`}
                      />
                      <label htmlFor={`safety-${option.id}`} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {formErrors.safetyItems && (
                  <p className="text-red-500 text-xs mt-1">Por favor, selecione pelo menos uma opção</p>
                )}
              </div>
              
              {/* Mostrar campo de upload solo si tiene ítems de seguridad y no seleccionó "ninguno" */}
              {formData.safetyItems.length > 0 && !formData.safetyItems.includes('nenhum') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Envie uma foto dos itens de segurança*
                  </label>
                  <div className="file-upload-container">
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-blue-600 font-medium">Clique para fazer upload ou tire uma foto</span>
                        <span className="text-gray-500 text-sm mt-1">Arraste e solte um arquivo ou use a câmera do seu dispositivo</span>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <button 
                          type="button" 
                          onClick={() => handlePhotoClick(itemsFileRef)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Tirar foto
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleUploadClick(itemsFileRef)}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload
                        </button>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={itemsFileRef}
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'safetyItems')}
                    />
                    
                    {formErrors.safetyItemsFile && (
                      <p className="text-red-500 text-xs mt-2">Por favor, envie a foto dos itens de segurança.</p>
                    )}
                    
                    {formData.safetyItemsFile && (
                      <div className="mt-3">
                        <p className="text-green-500 text-xs">Arquivo carregado com sucesso!</p>
                        <div className="mt-2 relative h-32 bg-gray-100 rounded-md overflow-hidden">
                          <img 
                            src={formData.safetyItemsFile}
                            alt="Itens de segurança" 
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  O ar-condicionado está funcionando e gelando corretamente?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="ac-sim" 
                      name="acWorking" 
                      value="sim"
                      checked={formData.acWorking === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.acWorking ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="ac-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="ac-nao" 
                      name="acWorking" 
                      value="nao"
                      checked={formData.acWorking === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.acWorking ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="ac-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.acWorking && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  O para-brisa apresenta algum tipo de avaria?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="parabrisa-sim" 
                      name="hasWindshieldDamage" 
                      value="sim"
                      checked={formData.hasWindshieldDamage === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.hasWindshieldDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="parabrisa-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="parabrisa-nao" 
                      name="hasWindshieldDamage" 
                      value="nao"
                      checked={formData.hasWindshieldDamage === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.hasWindshieldDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="parabrisa-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.hasWindshieldDamage && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
                
                {/* Mostrar campo de carga de foto si hay daño en el parabrisas */}
                {formData.hasWindshieldDamage === 'sim' && (
                  <div className="mt-3 border-l-2 border-blue-300 pl-3">
                    <label className="block text-sm font-medium text-blue-600">
                      Envie uma foto do para-brisa danificado*
                    </label>
                    <div className="file-upload-container mt-2">
                      <div className="border-2 border-dashed border-gray-300 p-3 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-6 h-6 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-blue-600 font-medium text-sm">Tirar ou enviar foto</span>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => handlePhotoClick(windshieldDamagePhotoRef)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Tirar foto
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleUploadClick(windshieldDamagePhotoRef)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                          </button>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={windshieldDamagePhotoRef}
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'windshieldDamagePhoto')}
                      />
                      
                      {formErrors.windshieldDamagePhoto && (
                        <p className="text-red-500 text-xs mt-1">Por favor, envie a foto do para-brisa.</p>
                      )}
                      
                      {formData.windshieldDamagePhoto && (
                        <div className="mt-2">
                          <p className="text-green-500 text-xs">Arquivo carregado com sucesso!</p>
                          <div className="mt-1 relative h-20 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={formData.windshieldDamagePhoto}
                              alt="Danos no para-brisa" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Os faróis dianteiros, lanternas traseiras ou retrovisores estão danificados ou quebrados?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="farois-sim" 
                      name="hasLightsDamage" 
                      value="sim"
                      checked={formData.hasLightsDamage === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.hasLightsDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="farois-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="farois-nao" 
                      name="hasLightsDamage" 
                      value="nao"
                      checked={formData.hasLightsDamage === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.hasLightsDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="farois-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.hasLightsDamage && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
                
                {/* Mostrar campo de carga de foto si hay daño en faros/luces */}
                {formData.hasLightsDamage === 'sim' && (
                  <div className="mt-3 border-l-2 border-blue-300 pl-3">
                    <label className="block text-sm font-medium text-blue-600">
                      Envie uma foto dos faróis/lanternas/retrovisores danificados*
                    </label>
                    <div className="file-upload-container mt-2">
                      <div className="border-2 border-dashed border-gray-300 p-3 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-6 h-6 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-blue-600 font-medium text-sm">Tirar ou enviar foto</span>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => handlePhotoClick(lightsDamagePhotoRef)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Tirar foto
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleUploadClick(lightsDamagePhotoRef)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                          </button>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={lightsDamagePhotoRef}
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'lightsDamagePhoto')}
                      />
                      
                      {formErrors.lightsDamagePhoto && (
                        <p className="text-red-500 text-xs mt-1">Por favor, envie a foto dos faróis/lanternas/retrovisores.</p>
                      )}
                      
                      {formData.lightsDamagePhoto && (
                        <div className="mt-2">
                          <p className="text-green-500 text-xs">Arquivo carregado com sucesso!</p>
                          <div className="mt-1 relative h-20 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={formData.lightsDamagePhoto}
                              alt="Danos nos faróis/lanternas/retrovisores" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Os pneus (incluindo o estepe) apresentam bolhas, cortes ou desgaste irregular?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="pneus-sim" 
                      name="hasTireDamage" 
                      value="sim"
                      checked={formData.hasTireDamage === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.hasTireDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="pneus-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="pneus-nao" 
                      name="hasTireDamage" 
                      value="nao"
                      checked={formData.hasTireDamage === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.hasTireDamage ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="pneus-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.hasTireDamage && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
                
                {/* Mostrar campo de carga de foto si hay daño en neumáticos */}
                {formData.hasTireDamage === 'sim' && (
                  <div className="mt-3 border-l-2 border-blue-300 pl-3">
                    <label className="block text-sm font-medium text-blue-600">
                      Envie uma foto dos pneus danificados*
                    </label>
                    <div className="file-upload-container mt-2">
                      <div className="border-2 border-dashed border-gray-300 p-3 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-6 h-6 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-blue-600 font-medium text-sm">Tirar ou enviar foto</span>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => handlePhotoClick(tireDamagePhotoRef)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Tirar foto
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleUploadClick(tireDamagePhotoRef)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                          </button>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={tireDamagePhotoRef}
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'tireDamagePhoto')}
                      />
                      
                      {formErrors.tireDamagePhoto && (
                        <p className="text-red-500 text-xs mt-1">Por favor, envie a foto dos pneus.</p>
                      )}
                      
                      {formData.tireDamagePhoto && (
                        <div className="mt-2">
                          <p className="text-green-500 text-xs">Arquivo carregado com sucesso!</p>
                          <div className="mt-1 relative h-20 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={formData.tireDamagePhoto}
                              alt="Danos nos pneus" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  O sistema de som/multimídia é original do veículo?*
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="som-sim" 
                      name="isOriginalSoundSystem" 
                      value="sim"
                      checked={formData.isOriginalSoundSystem === 'sim'}
                      onChange={handleInputChange}
                      className={formErrors.isOriginalSoundSystem ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="som-sim" className="ml-2">Sim</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="som-nao" 
                      name="isOriginalSoundSystem" 
                      value="nao"
                      checked={formData.isOriginalSoundSystem === 'nao'}
                      onChange={handleInputChange}
                      className={formErrors.isOriginalSoundSystem ? 'text-red-500' : ''}
                      required 
                    />
                    <label htmlFor="som-nao" className="ml-2">Não</label>
                  </div>
                </div>
                {formErrors.isOriginalSoundSystem && (
                  <p className="text-red-500 text-xs mt-1">Por favor, responda esta pergunta</p>
                )}
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Vídeo do Veículo
            </h2>
            
            <div className="space-y-6">
              <div className="border rounded-md overflow-hidden">
                <div className="p-4 bg-gray-50">
                  <h3 className="font-medium mb-4 text-lg">Instruções para gravação do vídeo:</h3>
                  
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>
                      Comece mostrando a <strong>placa dianteira</strong> e a frente do veículo (para-choque e faróis).
                    </li>
                    <li>
                      Caminhe pelo <strong>lado do passageiro</strong> mostrando lataria e pneus.
                    </li>
                    <li>
                      Mostre a <strong>traseira</strong> do veículo (para-choque e lanternas).
                    </li>
                    <li>
                      Caminhe pelo <strong>lado do motorista</strong> repetindo o processo.
                    </li>
                    <li>
                      Teste os <strong>comandos das chaves</strong> (travar/destravar).
                    </li>
                    <li>
                      Mostre o <strong>interior</strong>: painel com quilometragem, comandos do volante, vidros, 
                      teto solar (se houver), bancos elétricos (se houver), e central multimídia.
                    </li>
                  </ol>
                  
                  <div className="my-4">
                    <div className="rounded-lg border border-gray-300 overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-2">
                          <h4 className="text-center font-medium mb-2 bg-blue-500 text-white py-1 rounded">Volta de Vídeo</h4>
                          <div className="flex justify-center items-center">
                            <div className="relative w-full max-w-xs">
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="relative h-32 bg-gray-50 border border-gray-200 rounded-lg">
                                  <svg className="absolute w-full h-full" viewBox="0 0 300 200">
                                    <rect x="50" y="30" width="200" height="120" rx="10" fill="#ff0000" opacity="0.8"/>
                                    <circle cx="150" cy="90" r="20" fill="#333" opacity="0.9"/>
                                    <text x="150" y="95" textAnchor="middle" fill="white" fontSize="16">5</text>
                                    
                                    <circle cx="50" cy="180" r="15" fill="black" opacity="0.7"/>
                                    <text x="50" y="185" textAnchor="middle" fill="white" fontSize="12">3</text>
                                    
                                    <circle cx="50" cy="30" r="15" fill="black" opacity="0.7"/>
                                    <text x="50" y="35" textAnchor="middle" fill="white" fontSize="12">4</text>
                                    
                                    <circle cx="250" cy="30" r="15" fill="black" opacity="0.7"/>
                                    <text x="250" y="35" textAnchor="middle" fill="white" fontSize="12">1</text>
                                    
                                    <circle cx="250" cy="180" r="15" fill="black" opacity="0.7"/>
                                    <text x="250" y="185" textAnchor="middle" fill="white" fontSize="12">2</text>
                                    
                                    {/* Ruta */}
                                    <path d="M250,30 C200,20 100,20 50,30 C20,40 20,140 50,180 C80,210 200,210 250,180 C280,160 280,50 250,30" 
                                          fill="none" stroke="black" strokeWidth="2" strokeDasharray="5,5"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="md:w-1/2 p-2">
                          <h4 className="text-center font-medium mb-2 bg-blue-500 text-white py-1 rounded">Visibilidade do Painel</h4>
                          <div className="flex justify-center items-center">
                            <div className="relative w-full max-w-xs">
                              <div className="bg-black p-4 rounded-lg">
                                <div className="bg-gradient-to-r from-gray-900 to-black h-32 rounded-lg flex items-center justify-center">
                                  <div className="flex space-x-6">
                                    <div className="relative h-24 w-24 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center">
                                      <div className="absolute inset-0 border-4 border-t-red-500 border-l-blue-500 border-b-blue-500 border-r-blue-500 rounded-full"></div>
                                      <div className="text-white text-2xl font-bold">P</div>
                                    </div>
                                    <div className="relative h-24 w-24 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center">
                                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full"></div>
                                      <div className="text-white text-2xl font-bold">0</div>
                                      <div className="absolute bottom-2 text-white text-xs">km/h</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-800" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-yellow-800">
                          ⚠️ O veículo deve permanecer <strong>ligado</strong> durante toda a gravação.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-4">
                    O vídeo deve ter entre 1 e 3 minutos de duração e não exceder 2GB de tamanho.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-2">
                  Envie o vídeo da inspeção do veículo*
                </label>
                
                <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  {!formData.videoFile ? (
                    <div 
                      className="flex flex-col items-center justify-center"
                      onClick={() => handleUploadClick(videoFileRef)}
                    >
                      <svg className="w-12 h-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                      <span className="text-blue-600 font-medium">Arraste e solte seu vídeo aqui</span>
                      <span className="text-gray-500 text-sm mt-1">ou clique para fazer upload</span>
                      
                      <div className="mt-4 flex justify-center">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoRecordClick();
                          }}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm mr-2"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Gravar vídeo
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick(videoFileRef);
                          }}
                          className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <video 
                        src={formData.videoFile} 
                        controls 
                        className="max-h-64 mx-auto"
                      />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        title="Remover vídeo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={videoFileRef}
                  accept="video/*" 
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'video')}
                />
                
                {formErrors.video && (
                  <p className="text-red-500 text-xs mt-2">Por favor, envie o vídeo da inspeção.</p>
                )}
              </div>
            </div>
          </>
        );
      case 6:
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              Confirmação e Envio
            </h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-green-800">
                      Você completou todas as informações necessárias. Por favor, revise os dados antes de enviar.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Informações Gerais</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Nome do titular</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.name || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.email || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Celular</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.phone || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Placa</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.licensePlate || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Quilometragem</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.mileage ? `${formData.mileage} km` : '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ano Modelo</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.modelYear || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Características do Veículo</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="grid grid-cols-1 gap-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Condições do veículo</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.conditions.length > 0 ? 
                          (formData.conditions.includes('nenhum') ? 
                            'Nenhuma das opções' : 
                            formData.conditions.map(c => {
                              const option = [
                                { id: 'roubo', label: 'Histórico de roubo e furto' },
                                { id: 'blindado', label: 'É blindado' },
                                { id: 'gas', label: 'Tem Kit gás (GNV)' },
                                { id: 'dano', label: 'Dano estrutural' },
                                { id: 'leilao', label: 'Já teve passagem por leilão' },
                                { id: 'batida', label: 'Já teve batida' },
                                { id: 'modificacao', label: 'Possui modificação na estrutura' },
                                { id: 'rebaixado', label: 'Rebaixado' },
                                { id: 'performance', label: 'Alterações de performance (escape, remap, etc.)' }
                              ].find(item => item.id === c);
                              return option ? option.label : c;
                            }).join(', ')) : 
                          '-'
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Itens de segurança</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.safetyItems.length > 0 ? 
                          (formData.safetyItems.includes('nenhum') ? 
                            'Não possui nenhum dos itens' : 
                            formData.safetyItems.map(s => {
                              const option = [
                                { id: 'chave', label: 'Chave de roda' },
                                { id: 'estepe', label: 'Estepe' },
                                { id: 'triangulo', label: 'Triângulo' },
                                { id: 'macaco', label: 'Macaco' }
                              ].find(item => item.id === s);
                              return option ? option.label : s;
                            }).join(', ')) : 
                          '-'
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado do ar-condicionado</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.acWorking === 'sim' ? 'Funcionando corretamente' : 
                         formData.acWorking === 'nao' ? 'Não está funcionando' : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Para-brisa</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.hasWindshieldDamage === 'sim' ? 'Apresenta avarias' : 
                         formData.hasWindshieldDamage === 'nao' ? 'Sem avarias' : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Faróis/Lanternas/Retrovisores</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.hasLightsDamage === 'sim' ? 'Apresentam danos' : 
                         formData.hasLightsDamage === 'nao' ? 'Sem danos' : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pneus</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.hasTireDamage === 'sim' ? 'Apresentam problemas' : 
                         formData.hasTireDamage === 'nao' ? 'Em bom estado' : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sistema de som/multimídia</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.isOriginalSoundSystem === 'sim' ? 'Original do veículo' : 
                         formData.isOriginalSoundSystem === 'nao' ? 'Não é original' : '-'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Fotos e Vídeo</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">CRLV</p>
                      <div className="bg-gray-200 aspect-video rounded-md flex items-center justify-center overflow-hidden">
                        {formData.crlvFile ? (
                          <img src={formData.crlvFile} alt="CRLV" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                    {formData.safetyItems.length > 0 && !formData.safetyItems.includes('nenhum') && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Itens de segurança</p>
                        <div className="bg-gray-200 aspect-video rounded-md flex items-center justify-center overflow-hidden">
                          {formData.safetyItemsFile ? (
                            <img src={formData.safetyItemsFile} alt="Itens de segurança" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    {(formData.hasWindshieldDamage === 'sim' || 
                      formData.hasLightsDamage === 'sim' || 
                      formData.hasTireDamage === 'sim') && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Fotos de danos</p>
                        <div className="bg-gray-200 aspect-video rounded-md flex items-center justify-center overflow-hidden">
                          {formData.windshieldDamagePhoto ? (
                            <img src={formData.windshieldDamagePhoto} alt="Fotos de danos no para-brisa" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Vídeo</p>
                      <div className="bg-gray-200 aspect-video rounded-md flex items-center justify-center overflow-hidden">
                        {formData.videoFile ? (
                          <video 
                            src={formData.videoFile} 
                            controls 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                {submitting ? (
                  <div className="space-y-4">
                    {/* Barra de Progreso Principal */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Información del Progreso */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">
                        {uploadStep}
                      </span>
                      <span className="text-sm font-medium text-blue-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    
                    {/* Indicadores de Archivos */}
                    {Object.keys(uploadingFiles).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(uploadingFiles).map(([fileKey, isUploading]) => (
                          <div key={fileKey} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isUploading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                            <span className="text-xs text-gray-600">
                              {fileKey === 'videoFile' ? '📹 Video' : '📷 Imagen'} - {isUploading ? 'Subiendo...' : 'Completado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mensaje de No Salir */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <span className="text-sm text-yellow-800 font-medium">
                          Por favor, não feche esta página. O envio está em progresso...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    <span>Enviar inspeção</span>
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </>
        );
      case 7:
        return (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-blue-800">
                Inspeção Concluída!
              </h2>
              
              <div className="flex justify-center my-6">
                <div className="rounded-full bg-blue-100 p-6">
                  <svg className="w-20 h-20 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4">
                Recebemos seus dados!
              </h3>
              
              <p className="text-lg mb-3">
                Em breve enviaremos a pré-oferta para o seu veículo.
              </p>
              
              <p className="text-gray-600 mb-6">
                Nossa equipe está analisando as informações fornecidas e<br />
                entrará em contato através do email ou telefone informados.
              </p>

              <div className="flex flex-col items-center justify-center gap-2 mb-8 text-gray-600">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span><strong>WhatsApp:</strong> 11 3230-3881</span>
                </p>
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.82 17.12l-1.97-1.97a1.49 1.49 0 00-2.12 0l-2.62 2.62-.28-.15c-.9-.45-2.11-1.05-3.38-2.32-1.27-1.27-1.87-2.48-2.32-3.38l-.15-.28 1.76-1.76.86-.86c.58-.58.58-1.53 0-2.12L6.63 5.01c-.58-.58-1.54-.58-2.12 0L2.89 6.63c-.14.14-.24.31-.3.5-.12.38-.31 1.46.28 3.3.76 2.34 2.17 4.31 4.39 6.53 3.55 3.55 6.75 4.54 7.83 4.54.35 0 .57-.06.67-.09.19-.06.36-.16.5-.3l1.62-1.61c.58-.58.58-1.53 0-2.12z" />
                  </svg>
                  <span><strong>Ligação:</strong> (11) 4858-9021</span>
                </p>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setFormSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      licensePlate: '',
                      mileage: '',
                      modelYear: '',
                      hasChassisNumber: '',
                      hasSecondKey: '',
                      crlvFile: null,
                      conditions: [],
                      safetyItems: [],
                      acWorking: '',
                      hasWindshieldDamage: '',
                      hasLightsDamage: '',
                      hasTireDamage: '',
                      isOriginalSoundSystem: '',
                      safetyItemsFile: null,
                      windshieldDamagePhoto: null,
                      lightsDamagePhoto: null,
                      tireDamagePhoto: null,
                      videoFile: null,
                      termsAccepted: false
                    });
                    setFormErrors({});
                    setUploadedFiles({});
                    window.scrollTo(0, 0);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Iniciar Nova Inspeção
                </button>
              </div>
            </div>
          </>
        );
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-medium text-blue-800 mb-4">Formulário em construção</h2>
            <p>Esta parte do formulário estará disponível em breve.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex justify-center mb-8">
          <img 
            src="/images/KAVAK_LOGO_MAIN_BLACK.png" 
            alt="Kavak Logo" 
            className="h-12 md:h-16" 
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-blue-600 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          {renderFormStep()}

          {/* Mostrar botones de navegación en pasos 1-5, no en el paso 6 (confirmación) ni en el 7 (final) */}
          {currentStep >= 1 && currentStep <= 5 && (
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  className="border border-gray-300 bg-white text-gray-700 font-medium py-2.5 px-5 rounded-md transition-all duration-200 hover:bg-gray-50 flex items-center"
                  onClick={handlePrevious}
                >
                  <span className="mr-2">←</span>
                  Voltar
                </button>
              )}
              
              <div className={currentStep > 1 ? "ml-auto" : ""}>
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 px-5 rounded-md transition-all duration-200 hover:shadow-lg flex items-center"
                  onClick={handleNext}
                >
                  {currentStep === 1 ? "Começar" : "Próximo"}
                  <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Mostrar solo el botón "Voltar" en el paso 6 (confirmación) */}
          {currentStep === 6 && (
            <div className="mt-8">
              <button
                className="border border-gray-300 bg-white text-gray-700 font-medium py-2.5 px-5 rounded-md transition-all duration-200 hover:bg-gray-50 flex items-center"
                onClick={handlePrevious}
              >
                <span className="mr-2">←</span>
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 