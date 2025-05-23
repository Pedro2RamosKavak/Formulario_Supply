/**
 * Sistema de keep-alive para evitar que el servidor se duerma en planes gratuitos
 */

const PING_INTERVAL = 14 * 60 * 1000; // 14 minutos (justo antes del timeout)

// Función para configurar el sistema de keep-alive
function setupKeepAlive(app) {
  // Ruta que responde rápido con mínimo procesamiento
  app.get('/api/ping', (req, res) => {
    res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Si estamos en producción, auto-ping para mantenernos vivos
  if (process.env.NODE_ENV === 'production') {
    const pingUrl = process.env.BACKEND_URL || 'http://localhost:3003';
    console.log(`[KeepAlive] Configurado para mantener activo el servicio en ${pingUrl}`);
    
    setInterval(() => {
      console.log('[KeepAlive] Realizando ping para mantener el servicio activo...');
      
      fetch(`${pingUrl}/api/ping`)
        .then(response => response.json())
        .then(data => console.log(`[KeepAlive] Servicio activo: ${data.timestamp}`))
        .catch(err => console.error('[KeepAlive] Error en ping:', err.message));
    }, PING_INTERVAL);
  }
}

export { setupKeepAlive }; 