"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, AlertCircle, Info } from "lucide-react";
import FullScreenImage from "@/components/FullScreenImage";
import Link from 'next/link';
import Image from 'next/image';
import VideoPlayer from '@/app/components/VideoPlayer';

export default function InspeccionDetalle() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [inspeccion, setInspeccion] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [imagenCompleta, setImagenCompleta] = useState<string | null>(null);

  useEffect(() => {
    async function cargarInspeccion() {
      try {
        // Intentar cargar desde localStorage
        const inspecciones = localStorage.getItem("inspecciones");
        
        if (inspecciones) {
          const lista = JSON.parse(inspecciones);
          const item = lista.find((i: any) => i.id === id);
          
          if (item) {
            console.log("Inspección encontrada en localStorage:", item);
            setInspeccion(item);
            setCargando(false);
            return;
          }
        }
        
        // Si no encontramos la inspección, mostrar un error
        setError("No se encontró la inspección solicitada");
      } catch (err: any) {
        console.error("Error al cargar la inspección:", err);
        setError(err.message || "No se pudo cargar la inspección");
      } finally {
        setCargando(false);
      }
    }
    
    cargarInspeccion();
  }, [id]);

  // Función para mostrar imagen completa
  const verImagenCompleta = (url: string) => {
    setImagenCompleta(url);
  };

  // Función para cerrar imagen completa
  const cerrarImagenCompleta = () => {
    setImagenCompleta(null);
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/inspecciones")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!inspeccion) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/inspecciones")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No encontrada</AlertTitle>
          <AlertDescription>No se encontró la inspección solicitada.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Formatear fecha para visualización
  const fechaFormateada = new Date(inspeccion.submissionDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Verificar si hay imágenes o vídeo
  const tieneImagenes = inspeccion.crlvPhotoUrl || 
                        inspeccion.safetyItemsPhotoUrl || 
                        inspeccion.windshieldPhotoUrl ||
                        inspeccion.lightsPhotoUrl ||
                        inspeccion.tiresPhotoUrl;
  
  const tieneVideo = inspeccion.videoFileUrl;

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Botón volver */}
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/inspecciones")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Volver a la lista
      </Button>
      
      <Card>
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-2xl">Inspección: {inspeccion.titular}</CardTitle>
          <CardDescription className="text-gray-300">
            ID: {inspeccion.id} • Fecha: {fechaFormateada}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="datos">
            <TabsList className="mb-4">
              <TabsTrigger value="datos">Datos básicos</TabsTrigger>
              {tieneImagenes && <TabsTrigger value="imagenes">Imágenes</TabsTrigger>}
              {tieneVideo && <TabsTrigger value="video">Video</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="datos">
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h4 className="font-medium">Información general</h4>
                  </div>
                  <div className="divide-y">
                    <div className="p-4 flex justify-between">
                      <span className="text-gray-500">Titular:</span>
                      <span className="font-medium">{inspeccion.titular}</span>
                    </div>
                    <div className="p-4 flex justify-between">
                      <span className="text-gray-500">Placa:</span>
                      <span className="font-medium">{inspeccion.placa}</span>
                    </div>
                    <div className="p-4 flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{inspeccion.email}</span>
                    </div>
                    {inspeccion.celular && (
                      <div className="p-4 flex justify-between">
                        <span className="text-gray-500">Teléfono:</span>
                        <span className="font-medium">{inspeccion.celular}</span>
                      </div>
                    )}
                    {inspeccion.km_atual && (
                      <div className="p-4 flex justify-between">
                        <span className="text-gray-500">Kilometraje:</span>
                        <span className="font-medium">{inspeccion.km_atual} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {tieneImagenes && (
              <TabsContent value="imagenes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspeccion.crlvPhotoUrl && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">CRLV</h4>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded cursor-pointer"
                             onClick={() => verImagenCompleta(inspeccion.crlvPhotoUrl)}>
                          <img
                            src={inspeccion.crlvPhotoUrl}
                            alt="CRLV"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {inspeccion.safetyItemsPhotoUrl && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Itens de segurança</h4>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded cursor-pointer"
                             onClick={() => verImagenCompleta(inspeccion.safetyItemsPhotoUrl)}>
                          <img
                            src={inspeccion.safetyItemsPhotoUrl}
                            alt="Itens de segurança"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {inspeccion.windshieldPhotoUrl && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Para-brisa</h4>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded cursor-pointer"
                             onClick={() => verImagenCompleta(inspeccion.windshieldPhotoUrl)}>
                          <img
                            src={inspeccion.windshieldPhotoUrl}
                            alt="Para-brisa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {inspeccion.lightsPhotoUrl && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Faróis/Lanternas</h4>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded cursor-pointer"
                             onClick={() => verImagenCompleta(inspeccion.lightsPhotoUrl)}>
                          <img
                            src={inspeccion.lightsPhotoUrl}
                            alt="Faróis/Lanternas"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {inspeccion.tiresPhotoUrl && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <h4 className="font-medium">Pneus</h4>
                      </div>
                      <div className="p-4">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded cursor-pointer"
                             onClick={() => verImagenCompleta(inspeccion.tiresPhotoUrl)}>
                          <img
                            src={inspeccion.tiresPhotoUrl}
                            alt="Pneus"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
            
            {tieneVideo && (
              <TabsContent value="video">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h4 className="font-medium">Video de la inspección</h4>
                  </div>
                  <div className="p-4">
                    <VideoPlayer 
                      src={inspeccion.videoFileUrl} 
                      poster="/video-poster.png"
                    />
                    
                    <div className="mt-4">
                      <a 
                        href={inspeccion.videoFileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Ver video en nueva pestaña
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modal para imagen completa */}
      {imagenCompleta && (
        <FullScreenImage url={imagenCompleta} onClose={cerrarImagenCompleta} />
      )}
    </div>
  );
} 