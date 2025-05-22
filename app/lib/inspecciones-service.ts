import { supabase } from './supabase-client';

export interface Inspeccion {
  id?: string;
  created_at?: string;
  owner_name: string;
  email: string;
  phone: string;
  license_plate: string;
  imagenes: Record<string, string>;
  datos: Record<string, any>;
}

export async function guardarInspeccion(inspeccion: Inspeccion): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('inspecciones')
    .insert([inspeccion])
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, id: data.id };
}

export async function listarInspecciones(): Promise<Inspeccion[]> {
  const { data, error } = await supabase
    .from('inspecciones')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Inspeccion[];
} 