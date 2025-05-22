"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, FileText, Camera, Video, Clock, CheckCircle, Info } from "lucide-react"
import { motion } from "framer-motion"

interface PasoIntroduccionProps {
  onNext: () => void
}

export default function PasoIntroduccion({ onNext }: PasoIntroduccionProps) {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-black text-white p-6">
        <CardTitle className="text-2xl font-bold">Inspeção Virtual</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose max-w-none">
          <motion.h2
            className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Olá, vamos começar a sua inspeção virtual
          </motion.h2>

          <motion.p className="mb-4 text-lg" initial="hidden" animate="visible" custom={0} variants={fadeIn}>
            Nosso compromisso é garantir total clareza em cada etapa do processo e assegurar a integridade 
            do seu veículo. Assim, conseguimos te oferecer uma pré-oferta justa, baseada em informações precisas.
          </motion.p>

          <motion.div
            className="mb-6 bg-[#f8f9fa] dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-700"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeIn}
          >
            <h3 className="font-medium text-lg mb-2">📌 Informações importantes:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Camera className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400 mt-0.5" />
                <span>
                  Durante este questionário, solicitaremos o envio de vídeo e fotos do seu veículo. 
                  Essas etapas são obrigatórias para que possamos avançar com a proposta de compra.
                </span>
              </li>
              <li className="flex items-start">
                <Info className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400 mt-0.5" />
                <span>
                  Se não puder realizar esse envio agora, recomendamos que retorne mais tarde 
                  ou entre em contato conosco para agendar uma inspeção presencial.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400 mt-0.5" />
                <span>
                  No momento da entrega do veículo em uma de nossas unidades, realizaremos uma inspeção 
                  expressa para validar os dados fornecidos neste formulário. Por isso, pedimos 
                  transparência e honestidade ao preenchê-lo.
                </span>
              </li>
              <li className="flex items-start">
                <Info className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400 mt-0.5" />
                <span>
                  Alguns itens, como estrutura, estado da bateria e outras condições técnicas, 
                  só podem ser avaliados presencialmente. Por isso, a oferta final será 
                  confirmada após essa verificação na unidade.
                </span>
              </li>
            </ul>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeIn}>
            <h3 className="font-medium text-lg mb-2">Durante o processo, você irá:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium">Informações Gerais</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dados pessoais, do veículo e documentação
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium">Segurança</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Itens de segurança obrigatórios e condições
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                    <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium">Condições do Veículo</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estado geral, modificações e características especiais
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                    <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium">Vídeo</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gravação do exterior e interior do veículo
                </p>
              </div>
            </div>
          </motion.div>

          <motion.p
            className="mb-6 text-lg font-medium text-center"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeIn}
          >
            O processo leva em torno de <span className="highlight">10 minutos</span>. Agora sim, vamos começar!
          </motion.p>
        </div>

        <motion.div className="mt-6 flex justify-end" initial="hidden" animate="visible" custom={4} variants={fadeIn}>
          <Button
            onClick={onNext}
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 px-5 rounded-md transition-all duration-200 hover:shadow-lg flex items-center"
          >
            Começar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )
}
