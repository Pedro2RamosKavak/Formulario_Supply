/**
 * Sistema de caché para optimizar el rendimiento y reducir la carga del servidor
 */

// Función para añadir encabezados de caché para archivos estáticos
function setupStaticCache(app) {
  // Middleware para agregar cabeceras de caché a archivos estáticos
  app.use('/public', (req, res, next) => {
    // Caché agresivo para imágenes estáticas (1 semana)
    if (req.path.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } 
    // Caché para videos (3 días)
    else if (req.path.match(/\.(mp4|webm|mov)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=259200');
    }
    // Caché para otros recursos estáticos (1 día)
    else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    next();
  });
}

// Función que genera un middleware para el caché de API
function cacheApiResponse(duration = 60) {
  const cache = new Map();
  const maxAge = duration * 1000; // Convertir a milisegundos
  
  return (req, res, next) => {
    // Solo cache para GET
    if (req.method !== 'GET') return next();
    
    // Generar clave de caché basada en la URL
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    
    // Si hay una respuesta en caché y no ha expirado, úsala
    if (cachedResponse && Date.now() - cachedResponse.timestamp < maxAge) {
      console.log(`[Cache] Usando respuesta en caché para: ${key}`);
      res.setHeader('X-Cache', 'HIT');
      res.status(cachedResponse.status);
      return res.send(cachedResponse.body);
    }
    
    // Si no hay caché, interceptar la respuesta para almacenarla
    const originalSend = res.send;
    res.send = function(body) {
      // No cachear errores
      if (res.statusCode < 400) {
        cache.set(key, {
          body,
          timestamp: Date.now(),
          status: res.statusCode
        });
        console.log(`[Cache] Almacenando respuesta para: ${key}`);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalSend.call(this, body);
    };
    
    next();
  };
}

// Limpia el caché periódicamente para evitar consumo de memoria
function setupCacheCleanup(cacheItems, intervalMinutes = 60) {
  setInterval(() => {
    const expiredEntries = [];
    const now = Date.now();
    
    // Revisar cada caché y limpiar entradas antiguas
    for (const [name, cache] of Object.entries(cacheItems)) {
      if (cache instanceof Map) {
        let entriesRemoved = 0;
        
        for (const [key, value] of cache.entries()) {
          // Si la entrada tiene más de 'intervalMinutes'
          if (now - value.timestamp > intervalMinutes * 60 * 1000) {
            cache.delete(key);
            entriesRemoved++;
          }
        }
        
        if (entriesRemoved > 0) {
          expiredEntries.push(`${entriesRemoved} de ${name}`);
        }
      }
    }
    
    if (expiredEntries.length > 0) {
      console.log(`[Cache] Limpieza: eliminadas ${expiredEntries.join(', ')} entradas antiguas`);
    }
  }, intervalMinutes * 60 * 1000);
}

// Usar exportación ESM en lugar de CommonJS
export {
  setupStaticCache,
  cacheApiResponse,
  setupCacheCleanup
}; 