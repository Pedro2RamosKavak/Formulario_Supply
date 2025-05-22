"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "../../../../../packages/ui";
import { Inspection } from "../../../../../packages/types";

// Componente Modal para mostrar imágenes ampliadas
function ImageModal({ isOpen, imageUrl, onClose }: { isOpen: boolean; imageUrl: string; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto">
        <button 
          className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img 
          src={imageUrl} 
          alt="Imagem ampliada" 
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
          }}
        />
      </div>
    </div>
  );
}

// Extender interfaz de inspección para este componente
interface EnhancedInspection extends Omit<Inspection, 'answers' | 'email'> {
  name?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  licensePlate?: string;
  modelYear?: string;
  mileage?: string;
  rawFormData?: any;
  answers?: {
    inspectionId?: string;
    ownerName?: string;
    email?: string;
    phone?: string;
    licensePlate?: string;
    modelYear?: string;
    mileage?: string;
    hasChassisNumber?: boolean;
    hasSecondKey?: boolean;
    hasOriginalSoundSystem?: boolean;
    hasAirConditioner?: boolean;
    hasWindshieldDamage?: boolean;
    hasLightsDamage?: boolean;
    hasTiresDamage?: boolean;
    safetyItems?: string[];
    conditions?: string[];
    rawFormData?: any;
    [key: string]: any;
  };
}

// Helper para manejar errores de carga de imágenes
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null; // Evitar bucle infinito
  e.currentTarget.alt = "Error al cargar la imagen";
  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
};

export default function DetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [inspection, setInspection] = useState<EnhancedInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Estados para el modal de imagen
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Función para abrir el modal con una imagen
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const closeImageModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        console.log(`[DEBUG-FRONTEND] Solicitando datos para inspección: ${id}`);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${id}`);
        if (!response.ok) throw new Error("Failed to fetch inspection");
        let data = await response.json();
        
        // Log detallado de los datos recibidos
        console.log('[DEBUG-FRONTEND] Datos recibidos del API:', {
          id: data.id,
          status: data.status, 
          reviewedAt: data.reviewedAt,
          createdAt: data.createdAt,
          answerStatus: data.answers?.status
        });
        
        // SOLUCIÓN: Procesar correctamente los datos
        if (data.answers && data.answers.status) {
          console.log(`[DEBUG-FRONTEND] Usando estado desde answers: ${data.answers.status} en lugar de ${data.status}`);
          data.status = data.answers.status;
        }
        
        // Extraer el nombre de propietario desde rawFormData si está disponible
        if (!data.name && data.rawFormData && data.rawFormData.name) {
          console.log(`[DEBUG-FRONTEND] Extrayendo nombre de rawFormData: ${data.rawFormData.name}`);
          data.name = data.rawFormData.name;
        }
        
        // No tocar procesamiento de video e imágenes
        if (data.fileUrls) {
          // Asegurar que el video esté disponible
          if (!data.fileUrl && data.fileUrls.videoFileUrl) {
            data.fileUrl = data.fileUrls.videoFileUrl;
          }
          
          // Si aún no hay URL de video, crear una simulada
          if (!data.fileUrl && data.id) {
            const videoUrl = `${process.env.NEXT_PUBLIC_API_URL}/mock-file/${data.id}_videoFile.mp4`;
            data.fileUrl = videoUrl;
          }
        }
        
        // Log del estado antes de actualizar el estado local
        console.log('[DEBUG-FRONTEND] Estado antes de actualizar:', data.status);
        
        setInspection(data);
      } catch (error) {
        console.error("Error fetching inspection:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspection();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    // Log para depurar el estado que llega a este método
    console.log('[DEBUG-FRONTEND] Renderizando badge para estado:', status);
    
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          status === "approved"
            ? "bg-green-100 text-green-800"
            : status === "rejected"
            ? "bg-red-100 text-red-800"
            : status === "error"
            ? "bg-orange-100 text-orange-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {status === "approved"
          ? "Aprovado"
          : status === "rejected"
          ? "Rejeitado"
          : status === "error"
          ? "Com erro"
          : "Pendente"}
      </span>
    );
  };

  const handleStatusUpdate = async (status: "approved" | "rejected" | "error" | "pending") => {
    try {
      // Prevenir doble envío
      if (isUpdating) return;
      
      console.log(`[DEBUG-FRONTEND] Enviando actualización de estado a: ${status}`);
      setIsUpdating(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao atualizar inspeção para ${status}`);
      }

      // Obtener los datos actualizados de la respuesta
      const updatedData = await response.json();
      console.log('[DEBUG-FRONTEND] Respuesta de actualización:', updatedData);
      
      // Actualizar el estado local
      if (inspection) {
        console.log('[DEBUG-FRONTEND] Actualizando estado local a:', status);
        setInspection({
          ...inspection,
          status,
          reviewedAt: updatedData.reviewedAt || new Date().toISOString(),
        });
      }

      // Mostrar mensaje de éxito discreto
      const statusMessage = status === 'approved' ? 'aprovada' : 
                           status === 'rejected' ? 'rejeitada' : 
                           status === 'error' ? 'marcada com erro' : 'atualizada';
      
      alert(`Inspeção ${statusMessage} com sucesso!`);
      
      // Actualizar la lista en la página principal sin redirección
      try {
        console.log('[DEBUG-FRONTEND] Actualizando lista de inspecciones');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/list?forceRefresh=true`, { 
          method: "GET",
          headers: { "Cache-Control": "no-cache" } 
        });
      } catch (e) {
        console.warn("Error al actualizar la lista de inspecciones", e);
      }
    } catch (error: any) {
      console.error(`Erro ao atualizar inspeção para ${status}:`, error);
      
      // Mensajes específicos según el tipo de error
      if (error.message.includes("já aprovada ou rejeitada")) {
        alert("Esta inspeção já está em um estado final (aprovada ou rejeitada) e não pode ser alterada.");
      } else {
        alert(`Erro: ${error.message || 'Não foi possível atualizar o estado da inspeção'}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Carregando inspeção...</span>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-red-600">Inspeção não encontrada</h2>
        <p className="mb-6">A inspeção que está procurando não existe ou foi excluída.</p>
        <Button onClick={() => router.push("/")}>Voltar à lista</Button>
      </div>
    );
  }

  // Componente para renderizar una imagen que se puede ampliar
  const ZoomableImage = ({ src, alt, className = "h-full w-full object-cover" }: { src: string; alt: string; className?: string }) => {
    if (!src) return null;
    
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`cursor-pointer ${className}`}
        onClick={() => openImageModal(src)}
        onError={handleImageError}
      />
    );
  };

  // Extraer URLs de imágenes de fileUrls
  const videoUrl = inspection.fileUrls?.videoFileUrl || "";
  const crlvUrl = inspection.fileUrls?.crlvPhotoUrl || "";
  const frontalUrl = inspection.fileUrls?.frontalUrl || "";
  const traseraUrl = inspection.fileUrls?.traseraUrl || "";
  const lateralIzqUrl = inspection.fileUrls?.lateral_izquierdoUrl || "";
  const lateralDerUrl = inspection.fileUrls?.lateral_derechoUrl || "";
  const interiorFrontalUrl = inspection.fileUrls?.interior_frontalUrl || "";
  const interiorTraseroUrl = inspection.fileUrls?.interior_traseroUrl || "";
  const safetyItemsUrl = inspection.fileUrls?.safetyItemsPhotoUrl || "";
  const windshieldDamageUrl = inspection.fileUrls?.windshieldPhotoUrl || inspection.answers?.windshieldDamagePhotoUrl || "";
  const lightsDamageUrl = inspection.fileUrls?.lightsPhotoUrl || inspection.answers?.lightsDamagePhotoUrl || "";
  const tiresDamageUrl = inspection.fileUrls?.tiresPhotoUrl || inspection.answers?.tireDamagePhotoUrl || "";
  
  return (
    <div className="space-y-6 pb-10">
      {/* Modal para la visualización ampliada de imágenes */}
      <ImageModal isOpen={modalOpen} imageUrl={selectedImage} onClose={closeImageModal} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inspeção #{inspection.id.substring(0, 8)}</h2>
          <div className="flex items-center space-x-2 mt-1">
            {getStatusBadge(inspection.status)}
            <span className="text-sm text-gray-500">
              {formatDate(inspection.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            Voltar à lista
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información del vehículo */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-medium">Informação do Veículo</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Proprietário</p>
              <p className="font-medium">{inspection.rawFormData?.name || inspection.answers?.ownerName || inspection.name || 'Não especificado'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{inspection.rawFormData?.email || inspection.answers?.email || inspection.email || 'Não especificado'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p>{inspection.rawFormData?.phone || inspection.answers?.phone || 'Não especificado'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Placa</p>
              <p>{inspection.rawFormData?.licensePlate || inspection.answers?.licensePlate || inspection.licensePlate || 'Não especificado'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Ano do modelo</p>
              <p>{(inspection.rawFormData && inspection.rawFormData.modelYear) || inspection.answers?.modelYear || 'Não especificado'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Quilometragem</p>
              <p>{(inspection.rawFormData && inspection.rawFormData.mileage) || inspection.answers?.mileage || 'Não especificado'} {(inspection.rawFormData && inspection.rawFormData.mileage) || inspection.answers?.mileage ? 'km' : ''}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Tem número de chassi visível</p>
              <p className={(inspection.answers?.hasChassisNumber === true || inspection.rawFormData?.hasChassisNumber === 'sim') ? "text-green-600" : "text-red-600"}>
                {(inspection.answers?.hasChassisNumber === true || inspection.rawFormData?.hasChassisNumber === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Tem chave secundária</p>
              <p className={(inspection.answers?.hasSecondKey === true || inspection.rawFormData?.hasSecondKey === 'sim') ? "text-green-600" : "text-red-600"}>
                {(inspection.answers?.hasSecondKey === true || inspection.rawFormData?.hasSecondKey === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
          </div>
        </div>

        {/* Estado y condiciones */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-medium">Estado e Condições</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Sistema de áudio original</p>
              <p className={(inspection.answers?.hasOriginalSoundSystem === true || inspection.rawFormData?.isOriginalSoundSystem === 'sim') ? "text-green-600" : "text-red-600"}>
                {(inspection.answers?.hasOriginalSoundSystem === true || inspection.rawFormData?.isOriginalSoundSystem === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Ar condicionado funcionando</p>
              <p className={(inspection.answers?.hasAirConditioner === true || inspection.rawFormData?.acWorking === 'sim') ? "text-green-600" : "text-red-600"}>
                {(inspection.answers?.hasAirConditioner === true || inspection.rawFormData?.acWorking === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Danos no para-brisa</p>
              <p className={(inspection.answers?.hasWindshieldDamage === true || inspection.rawFormData?.hasWindshieldDamage === 'sim') ? "text-red-600" : "text-green-600"}>
                {(inspection.answers?.hasWindshieldDamage === true || inspection.rawFormData?.hasWindshieldDamage === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Danos nas luzes</p>
              <p className={(inspection.answers?.hasLightsDamage === true || inspection.rawFormData?.hasLightsDamage === 'sim') ? "text-red-600" : "text-green-600"}>
                {(inspection.answers?.hasLightsDamage === true || inspection.rawFormData?.hasLightsDamage === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Danos nos pneus</p>
              <p className={(inspection.answers?.hasTiresDamage === true || inspection.rawFormData?.hasTireDamage === 'sim') ? "text-red-600" : "text-green-600"}>
                {(inspection.answers?.hasTiresDamage === true || inspection.rawFormData?.hasTireDamage === 'sim') ? "Sim" : "Não"}
              </p>
            </div>
            
            {inspection.answers?.safetyItems && inspection.answers.safetyItems.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Elementos de segurança</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {inspection.answers.safetyItems.map((item, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {inspection.answers?.conditions && inspection.answers.conditions.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Condições gerais</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {inspection.answers.conditions.map((condition, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
            

          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 border-b pb-2 text-lg font-medium">Estado da revisão</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Estado atual</p>
                {getStatusBadge(inspection.status)}
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Data de criação</p>
                <p>{formatDate(inspection.createdAt)}</p>
              </div>
              
              {inspection.reviewedAt && (
                <div>
                  <p className="text-sm text-gray-500">Data de revisão</p>
                  <p>{formatDate(inspection.reviewedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {(inspection.status === "pending" || inspection.status === "error") && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b pb-2 text-lg font-medium">Ações</h3>
              
              <div className="flex space-x-4 mb-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processando..." : "Aprovar"}
                </Button>
                
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processando..." : "Rejeitar"}
                </Button>
              </div>
              
              {inspection.status !== "error" && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleStatusUpdate("error")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processando..." : "Marcar com erro"}
                </Button>
              )}
              
              {inspection.status === "error" && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleStatusUpdate("pending")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processando..." : "Voltar para pendente"}
                </Button>
              )}
            </div>
          )}
          
          {inspection.status !== "pending" && inspection.status !== "error" && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b pb-2 text-lg font-medium">Ações</h3>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  As inspeções {inspection.status === "approved" ? "aprovadas" : "rejeitadas"} não podem ser alteradas
                </p>
                <div className="p-2 bg-yellow-50 rounded-md mt-2 text-sm text-yellow-800">
                  <strong>Nota:</strong> Uma vez que uma inspeção é {inspection.status === "approved" ? "aprovada" : "rejeitada"}, 
                  seu estado não pode ser alterado para manter a integridade do processo.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b pb-2 text-lg font-medium">Vídeo da Inspeção</h3>
        
        {videoUrl ? (
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <video 
              src={videoUrl} 
              controls 
              controlsList="nodownload" 
              onError={(e) => console.error("Error loading video:", e)}
              className="h-full w-full"
            >
              <source src={videoUrl} type="video/mp4" />
              <p>Seu navegador não suporta a tag de vídeo.</p>
            </video>
            <div className="mt-3 text-center text-sm text-gray-500">
              <p>URL do vídeo: <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver vídeo diretamente</a></p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum vídeo disponível</p>
        )}
      </div>

      {/* Fotos del vehículo */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b pb-2 text-lg font-medium">Fotos do Veículo</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Exterior */}
          {frontalUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Frontal</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={frontalUrl} alt="Vista frontal" />
              </div>
            </div>
          )}
          
          {traseraUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Traseira</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={traseraUrl} alt="Vista traseira" />
              </div>
            </div>
          )}
          
          {lateralIzqUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Lateral esquerda</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={lateralIzqUrl} alt="Lateral esquerda" />
              </div>
            </div>
          )}
          
          {lateralDerUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Lateral direita</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={lateralDerUrl} alt="Lateral direita" />
              </div>
            </div>
          )}
          
          {/* Interior */}
          {interiorFrontalUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Interior frontal</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={interiorFrontalUrl} alt="Interior frontal" />
              </div>
            </div>
          )}
          
          {interiorTraseroUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Interior traseiro</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={interiorTraseroUrl} alt="Interior traseiro" />
              </div>
            </div>
          )}
          
          {/* Documentos y elementos de segurança */}
          {crlvUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Documento CRLV</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={crlvUrl} alt="CRLV" />
              </div>
            </div>
          )}
          
          {safetyItemsUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Elementos de segurança</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={safetyItemsUrl} alt="Elementos de segurança" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fotos de danos */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b pb-2 text-lg font-medium">Fotos de Danos</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {windshieldDamageUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Danos no para-brisa</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={windshieldDamageUrl} alt="Danos no para-brisa" />
              </div>
            </div>
          )}
          
          {lightsDamageUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Danos nas luzes</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={lightsDamageUrl} alt="Danos nas luzes" />
              </div>
            </div>
          )}
          
          {tiresDamageUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Danos nos pneus</p>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <ZoomableImage src={tiresDamageUrl} alt="Danos nos pneus" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 