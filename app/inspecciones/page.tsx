'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listarInspecciones, Inspeccion } from '../lib/inspecciones-service';

export default function InspeccionesPage() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInspecciones() {
      setLoading(true);
      const data = await listarInspecciones();
      setInspecciones(data);
      setLoading(false);
    }
    fetchInspecciones();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Inspecciones</h1>
      {loading ? (
        <p>Cargando inspecciones...</p>
      ) : inspecciones.length === 0 ? (
        <p>No hay inspecciones registradas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspecciones.map((insp) => (
            <div key={insp.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
              <div className="mb-2">
                <span className="font-semibold">{insp.owner_name}</span> <span className="text-gray-500">({insp.license_plate})</span>
                <div className="text-xs text-gray-400">{insp.created_at && new Date(insp.created_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {insp.imagenes && Object.entries(insp.imagenes).map(([key, url]) => {
                  if (typeof url !== 'string' || !url.trim() || url.length < 8) return null;
                  if (!/^https?:\/\//.test(url)) return null;
                  if (url.endsWith('.mp4')) {
                    return <video key={key} src={url} controls className="w-40 h-28 rounded bg-black" />;
                  }
                  return <img key={key} src={url} alt={key} className="w-24 h-24 object-cover rounded border" />;
                })}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <div>Email: {insp.email}</div>
                <div>Tel: {insp.phone}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(insp.datos, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 