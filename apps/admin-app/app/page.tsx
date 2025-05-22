'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FileUrls {
  [key: string]: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  licensePlate: string;
  mileage: string;
  modelYear: string;
  hasChassisNumber: string;
  hasSecondKey: string;
  acWorking: string;
  hasWindshieldDamage: string;
  hasLightsDamage: string;
  hasTireDamage: string;
  isOriginalSoundSystem: string;
  conditions: string[];
  safetyItems: string[];
}

interface Inspection {
  id: string;
  createdAt: string;
  formData: FormData;
  fileUrls: FileUrls;
}

export default function AdminPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/inspections`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setInspections(data.inspections);
        } else {
          setError(data.message || 'Error al cargar inspecciones');
        }
      } catch (error) {
        console.error('Error fetching inspections:', error);
        setError('Error al cargar inspecciones');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInspections();
  }, []);

  const handleInspectionClick = (inspection: Inspection) => {
    setSelectedInspection(inspection);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Painel de Administração - Inspeções</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <h2 className="text-lg font-semibold mb-2">Lista de Inspeções</h2>
            
            {inspections.length === 0 ? (
              <p>Nenhuma inspeção encontrada</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {inspections.map(inspection => (
                  <div 
                    key={inspection.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedInspection?.id === inspection.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleInspectionClick(inspection)}
                  >
                    <p className="font-medium">{inspection.formData.name}</p>
                    <p className="text-sm text-gray-600">Placa: {inspection.formData.licensePlate}</p>
                    <p className="text-xs text-gray-500">{formatDate(inspection.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="md:w-2/3">
            {selectedInspection ? (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Detalhes da Inspeção</h2>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Informações Gerais</h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-sm font-medium">Nome</p>
                      <p>{selectedInspection.formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p>{selectedInspection.formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p>{selectedInspection.formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Placa</p>
                      <p>{selectedInspection.formData.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quilometragem</p>
                      <p>{selectedInspection.formData.mileage} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ano Modelo</p>
                      <p>{selectedInspection.formData.modelYear}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Condições do Veículo</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Número do chassi</p>
                        <p>{selectedInspection.formData.hasChassisNumber === 'sim' ? 'Possui' : 'Não possui'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Segunda chave</p>
                        <p>{selectedInspection.formData.hasSecondKey === 'sim' ? 'Possui' : 'Não possui'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ar-condicionado</p>
                        <p>{selectedInspection.formData.acWorking === 'sim' ? 'Funcionando' : 'Não funciona'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Para-brisa</p>
                        <p>{selectedInspection.formData.hasWindshieldDamage === 'sim' ? 'Com avarias' : 'Sem avarias'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Faróis/Lanternas</p>
                        <p>{selectedInspection.formData.hasLightsDamage === 'sim' ? 'Com avarias' : 'Sem avarias'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pneus</p>
                        <p>{selectedInspection.formData.hasTireDamage === 'sim' ? 'Com problemas' : 'Em bom estado'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium">Condições relatadas</p>
                      <p>{selectedInspection.formData.conditions.includes('nenhum') 
                          ? 'Nenhuma condição especial reportada' 
                          : selectedInspection.formData.conditions.join(', ')}</p>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium">Itens de segurança</p>
                      <p>{selectedInspection.formData.safetyItems.includes('nenhum') 
                          ? 'Nenhum item de segurança' 
                          : selectedInspection.formData.safetyItems.join(', ')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Arquivos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedInspection.fileUrls).map(([key, url]) => (
                      <div key={key} className="border rounded p-2">
                        <p className="text-sm font-medium mb-1">{key}</p>
                        {key.includes('video') ? (
                          <video 
                            src={url} 
                            controls 
                            className="w-full h-48 object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="relative h-48 bg-gray-100">
                            <img 
                              src={url}
                              alt={key} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Abrir em nova aba
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 flex items-center justify-center text-gray-500">
                Selecione uma inspeção para ver os detalhes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 