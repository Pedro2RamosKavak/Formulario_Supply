"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, ArrowLeft, Info, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UploadProgressBar from "@/components/UploadProgressBar"

interface PasoConfirmacionProps {
  datosFormulario: any
  onSubmit: () => void
  onPrevious: () => void
  enviando: boolean
  error: string
}

export default function PasoConfirmacion({
  datosFormulario,
  onSubmit,
  onPrevious,
  enviando: propEnviando,
  error: propError,
}: PasoConfirmacionProps) {
  const [enviando, setEnviando] = useState(propEnviando)
  const [error, setError] = useState<string | null>(propError || null)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [usarMetodoAlternativo, setUsarMetodoAlternativo] = useState(false)
  const [intentos, setIntentos] = useState(0)
  const [comprimiendo, setComprimiendo] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingStage, setUploadingStage] = useState("")
  const [imagenes, setImagenes] = useState({
    crlvPhotoUrl: datosFormulario.crlvPhotoUrl || '',
    safetyItemsPhotoUrl: datosFormulario.safetyItemsPhotoUrl || '',
    windshieldPhotoUrl: datosFormulario.windshieldPhotoUrl || '',
    lightsPhotoUrl: datosFormulario.lightsPhotoUrl || '',
    tiresPhotoUrl: datosFormulario.tiresPhotoUrl || '',
    videoFileUrl: datosFormulario.videoFileUrl || '',
  });

  // Verificar que no haya ninguna referencia a Zapier ni Cloudinary.

  useEffect(() => {
    // Verificar si hay una URL de webhook configurada
    if (!process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL) {
      console.warn("No se ha configurado la URL del webhook de Zapier")
    }
  }, [])
  
  // Regenerar URLs de objetos cuando se monta el componente
  useEffect(() => {
    const regenerarURLs = () => {
      try {
        // Crear copias de las URLs para evitar modificar directamente el estado
        const nuevasURLs = { ...imagenes };
        
        // Regenerar URLs si tenemos los archivos originales
        if (datosFormulario.crlvPhoto) {
          nuevasURLs.crlvPhotoUrl = URL.createObjectURL(datosFormulario.crlvPhoto);
        }
        
        if (datosFormulario.safetyItemsPhoto) {
          nuevasURLs.safetyItemsPhotoUrl = URL.createObjectURL(datosFormulario.safetyItemsPhoto);
        }
        
        if (datosFormulario.windshieldPhoto) {
          nuevasURLs.windshieldPhotoUrl = URL.createObjectURL(datosFormulario.windshieldPhoto);
        }
        
        if (datosFormulario.lightsPhoto) {
          nuevasURLs.lightsPhotoUrl = URL.createObjectURL(datosFormulario.lightsPhoto);
        }
        
        if (datosFormulario.tiresPhoto) {
          nuevasURLs.tiresPhotoUrl = URL.createObjectURL(datosFormulario.tiresPhoto);
        }
        
        if (datosFormulario.videoFile) {
          nuevasURLs.videoFileUrl = URL.createObjectURL(datosFormulario.videoFile);
        }
        
        setImagenes(nuevasURLs);
      } catch (error) {
        console.error("Error al regenerar URLs en confirmación:", error);
      }
    };
    
    regenerarURLs();
    
    // Limpiar URLs al desmontar
    return () => {
      Object.values(imagenes).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error("Error al revocar URL:", e);
          }
        }
      });
    };
  }, []);

  // Función para guardar la inspección en localStorage
  const guardarInspeccionEnLocalStorage = (id: string, datos: any) => {
    try {
      // Recuperar inspecciones existentes
      const inspecciones = localStorage.getItem('inspecciones');
      let listaInspecciones = inspecciones ? JSON.parse(inspecciones) : [];
      
      // Asegurarnos de que todas las URLs estén incluidas
      const inspectionData = {
        ...datos,
        id,
        crlvPhotoUrl: datos.crlvPhotoUrl || "",
        safetyItemsPhotoUrl: datos.safetyItemsPhotoUrl || "",
        windshieldPhotoUrl: datos.windshieldPhotoUrl || "",
        lightsPhotoUrl: datos.lightsPhotoUrl || "",
        tiresPhotoUrl: datos.tiresPhotoUrl || "",
        videoFileUrl: datos.videoFileUrl || ""
      };
      
      // Verificar si ya existe una inspección con este ID
      const index = listaInspecciones.findIndex((insp: any) => insp.id === id);
      
      if (index >= 0) {
        // Actualizar la inspección existente
        listaInspecciones[index] = inspectionData;
      } else {
        // Agregar la nueva inspección
        listaInspecciones.push(inspectionData);
      }
      
      // Guardar la lista actualizada
      localStorage.setItem('inspecciones', JSON.stringify(listaInspecciones));
      console.log(`Inspección ${id} guardada en localStorage`);
    } catch (error) {
      console.error("Error al guardar la inspección en localStorage:", error);
    }
  };

  const mapConditionToText = (condition: string): string => {
    const conditionMap: { [key: string]: string } = {
      theft: "Possui histórico de roubo e furto",
      armored: "É blindado",
      gas: "Tem Kit gás (GNV)",
      structural: "Dano estrutural",
      auction: "Já teve passagem por leilão",
      crash: "Já teve batida",
      modified: "Possui modificação na estrutura",
      lowered: "Rebaixado",
      performance: "Possui alguma alteração de performance",
      none: "Nenhuma das opções",
    }
    return conditionMap[condition] || condition
  }

  const mapSafetyItemToText = (item: string): string => {
    const itemMap: { [key: string]: string } = {
      wrench: "Chave de roda",
      spare: "Estepe",
      triangle: "Triângulo",
    }
    return itemMap[item] || item
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-black text-white p-6">
        <CardTitle className="text-2xl font-bold">✅ Revisar e Enviar</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col">
                <span>{error}</span>
                {intentos > 0 && (
                  <span className="text-sm mt-1">
                    Tentativa {intentos} de 3. {intentos >= 2 ? "Tente usar o método alternativo." : ""}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <h4 className="font-medium">Informações Pessoais</h4>
              </div>
              <div className="divide-y">
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Nome do titular:</span>
                  <span className="font-medium">{datosFormulario.ownerName}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{datosFormulario.email}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Celular:</span>
                  <span className="font-medium">{datosFormulario.phone}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <h4 className="font-medium">Informações do Veículo</h4>
              </div>
              <div className="divide-y">
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Placa:</span>
                  <span className="font-medium">{datosFormulario.licensePlate}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Quilometragem:</span>
                  <span className="font-medium">{datosFormulario.currentKm} km</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Ano do modelo:</span>
                  <span className="font-medium">{datosFormulario.modelYear}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Gravação do chassi nos vidros:</span>
                  <span className="font-medium">{datosFormulario.hasChassisNumber === "sim" ? "Sim" : "Não"}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Segunda chave:</span>
                  <span className="font-medium">{datosFormulario.hasSecondKey === "sim" ? "Sim" : "Não"}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <h4 className="font-medium">Condição do Veículo</h4>
              </div>
              <div className="divide-y">
                <div className="p-4">
                  <span className="text-gray-500 block mb-2">Características do veículo:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {datosFormulario.vehicleConditions.includes("none") ? (
                      <li>Nenhuma das opções</li>
                    ) : (
                      datosFormulario.vehicleConditions.map((condition: string) => (
                        <li key={condition}>{mapConditionToText(condition)}</li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="p-4">
                  <span className="text-gray-500 block mb-2">Itens de segurança:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {datosFormulario.safetyItems.map((item: string) => (
                      <li key={item}>{mapSafetyItemToText(item)}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Ar-condicionado funcionando:</span>
                  <span className="font-medium">{datosFormulario.hasAirConditioner === "sim" ? "Sim" : "Não"}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Para-brisa com dano:</span>
                  <span className="font-medium">{datosFormulario.hasWindshieldDamage === "sim" ? "Sim" : "Não"}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Faróis/lanternas com dano:</span>
                  <span className="font-medium">{datosFormulario.hasLightsDamage === "sim" ? "Sim" : "Não"}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Pneus com dano:</span>
                  <span className="font-medium">{datosFormulario.hasTiresDamage === "sim" ? "Sim" : "Não"}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-gray-500">Sistema de som original:</span>
                  <span className="font-medium">
                    {datosFormulario.hasOriginalSoundSystem === "sim" ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <h4 className="font-medium">Fotos e Vídeo</h4>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imagenes.crlvPhotoUrl && (
                  <div>
                    <span className="text-gray-500 block mb-1">CRLV:</span>
                    <img
                      src={imagenes.crlvPhotoUrl}
                      alt="CRLV"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                        target.alt = "Imagem não disponível";
                      }}
                    />
                  </div>
                )}
                {imagenes.safetyItemsPhotoUrl && (
                  <div>
                    <span className="text-gray-500 block mb-1">Itens de segurança:</span>
                    <img
                      src={imagenes.safetyItemsPhotoUrl}
                      alt="Itens de segurança"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                        target.alt = "Imagem não disponível";
                      }}
                    />
                  </div>
                )}
                {imagenes.windshieldPhotoUrl && (
                  <div>
                    <span className="text-gray-500 block mb-1">Para-brisa:</span>
                    <img
                      src={imagenes.windshieldPhotoUrl}
                      alt="Para-brisa"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                        target.alt = "Imagem não disponível";
                      }}
                    />
                  </div>
                )}
                {imagenes.lightsPhotoUrl && (
                  <div>
                    <span className="text-gray-500 block mb-1">Faróis/lanternas:</span>
                    <img
                      src={imagenes.lightsPhotoUrl}
                      alt="Faróis/lanternas"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                        target.alt = "Imagem não disponível";
                      }}
                    />
                  </div>
                )}
                {imagenes.tiresPhotoUrl && (
                  <div>
                    <span className="text-gray-500 block mb-1">Pneus:</span>
                    <img
                      src={imagenes.tiresPhotoUrl}
                      alt="Pneus"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                        target.alt = "Imagem não disponível";
                      }}
                    />
                  </div>
                )}
                {imagenes.videoFileUrl && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block mb-1">Vídeo:</span>
                    <video
                      src={imagenes.videoFileUrl}
                      controls
                      className="w-full h-48 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.onerror = null;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const errorMsg = document.createElement("div");
                          errorMsg.className = "w-full h-48 bg-gray-100 flex items-center justify-center rounded-md";
                          errorMsg.innerHTML = "<span>Vídeo não disponível para visualização</span>";
                          parent.appendChild(errorMsg);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {(enviando || progress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="flex items-center">
                  {comprimiendo ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Comprimindo arquivos...
                    </>
                  ) : (
                    <>
                      {progress < 100 ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      )}
                      Enviando inspeção...
                    </>
                  )}
                </p>
                <p className="font-medium">{progress}%</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {success && (
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Recebemos seus dados! Em breve enviaremos a pré-oferta.
              </AlertDescription>
            </Alert>
          )}

          {intentos > 0 && !success && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm">Problemas ao enviar? Tente o método alternativo.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSubmit}
                className="text-xs"
              >
                {propEnviando ? "Enviando..." : "Enviar Inspeção"}
              </Button>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Antes de enviar</h4>
                <p className="text-sm text-yellow-700">
                  Por favor, revise todas as informações cuidadosamente. Uma vez enviada, não poderá fazer alterações.
                  Nossa equipe revisará sua inspeção e entrará em contato para os próximos passos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={propEnviando}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>

            <Button
              type="button"
              onClick={onSubmit}
              disabled={propEnviando}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {propEnviando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                <>Enviar Inspeção</>
              )}
            </Button>
          </div>
          
          {/* Mensaje informativo y barra de progreso movidos debajo de los botones */}
          {propEnviando && (
            <div className="mt-8 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
              <div className="container mx-auto">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    {success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-blue-800">
                    {success ? "Inspeção enviada com sucesso!" : "Enviando sua inspeção"}
                  </h3>
                </div>
                
                <div className="mb-3">
                  <UploadProgressBar 
                    currentStep={5} 
                    totalSteps={5} 
                    isUploading={isUploading} 
                    uploadText={`${uploadingStage}...`}
                    completeText="Dados enviados com sucesso!"
                  />
                </div>
                
                <div className="text-center">
                  {success ? (
                    <div className="text-green-600 font-medium">
                      ✅ Os dados foram recebidos! Em breve enviaremos a pré-oferta.
                    </div>
                  ) : (
                    <div className="text-blue-800 font-medium">
                      🕒 {Math.round(progress)}% completo
                      <p className="text-sm text-gray-600 mt-1">
                        Os dados foram recebidos. As imagens serão processadas em segundo plano.
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Você já pode continuar, não é necessário esperar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
