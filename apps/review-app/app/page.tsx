"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../packages/ui";
import { Inspection } from "../../../packages/types";
import Image from "next/image";

// Extender interfaz de inspección para este componente
interface EnhancedInspection extends Omit<Inspection, 'answers' | 'email'> {
  name?: string;
  ownerName?: string;
  email?: string;
  licensePlate?: string;
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
    status?: string;
    [key: string]: any;
  };
}

export default function Home() {
  const [inspections, setInspections] = useState<EnhancedInspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<EnhancedInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const router = useRouter();

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState({
    day: '',
    month: '',
    year: ''
  });

  // Función para obtener datos del servidor
  const fetchInspections = async (forceRefresh = false) => {
    try {
      // Evitar múltiples solicitudes rápidas (throttling)
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTime < 1000) {
        return; // Evitar más de una solicitud por segundo
      }
      
      setLastFetchTime(now);
      
      // Si estamos en estado de carga, mostrar el indicador
      if (forceRefresh) {
        setIsLoading(true);
      }
      
      // Agregar un parámetro para forzar recarga sin caché si es necesario
      const url = `${process.env.NEXT_PUBLIC_API_URL}/review/list${forceRefresh ? '?forceRefresh=true' : ''}`;
      console.log(`[DEBUG-VERBOSE] Fetching from URL: ${url}`);
      
      const response = await fetch(url, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {},
        cache: forceRefresh ? 'no-store' : 'default'
      });
      
      if (!response.ok) throw new Error("Failed to fetch inspections");
      const data = await response.json();
      
      // Log mínimo, solo para depuración básica
      console.log(`Carregadas ${data.length} inspeções`);
      
      // Usar directamente los datos como vienen del backend sin manipulación adicional
      setInspections(data);
      setFilteredInspections(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar inspeções:", error);
      setIsLoading(false);
    }
  };

  // Cargar datos al inicio
  useEffect(() => {
    // Al cargar por primera vez, forzar refresco para obtener datos actualizados
    fetchInspections(true);
  }, []);
  
  // Configurar actualizaciones automáticas (siempre activas)
  useEffect(() => {
    // Configurar un intervalo para actualizar los datos periódicamente
    const intervalId = setInterval(() => {
      fetchInspections();
    }, 30000); // Actualizar cada 30 segundos (mantener frecuencia para que los cambios se vean rápido)
    
    // Detectar cuando la página se vuelve visible para actualizar datos
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Al volver a la página, forzar refresco para garantizar datos actualizados
        fetchInspections(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar intervalo y listener al desmontar
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Aplicar filtros cuando cambien
  useEffect(() => {
    let filtered = [...inspections];
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(insp => insp.status === statusFilter);
    }
    
    // Filtrar por término de búsqueda (correo o nombre)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        insp => 
          (insp.email && insp.email.toLowerCase().includes(term)) || 
          (insp.answers?.email && insp.answers.email.toLowerCase().includes(term)) || 
          (insp.answers?.ownerName && insp.answers.ownerName.toLowerCase().includes(term)) ||
          (insp.answers?.licensePlate && insp.answers.licensePlate.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por fecha
    if (dateFilter.day || dateFilter.month || dateFilter.year) {
      filtered = filtered.filter(insp => {
        if (!insp.createdAt) return false;
        
        const createdAt = new Date(insp.createdAt);
        const day = createdAt.getDate().toString();
        const month = (createdAt.getMonth() + 1).toString(); // Los meses son 0-indexados
        const year = createdAt.getFullYear().toString();
        
        return (
          (!dateFilter.day || day === dateFilter.day) &&
          (!dateFilter.month || month === dateFilter.month) &&
          (!dateFilter.year || year === dateFilter.year)
        );
      });
    }
    
    setFilteredInspections(filtered);
  }, [statusFilter, searchTerm, dateFilter, inspections]);

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

  const handleViewDetails = (id: string) => {
    router.push(`/detail/${id}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilterChange = (field: 'day' | 'month' | 'year', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Carregando inspeções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel de Revisão de Inspeção Veicular</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{filteredInspections.length} inspeções encontradas</p>
        </div>
      </div>
      
      {/* Panel de filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Filtros de pesquisa</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label htmlFor="status-filter" className="text-sm font-medium mb-1">Estado</label>
            <select 
              id="status-filter"
              className="rounded-md border border-gray-300 px-3 py-2 min-w-[150px]"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="error">Com erro</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
          
          <div className="flex flex-col flex-1">
            <label htmlFor="search-term" className="text-sm font-medium mb-1">Buscar por email, nome ou placa</label>
            <input 
              id="search-term"
              type="text"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Digite email, nome ou placa..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Data de criação</label>
            <div className="flex gap-2">
              <input 
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 w-16"
                placeholder="Dia"
                value={dateFilter.day}
                onChange={(e) => handleDateFilterChange('day', e.target.value)}
              />
              <input 
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 w-16"
                placeholder="Mês"
                value={dateFilter.month}
                onChange={(e) => handleDateFilterChange('month', e.target.value)}
              />
              <input 
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 w-24"
                placeholder="Ano"
                value={dateFilter.year}
                onChange={(e) => handleDateFilterChange('year', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
                setDateFilter({day: '', month: '', year: ''});
                fetchInspections(true);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Listado de inspecciones */}
      {filteredInspections.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">Não há inspeções que correspondam aos filtros.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proprietário</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {inspection.rawFormData?.name || inspection.answers?.ownerName || inspection.ownerName || inspection.name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {inspection.rawFormData?.email || inspection.answers?.email || inspection.email || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{inspection.rawFormData?.licensePlate || inspection.answers?.licensePlate || inspection.licensePlate || 'N/A'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        inspection.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : inspection.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : inspection.status === "error"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {inspection.status === "approved"
                        ? "Aprovado"
                        : inspection.status === "rejected"
                        ? "Rejeitado" 
                        : inspection.status === "error"
                        ? "Com erro"
                        : "Pendente"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(inspection.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(inspection.id)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 