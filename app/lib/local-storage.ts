interface Inspeccion {
  id: string;
  titular: string;
  placa: string;
  email: string;
  submissionDate: string;
  crlvPhotoUrl?: string;
  safetyItemsPhotoUrl?: string;
  windshieldPhotoUrl?: string;
  lightsPhotoUrl?: string;
  tiresPhotoUrl?: string;
  videoFileUrl?: string;
}

const STORAGE_KEY = 'inspecciones';

export function getInspecciones(): Inspeccion[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer inspecciones:', error);
    return [];
  }
}

export function saveInspeccion(inspeccion: Inspeccion): void {
  if (typeof window === 'undefined') return;
  
  try {
    const inspecciones = getInspecciones();
    const index = inspecciones.findIndex(i => i.id === inspeccion.id);
    
    if (index >= 0) {
      // Actualizar inspección existente
      inspecciones[index] = { ...inspecciones[index], ...inspeccion };
    } else {
      // Agregar nueva inspección
      inspecciones.push(inspeccion);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspecciones));
    console.log('Inspección guardada:', inspeccion);
  } catch (error) {
    console.error('Error al guardar inspección:', error);
    throw error;
  }
}

export function getInspeccion(id: string): Inspeccion | null {
  const inspecciones = getInspecciones();
  return inspecciones.find(i => i.id === id) || null;
}

export function deleteInspeccion(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const inspecciones = getInspecciones();
    const filtered = inspecciones.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error al eliminar inspección:', error);
    throw error;
  }
} 