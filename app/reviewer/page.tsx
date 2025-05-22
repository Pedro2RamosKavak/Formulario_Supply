"use client";

import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

export default function ReviewerPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/review/list`)
      .then(res => res.json())
      .then(setInspections)
      .catch(() => setError('No se pudo cargar la lista.'));
  }, []);

  const selectInspection = (id: string) => {
    setLoading(true);
    fetch(`${API_URL}/review/${id}`)
      .then(res => res.json())
      .then(setSelected)
      .catch(() => setError('No se pudo cargar el detalle.'))
      .finally(() => setLoading(false));
  };

  const markChecked = async () => {
    if (!selected) return;
    setLoading(true);
    await fetch(`${API_URL}/review/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked', checkedAt: new Date().toISOString() })
    });
    setSelected({ ...selected, status: 'checked', checkedAt: new Date().toISOString() });
    setLoading(false);
    // Refresca la lista
    fetch(`${API_URL}/review/list`).then(res => res.json()).then(setInspections);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 320, borderRight: '1px solid #eee', padding: 16 }}>
        <h2>Inspecciones</h2>
        {inspections.length === 0 && <p>No hay inspecciones.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {inspections.map(i => (
            <li key={i.id} style={{ margin: '8px 0' }}>
              <button onClick={() => selectInspection(i.id)} style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', textAlign: 'left' }}>
                {i.email} <br />
                <small>{i.createdAt ? i.createdAt.slice(0, 19).replace('T', ' ') : 'Sin fecha'}</small>
                <br />
                <span style={{ color: i.status === 'checked' ? 'green' : '#999' }}>{i.status}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {selected && (
          <div>
            <h3>Detalle de inspección</h3>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Fecha:</b> {selected.createdAt ? selected.createdAt.slice(0, 19).replace('T', ' ') : 'Sin fecha'}</p>
            <p><b>Status:</b> {selected.status}</p>
            {selected.checkedAt && <p><b>Inspección realizada en:</b> {selected.checkedAt ? selected.checkedAt.slice(0, 19).replace('T', ' ') : ''}</p>}
            <p><b>Respuestas:</b></p>
            {selected.answers ? (
              <table style={{ background: '#f6f6f6', padding: 12, borderCollapse: 'collapse', marginBottom: 16 }}>
                <tbody>
                  {Object.entries(selected.answers).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 'bold', padding: 4, border: '1px solid #eee' }}>{key}</td>
                      <td style={{ padding: 4, border: '1px solid #eee' }}>{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ background: '#f6f6f6', padding: 12, borderCollapse: 'collapse', marginBottom: 16 }}>
                <tbody>
                  {Object.entries(selected)
                    .filter(([key, value]) =>
                      !['id','status','createdAt','checkedAt','crlvPhotoUrl','safetyItemsPhotoUrl','windshieldPhotoUrl','lightsPhotoUrl','tiresPhotoUrl','videoFileUrl','uploadHistory','fileKeys','email'].includes(key)
                      && value !== null && value !== '' && typeof value !== 'object')
                    .map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 'bold', padding: 4, border: '1px solid #eee' }}>{key}</td>
                        <td style={{ padding: 4, border: '1px solid #eee' }}>{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              {['crlvPhotoUrl', 'safetyItemsPhotoUrl', 'windshieldPhotoUrl', 'lightsPhotoUrl', 'tiresPhotoUrl'].map((imgKey) => (
                selected[imgKey] && selected[imgKey] !== '' ? (
                  <div key={imgKey} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, marginBottom: 4 }}>{imgKey.replace('Url', '').replace(/([A-Z])/g, ' $1')}</div>
                    <img src={selected[imgKey]} alt={imgKey} style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} onError={e => { e.currentTarget.src = '/placeholder.svg'; }} />
                  </div>
                ) : null
              ))}
            </div>
            {selected.videoFileUrl && selected.videoFileUrl !== '' ? (
              <div style={{ marginBottom: 16 }}>
                <b>Video:</b><br />
                <video src={selected.videoFileUrl} controls width={400} style={{ borderRadius: 8, border: '1px solid #eee' }} />
              </div>
            ) : (
              <div style={{ marginBottom: 16, color: '#999' }}>No hay video disponible.</div>
            )}
            {selected.status !== 'checked' && (
              <button onClick={markChecked} style={{ marginTop: 16, padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Marcar como Inspección realizada
              </button>
            )}
          </div>
        )}
        {!selected && <p>Selecciona una inspección para ver el detalle.</p>}
      </main>
    </div>
  );
} 