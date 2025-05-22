"use client"

import { useState, useEffect } from "react"
import { Formik, FormikProps } from "formik"
import * as Yup from "yup"
import PasoIntroduccion from "./pasos/paso-introduccion"
import PasoInformacionGeneral from "./pasos/paso-informacion-general"
import PasoCondicionVehiculo from "./pasos/paso-condicion-vehiculo"
import PasoVideo from "./pasos/paso-video"
import PasoConfirmacion from "./pasos/paso-confirmacion"
import PasoAgradecimiento from "./pasos/paso-agradecimiento"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

// Tipos
interface FormValues {
  // Información general
  ownerName: string;
  email: string;
  phone: string;
  licensePlate: string;
  currentKm: string | number;
  modelYear: string | number;
  hasChassisNumber: string;
  hasSecondKey: string;
  crlvPhoto: File | null;
  crlvPhotoUrl: string;
  
  // Condición del vehículo
  vehicleConditions: string[];
  conditionDescription: string;
  safetyItems: string[];
  safetyItemsPhoto: File | null;
  safetyItemsPhotoUrl: string;
  hasAirConditioner: string;
  hasWindshieldDamage: string;
  windshieldPhoto: File | null;
  windshieldPhotoUrl: string;
  hasLightsDamage: string;
  lightsPhoto: File | null;
  lightsPhotoUrl: string;
  hasTiresDamage: string;
  tiresPhoto: File | null;
  tiresPhotoUrl: string;
  hasOriginalSoundSystem: string;
  
  // Video
  videoFile: File | null;
  videoFileUrl: string;
  videoBlob?: Blob;
  
  [key: string]: any; // Para permitir acceso dinámico
}

// Definir los pasos del formulario
const PASOS = ["introduccion", "informacion-general", "condicion-vehiculo", "video", "confirmacion", "agradecimiento"]

// Esquema de validación para cada paso
const esquemaValidacion = {
  "informacion-general": Yup.object({
    ownerName: Yup.string().required("Nome do titular é obrigatório"),
    email: Yup.string().email("Email inválido").required("Email é obrigatório"),
    phone: Yup.string().required("Celular é obrigatório"),
    licensePlate: Yup.string().required("Placa é obrigatória"),
    currentKm: Yup.number().required("Quilometragem atual é obrigatória").min(0, "Quilometragem deve ser maior que 0"),
    modelYear: Yup.number()
      .required("Ano do modelo é obrigatório")
      .min(1900, "Ano deve ser maior que 1900")
      .max(new Date().getFullYear(), `Ano deve ser menor que ${new Date().getFullYear() + 1}`),
    hasChassisNumber: Yup.string().required("Este campo é obrigatório"),
    hasSecondKey: Yup.string().required("Este campo é obrigatório"),
    crlvPhoto: Yup.mixed().required("Foto do CRLV é obrigatória"),
  }),
  "condicion-vehiculo": Yup.object({
    vehicleConditions: Yup.array().min(1, "Selecione pelo menos uma opção"),
    conditionDescription: Yup.string().when("vehicleConditions", {
      is: (conditions: string[]) => conditions.length > 0 && !conditions.includes("none"),
      then: () => Yup.string().required("Descrição é obrigatória quando alguma condição for selecionada"),
      otherwise: () => Yup.string().notRequired(),
    }),
    safetyItems: Yup.array().min(1, "Selecione pelo menos um item de segurança"),
    safetyItemsPhoto: Yup.mixed().when("safetyItems", {
      is: (items: string[]) => items.length > 0 && !items.includes("none"),
      then: () => Yup.mixed().required("Foto dos itens de segurança é obrigatória"),
      otherwise: () => Yup.mixed().notRequired(),
    }),
    hasAirConditioner: Yup.string().required("Este campo é obrigatório"),
    hasWindshieldDamage: Yup.string().required("Este campo é obrigatório"),
    windshieldPhoto: Yup.mixed().when("hasWindshieldDamage", {
      is: "sim",
      then: () => Yup.mixed().required("Foto do para-brisa é obrigatória"),
      otherwise: () => Yup.mixed().notRequired(),
    }),
    hasLightsDamage: Yup.string().required("Este campo é obrigatório"),
    lightsPhoto: Yup.mixed().when("hasLightsDamage", {
      is: "sim",
      then: () => Yup.mixed().required("Foto dos faróis/lanternas é obrigatória"),
      otherwise: () => Yup.mixed().notRequired(),
    }),
    hasTiresDamage: Yup.string().required("Este campo é obrigatório"),
    tiresPhoto: Yup.mixed().when("hasTiresDamage", {
      is: "sim",
      then: () => Yup.mixed().required("Foto dos pneus é obrigatória"),
      otherwise: () => Yup.mixed().notRequired(),
    }),
    hasOriginalSoundSystem: Yup.string().required("Este campo é obrigatório"),
  }),
  video: Yup.object({
    videoFile: Yup.mixed().required("O vídeo é obrigatório"),
  }),
}

export default function InspeccionVehiculo() {
  // Estado para el paso actual
  const [pasoActual, setPasoActual] = useState(0)

  // Estado para el progreso
  const [progreso, setProgreso] = useState(0)

  // Estado para errores
  const [error, setError] = useState("")

  // Estado para indicar si se está enviando el formulario
  const [enviando, setEnviando] = useState(false)

  // Estado para la dirección de la transición
  const [direction, setDirection] = useState(0)

  // Estado para los datos del formulario
  const [datosFormulario, setDatosFormulario] = useState<FormValues>({
    // Información general
    ownerName: "",
    email: "",
    phone: "",
    licensePlate: "",
    currentKm: "",
    modelYear: "",
    hasChassisNumber: "",
    hasSecondKey: "",
    crlvPhoto: null,
    crlvPhotoUrl: "",

    // Condición del vehículo
    vehicleConditions: [] as string[],
    conditionDescription: "",
    safetyItems: [] as string[],
    safetyItemsPhoto: null,
    safetyItemsPhotoUrl: "",
    hasAirConditioner: "",
    hasWindshieldDamage: "",
    windshieldPhoto: null,
    windshieldPhotoUrl: "",
    hasLightsDamage: "",
    lightsPhoto: null,
    lightsPhotoUrl: "",
    hasTiresDamage: "",
    tiresPhoto: null,
    tiresPhotoUrl: "",
    hasOriginalSoundSystem: "",

    // Video
    videoFile: null,
    videoFileUrl: "",
    videoBlob: undefined,
  })

  // Tema
  const { theme } = useTheme()

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const datosGuardados = localStorage.getItem("inspeccionVehicular")
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados)
        // No restauramos archivos ya que no se pueden serializar
        const {
          crlvPhoto,
          crlvPhotoUrl,
          safetyItemsPhoto,
          safetyItemsPhotoUrl,
          windshieldPhoto,
          windshieldPhotoUrl,
          lightsPhoto,
          lightsPhotoUrl,
          tiresPhoto,
          tiresPhotoUrl,
          videoFile,
          videoFileUrl,
          videoBlob,
          ...restoDeLosDatos
        } = datos

        setDatosFormulario((prevState) => ({
          ...prevState,
          ...restoDeLosDatos,
          // Conservamos las URLs para la visualización
          // Pero tendrán que ser regeneradas si son necesarias para mostrar imágenes
          crlvPhotoUrl: prevState.crlvPhoto ? URL.createObjectURL(prevState.crlvPhoto) : crlvPhotoUrl,
          safetyItemsPhotoUrl: prevState.safetyItemsPhoto ? URL.createObjectURL(prevState.safetyItemsPhoto) : safetyItemsPhotoUrl,
          windshieldPhotoUrl: prevState.windshieldPhoto ? URL.createObjectURL(prevState.windshieldPhoto) : windshieldPhotoUrl,
          lightsPhotoUrl: prevState.lightsPhoto ? URL.createObjectURL(prevState.lightsPhoto) : lightsPhotoUrl,
          tiresPhotoUrl: prevState.tiresPhoto ? URL.createObjectURL(prevState.tiresPhoto) : tiresPhotoUrl,
          videoFileUrl: prevState.videoFile ? URL.createObjectURL(prevState.videoFile) : videoFileUrl,
        }))

        // Restaurar el paso actual
        const pasoGuardado = localStorage.getItem("pasoActualInspeccion")
        if (pasoGuardado) {
          const paso = Number.parseInt(pasoGuardado)
          setPasoActual(paso)
          actualizarProgreso(paso)
          
          // Regenerar URLs si estamos en la confirmación
          if (PASOS[paso] === "confirmacion") {
            setTimeout(regenerarURLsDeObjetos, 100);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos guardados:", error)
      }
    }
  }, [])

  // Guardar datos cuando cambian
  useEffect(() => {
    // No guardamos archivos ya que no se pueden serializar
    const {
      crlvPhoto,
      safetyItemsPhoto,
      windshieldPhoto,
      lightsPhoto,
      tiresPhoto,
      videoFile,
      videoBlob,
      ...datosParaGuardar
    } = datosFormulario

    localStorage.setItem("inspeccionVehicular", JSON.stringify(datosParaGuardar))
    localStorage.setItem("pasoActualInspeccion", pasoActual.toString())
  }, [datosFormulario, pasoActual])

  // Función para actualizar el progreso
  const actualizarProgreso = (paso: number) => {
    const porcentaje = (paso / (PASOS.length - 1)) * 100
    setProgreso(porcentaje)
  }

  // Función para recrear las URLs de objetos al navegar entre pasos
  const regenerarURLsDeObjetos = () => {
    // Solo recreamos las URLs si los archivos existen pero las URLs están vacías o inválidas
    try {
      if (datosFormulario.crlvPhoto && (!datosFormulario.crlvPhotoUrl || !datosFormulario.crlvPhotoUrl.startsWith('blob:'))) {
        datosFormulario.crlvPhotoUrl = URL.createObjectURL(datosFormulario.crlvPhoto);
      }
      
      if (datosFormulario.safetyItemsPhoto && (!datosFormulario.safetyItemsPhotoUrl || !datosFormulario.safetyItemsPhotoUrl.startsWith('blob:'))) {
        datosFormulario.safetyItemsPhotoUrl = URL.createObjectURL(datosFormulario.safetyItemsPhoto);
      }
      
      if (datosFormulario.windshieldPhoto && (!datosFormulario.windshieldPhotoUrl || !datosFormulario.windshieldPhotoUrl.startsWith('blob:'))) {
        datosFormulario.windshieldPhotoUrl = URL.createObjectURL(datosFormulario.windshieldPhoto);
      }
      
      if (datosFormulario.lightsPhoto && (!datosFormulario.lightsPhotoUrl || !datosFormulario.lightsPhotoUrl.startsWith('blob:'))) {
        datosFormulario.lightsPhotoUrl = URL.createObjectURL(datosFormulario.lightsPhoto);
      }
      
      if (datosFormulario.tiresPhoto && (!datosFormulario.tiresPhotoUrl || !datosFormulario.tiresPhotoUrl.startsWith('blob:'))) {
        datosFormulario.tiresPhotoUrl = URL.createObjectURL(datosFormulario.tiresPhoto);
      }
      
      if (datosFormulario.videoFile && (!datosFormulario.videoFileUrl || !datosFormulario.videoFileUrl.startsWith('blob:'))) {
        datosFormulario.videoFileUrl = URL.createObjectURL(datosFormulario.videoFile);
      }
    } catch (error) {
      console.error("Error al regenerar URLs de objetos:", error);
    }
  }

  // Función para actualizar los datos del formulario
  const actualizarDatos = (datos: Partial<FormValues>) => {
    setDatosFormulario((prevState) => ({
      ...prevState,
      ...datos,
    }))

    // Forzar una actualización de la interfaz de usuario
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 100)
  }

  // Función para avanzar al siguiente paso
  const siguientePaso = () => {
    if (pasoActual < PASOS.length - 1) {
      // Regenerar URLs de objetos antes de avanzar
      regenerarURLsDeObjetos();
      
      // Guardar explícitamente en localStorage antes de avanzar
      const {
        crlvPhoto,
        safetyItemsPhoto,
        windshieldPhoto,
        lightsPhoto,
        tiresPhoto,
        videoFile,
        videoBlob,
        ...datosParaGuardar
      } = datosFormulario

      localStorage.setItem("inspeccionVehicular", JSON.stringify(datosParaGuardar))
      localStorage.setItem("pasoActualInspeccion", (pasoActual + 1).toString())

      setDirection(1) // Avanzando
      const nuevoPaso = pasoActual + 1
      setPasoActual(nuevoPaso)
      actualizarProgreso(nuevoPaso)
      window.scrollTo(0, 0)
    }
  }

  // Función para retroceder al paso anterior
  const pasoAnterior = () => {
    if (pasoActual > 0) {
      // Regenerar URLs de objetos antes de retroceder
      regenerarURLsDeObjetos();
      
      setDirection(-1) // Retrocediendo
      const nuevoPaso = pasoActual - 1
      setPasoActual(nuevoPaso)
      actualizarProgreso(nuevoPaso)
      window.scrollTo(0, 0)
    }
  }

  // Función para manejar el envío del formulario
  const manejarEnvio = async () => {
    setEnviando(true)
    setError("")

    try {
      // 1. POST /submit para obtener presigned URLs
      const requiredFiles = [
        'crlvPhoto',
        'safetyItemsPhoto',
        // Solo incluir fotos de daños si el usuario indicó que existen (hasXDamage === 'sim')
        ...(datosFormulario.hasWindshieldDamage === 'sim' ? ['windshieldPhoto'] : []),
        ...(datosFormulario.hasLightsDamage === 'sim' ? ['lightsPhoto'] : []),
        ...(datosFormulario.hasTiresDamage === 'sim' ? ['tiresPhoto'] : []),
        'videoFile'
      ];
      
      console.log("[DEBUG] Archivos a subir:", requiredFiles);
      console.log("[DEBUG] Estado de daños:", {
        parabrisa: datosFormulario.hasWindshieldDamage,
        luces: datosFormulario.hasLightsDamage,
        neumaticos: datosFormulario.hasTiresDamage
      });
      
      const body = {
        email: datosFormulario.email,
        answers: datosFormulario,
        requiredFiles
      };
      
      // Usar el puerto correcto para el backend (3005)
      const resp = await fetch('http://localhost:3005/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!resp.ok) throw new Error('Error al crear inspección');
      const { id, uploadUrls } = await resp.json();
      console.log("[DEBUG] URLs obtenidas para archivos:", Object.keys(uploadUrls));

      // 2. Subir cada archivo a S3 y guardar la URL pública
      const s3Urls: Record<string, string> = {};
      const fileMap: Record<string, File | null> = {
        crlvPhoto: datosFormulario.crlvPhoto,
        safetyItemsPhoto: datosFormulario.safetyItemsPhoto,
        windshieldPhoto: datosFormulario.windshieldPhoto,
        lightsPhoto: datosFormulario.lightsPhoto,
        tiresPhoto: datosFormulario.tiresPhoto,
        videoFile: datosFormulario.videoFile
      };
      
      for (const key of requiredFiles) {
        const file = fileMap[key];
        const presignedUrl = uploadUrls[key];
        
        if (file && presignedUrl) {
          console.log(`[DEBUG] Subiendo archivo ${key}...`);
          const uploadResp = await fetch(presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': key === 'videoFile' ? 'video/mp4' : 'image/jpeg' },
            body: file
          });
          
          if (!uploadResp.ok) {
            console.error(`[ERROR] Fallo al subir ${key}:`, uploadResp.status, uploadResp.statusText);
            throw new Error(`Error al subir ${key}`);
          }
          
          // Guardar la URL pública (sin query params)
          s3Urls[`${key}Url`] = presignedUrl.split('?')[0];
          console.log(`[DEBUG] Archivo ${key} subido correctamente`);
        } else {
          console.warn(`[WARN] No se pudo subir ${key}, archivo o URL no disponible`);
        }
      }
      
      // 3. Enviar los datos finales al backend, incluyendo las URLs públicas
      const finalData = {
        id,
        ...datosFormulario,
        ...s3Urls
      };
      
      console.log("[DEBUG] Enviando datos finales al backend");
      // Usar el puerto correcto para el backend (3005)
      const finalResp = await fetch('http://localhost:3005/submit/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      if (!finalResp.ok) {
        const errorData = await finalResp.json();
        throw new Error(errorData.message || 'Error al guardar la inspección');
      }
      
      // 4. Mostrar agradecimiento
      console.log("[DEBUG] Formulario enviado exitosamente");
      siguientePaso();
    } catch (error: any) {
      console.error("Error al enviar el formulario:", error)
      setError(error.message || "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  // Limpiar URLs de objetos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpiar todas las URLs de objetos
      if (datosFormulario.crlvPhotoUrl) URL.revokeObjectURL(datosFormulario.crlvPhotoUrl)
      if (datosFormulario.safetyItemsPhotoUrl) URL.revokeObjectURL(datosFormulario.safetyItemsPhotoUrl)
      if (datosFormulario.windshieldPhotoUrl) URL.revokeObjectURL(datosFormulario.windshieldPhotoUrl)
      if (datosFormulario.lightsPhotoUrl) URL.revokeObjectURL(datosFormulario.lightsPhotoUrl)
      if (datosFormulario.tiresPhotoUrl) URL.revokeObjectURL(datosFormulario.tiresPhotoUrl)
      if (datosFormulario.videoFileUrl) URL.revokeObjectURL(datosFormulario.videoFileUrl)
    }
  }, [datosFormulario])

  // Función para reiniciar el formulario
  const reiniciarFormulario = () => {
    // Limpiar todas las URLs de objetos
    if (datosFormulario.crlvPhotoUrl) URL.revokeObjectURL(datosFormulario.crlvPhotoUrl)
    if (datosFormulario.safetyItemsPhotoUrl) URL.revokeObjectURL(datosFormulario.safetyItemsPhotoUrl)
    if (datosFormulario.windshieldPhotoUrl) URL.revokeObjectURL(datosFormulario.windshieldPhotoUrl)
    if (datosFormulario.lightsPhotoUrl) URL.revokeObjectURL(datosFormulario.lightsPhotoUrl)
    if (datosFormulario.tiresPhotoUrl) URL.revokeObjectURL(datosFormulario.tiresPhotoUrl)
    if (datosFormulario.videoFileUrl) URL.revokeObjectURL(datosFormulario.videoFileUrl)

    localStorage.removeItem("inspeccionVehicular")
    localStorage.removeItem("pasoActualInspeccion")
    setDatosFormulario({
      // Información general
      ownerName: "",
      email: "",
      phone: "",
      licensePlate: "",
      currentKm: "",
      modelYear: "",
      hasChassisNumber: "",
      hasSecondKey: "",
      crlvPhoto: null,
      crlvPhotoUrl: "",

      // Condición del vehículo
      vehicleConditions: [],
      conditionDescription: "",
      safetyItems: [],
      safetyItemsPhoto: null,
      safetyItemsPhotoUrl: "",
      hasAirConditioner: "",
      hasWindshieldDamage: "",
      windshieldPhoto: null,
      windshieldPhotoUrl: "",
      hasLightsDamage: "",
      lightsPhoto: null,
      lightsPhotoUrl: "",
      hasTiresDamage: "",
      tiresPhoto: null,
      tiresPhotoUrl: "",
      hasOriginalSoundSystem: "",

      // Video
      videoFile: null,
      videoFileUrl: "",
      videoBlob: undefined,
    })

    setPasoActual(0)
    setProgreso(0)
  }

  // Renderizar el paso actual
  const renderizarPaso = () => {
    switch (PASOS[pasoActual]) {
      case "introduccion":
        return <PasoIntroduccion onNext={siguientePaso} />
      case "informacion-general":
        return (
          <Formik
            initialValues={datosFormulario}
            validationSchema={esquemaValidacion["informacion-general"]}
            onSubmit={(values: FormValues) => {
              actualizarDatos(values)
              siguientePaso()
            }}
            enableReinitialize
          >
            {(formikProps: FormikProps<FormValues>) => (
              <PasoInformacionGeneral
                formik={formikProps}
                onPrevious={pasoAnterior}
                actualizarDatos={actualizarDatos}
              />
            )}
          </Formik>
        )
      case "condicion-vehiculo":
        return (
          <Formik
            initialValues={datosFormulario}
            validationSchema={esquemaValidacion["condicion-vehiculo"]}
            onSubmit={(values: FormValues) => {
              actualizarDatos(values)
              siguientePaso()
            }}
            enableReinitialize
          >
            {(formikProps: FormikProps<FormValues>) => (
              <PasoCondicionVehiculo formik={formikProps} onPrevious={pasoAnterior} actualizarDatos={actualizarDatos} />
            )}
          </Formik>
        )
      case "video":
        return (
          <Formik
            initialValues={datosFormulario}
            validationSchema={esquemaValidacion.video}
            onSubmit={(values: FormValues) => {
              actualizarDatos(values)
              siguientePaso()
            }}
            enableReinitialize
          >
            {(formikProps: FormikProps<FormValues>) => (
              <PasoVideo formik={formikProps} onPrevious={pasoAnterior} actualizarDatos={actualizarDatos} />
            )}
          </Formik>
        )
      case "confirmacion":
        return (
          <PasoConfirmacion
            datosFormulario={datosFormulario}
            onSubmit={manejarEnvio}
            onPrevious={pasoAnterior}
            enviando={enviando}
            error={error}
          />
        )
      case "agradecimiento":
        return <PasoAgradecimiento onReiniciar={reiniciarFormulario} />
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex justify-center mb-8">
          <img src="/images/KAVAK_LOGO_MAIN_BLACK.png" alt="Kavak Logo" className="h-12 md:h-16" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span>Progresso</span>
            <span>{Math.round(progreso)}%</span>
          </div>
          <Progress value={progreso} className="h-2" />
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={pasoActual}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            data-step={pasoActual + 1}
          >
            {renderizarPaso()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
