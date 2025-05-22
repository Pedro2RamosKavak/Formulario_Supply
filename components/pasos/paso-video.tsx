"use client"

import { type FormikProps, Form } from "formik"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRight, ArrowLeft, ExternalLink, Video } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface PasoVideoProps {
  formik: FormikProps<any>
  onPrevious: () => void
  actualizarDatos: (datos: any) => void
}

export default function PasoVideo({ formik, onPrevious, actualizarDatos }: PasoVideoProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-black text-white p-6">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Video className="mr-2 h-5 w-5" />
          Vídeo do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <div className="p-4 bg-gray-50">
                <h3 className="font-medium mb-4 text-lg">Instruções para gravação do vídeo:</h3>

                <div className="space-y-4">
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
                    <Image
                      src="/images/instrucciones-video.png"
                      alt="Guia de gravação: Vuelta de Video e Visibilidad del Tablero"
                      width={800}
                      height={300}
                      className="w-full rounded-md border"
                    />
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                    <AlertCircle className="h-4 w-4 text-yellow-800" />
                    <AlertDescription className="text-yellow-800 ml-2">
                      ⚠️ O veículo deve permanecer <strong>ligado</strong> durante toda a gravação.
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm text-gray-600">
                    O vídeo deve ter entre 1 e 3 minutos de duração e não exceder 2GB de tamanho.
                  </p>

                  <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-blue-800 mb-2 font-medium">Vídeo de exemplo</p>
                    <p className="text-blue-700 mb-2 text-sm">
                      Se preferir, assista a um vídeo de exemplo para entender como gravar corretamente:
                    </p>
                    <a
                      href="https://kavak.com.br/video-modelo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Assistir vídeo de exemplo
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <FileUpload
                accept={{
                  "video/*": [".mp4", ".mov", ".avi", ".webm"],
                }}
                maxSize={2 * 1024 * 1024 * 1024} // 2GB
                onFileChange={(file) => {
                  if (file) {
                    const objectUrl = URL.createObjectURL(file)
                    formik.setFieldValue("videoFile", file)
                    formik.setFieldValue("videoFileUrl", objectUrl)
                    // Validar el formulario después de cambiar el valor
                    formik.validateForm().then(() => {
                      formik.setTouched({
                        ...formik.touched,
                        videoFile: true,
                      })
                    })
                  } else {
                    formik.setFieldValue("videoFile", null)
                    formik.setFieldValue("videoFileUrl", "")
                  }
                }}
                value={formik.values.videoFile}
                previewUrl={formik.values.videoFileUrl}
                error={
                  formik.touched.videoFile && formik.errors.videoFile ? String(formik.errors.videoFile) : undefined
                }
                fileType="video"
                label="Clique para fazer upload do vídeo do veículo"
              />
              {formik.touched.videoFile && formik.errors.videoFile && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.videoFile}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={onPrevious}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                "Processando..."
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
