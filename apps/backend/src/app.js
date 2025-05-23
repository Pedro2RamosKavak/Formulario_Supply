import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getUploadUrl, getReadUrl, putJson, getJson, listMetaKeys, deleteAllMetaJson, listInspectionFolders, getObjectsInFolder } from './lib/s3.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupKeepAlive } from './keep-alive.js';
import { setupStaticCache, cacheApiResponse, setupCacheCleanup } from './cache-control.js';

// Obtener el directorio actual en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga las variables de entorno
dotenv.config();

// La aplicación Express
const app = express();

// Configuración CORS para aceptar solicitudes en producción
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Optimizaciones para entorno de producción
if (process.env.NODE_ENV === 'production') {
  // Configurar caché para archivos estáticos
  setupStaticCache(app);
  
  // Compresión para respuestas
  import('compression').then(compression => {
    app.use(compression.default());
    console.log('[Optimización] Compresión activada para respuestas HTTP');
  }).catch(err => {
    console.warn('[Optimización] No se pudo cargar el módulo de compresión:', err.message);
  });
}

// Servir archivos estáticos desde la carpeta public
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configurar el sistema de auto-ping para mantener vivo el servicio en producción
setupKeepAlive(app);

// API routes with /api prefix
const apiRouter = express.Router();

// Crear caches para diferentes endpoints
const listCache = new Map();
const reviewCache = new Map();

// Aplicar caché para endpoints de solo lectura (GET)
apiRouter.get('/review/list', cacheApiResponse(30)); // Caché de 30 segundos
apiRouter.get('/review/:id', cacheApiResponse(60)); // Caché de 1 minuto

// Configurar limpieza periódica de caché
setupCacheCleanup({
  listCache,
  reviewCache
}, 30); // Limpiar cada 30 minutos

// Para pruebas en desarrollo, crear una función mock para los URLs de carga
const getMockUploadUrl = (key, mime) => {
  console.log(`[MOCK] Generating upload URL for ${key} with mime ${mime}`);
  // Return local URL to avoid CORS issues
  return `http://localhost:3003/mock-upload/${key}`;
};

apiRouter.post('/submit', async (req, res) => {
  try {
    const { email, requiredFiles } = req.body;
    const id = uuidv4();
    const fileKeys = {};
    const uploadUrls = {};
    const files = requiredFiles || [
      // Default required files if not specified
      'crlvPhoto',
      'safetyItemsPhoto',
      'windshieldPhoto',
      'lightsPhoto',
      'tiresPhoto',
      'videoFile',
      // Additional views
      'frontal',
      'trasera',
      'lateral_izquierdo',
      'lateral_derecho',
      'interior_frontal',
      'interior_trasero'
    ];
    
    try {
      // Intentar usar las credenciales reales
      for (const file of files) {
        const ext = file === 'videoFile' ? '.mp4' : '.jpg';
        const key = `uploads/${id}_${file}${ext}`;
        fileKeys[file] = key;
        const mime = file === 'videoFile' ? 'video/mp4' : 'image/jpeg';
        uploadUrls[file] = await getUploadUrl(key, mime);
      }
    } catch (err) {
      console.warn('Error accessing AWS S3, using mock URLs:', err.message);
      // Usar URLs simuladas si las credenciales no funcionan
      for (const file of files) {
        const ext = file === 'videoFile' ? '.mp4' : '.jpg';
        const key = `uploads/${id}_${file}${ext}`;
        fileKeys[file] = key;
        const mime = file === 'videoFile' ? 'video/mp4' : 'image/jpeg';
        uploadUrls[file] = getMockUploadUrl(key, mime);
      }
    }
    
    res.json({ id, uploadUrls });
  } catch (e) {
    console.error('Error in /submit endpoint:', e);
    res.status(500).json({ error: e.message });
  }
});

apiRouter.post('/submit/final', async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: 'Falta el id de la inspección' });
    const createdAt = new Date().toISOString();
    
    // Process the form fields
    const formData = {
      // Core fields
      id,
      email: rest.email || '',
      licensePlate: rest.licensePlate || '',
      ownerName: rest.ownerName || '',
      phone: rest.phone || rest.contactPhone || '',
      
      // Vehicle information
      vehicleBrand: rest.vehicleBrand || '',
      vehicleModel: rest.vehicleModel || '',
      vehicleYear: rest.vehicleYear || rest.modelYear || '',
      currentKm: rest.currentKm || '',
      
      // Vehicle condition
      hasOriginalInfotainment: rest.hasOriginalSoundSystem === 'sim' ? 'yes' : 'no',
      hasDocumentIssues: rest.hasChassisNumber === 'nao' ? 'yes' : 'no',
      hasVisibleMechanicalIssues: 
        (rest.vehicleConditions?.includes('damage') || 
         rest.hasWindshieldDamage === 'sim' || 
         rest.hasLightsDamage === 'sim' || 
         rest.hasTiresDamage === 'sim') ? 'yes' : 'no',
      
      // Safety & condition details
      safetyItems: rest.safetyItems || [],
      tiresCondition: rest.hasTiresDamage === 'sim' ? 'damaged' : 'good',
      glassCondition: rest.hasWindshieldDamage === 'sim' ? 'damaged' : 'good',
      
      // URLs for files
      fileUrls: {},
      
      // Store all form data for reference
      answers: rest,
      
      // Status metadata
      status: 'pending',
      createdAt,
      uploadHistory: [
        { status: 'pending', date: createdAt }
      ]
    };
    
    // Process file URLs if present
    const fileKeys = [
      'crlvPhotoUrl', 'safetyItemsPhotoUrl', 'windshieldPhotoUrl', 
      'lightsPhotoUrl', 'tiresPhotoUrl', 'videoFileUrl',
      'frontalUrl', 'traseraUrl', 'lateral_izquierdoUrl', 
      'lateral_derechoUrl', 'interior_frontalUrl', 'interior_traseroUrl'
    ];
    
    fileKeys.forEach(key => {
      if (rest[key]) {
        formData.fileUrls[key] = rest[key];
      }
    });
    
    try {
      await putJson(`meta/${id}.json`, formData);
    } catch (err) {
      console.warn('Error saving to AWS S3, saving locally:', err.message);
      // Guardar localmente si AWS S3 falla
      if (!global.localDb) global.localDb = {};
      if (!global.localDb.meta) global.localDb.meta = {};
      global.localDb.meta[id] = formData;
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error in /submit/final endpoint:', e);
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/review/list', async (req, res) => {
  try {
    // Usar un parámetro para forzar recarga sin caché
    const forceRefresh = req.query.forceRefresh === 'true';
    
    console.log(`[DEBUG] /review/list - forceRefresh: ${forceRefresh}`);
    
    // Cache temporal para evitar consultas innecesarias (30 segundos)
    if (!forceRefresh && global.listCache && global.listCacheTime && 
        (Date.now() - global.listCacheTime < 30000)) {
      console.log(`[DEBUG] Devolviendo lista desde caché (edad: ${Math.floor((Date.now() - global.listCacheTime)/1000)}s)`);
      return res.json(global.listCache);
    }
    
    console.log(`[DEBUG] Obteniendo lista directamente de S3`);
    let allInspections = [];
    
    // 1. Intentar cargar desde la carpeta meta/ (formato antiguo)
    try {
      const metaKeys = await listMetaKeys();
      if (metaKeys && metaKeys.length > 0) {
        const metaInspections = await Promise.all(
          metaKeys.slice(-100).map(getJson)
        );
        allInspections = [...metaInspections];
      }
    } catch (err) {
      console.warn('Error accessing S3 meta/ folder:', err.message);
    }
    
    // 2. Intentar cargar desde la carpeta inspections/ (formato nuevo)
    try {
      const inspectionFolders = await listInspectionFolders();
      
      // Para cada carpeta de inspección, recuperar su archivo de metadatos
      for (const folderPrefix of inspectionFolders) {
        try {
          // Obtener el ID de la inspección desde el nombre de la carpeta
          const inspId = folderPrefix.split('/')[1]; // inspections/insp_123/ => insp_123
          
          // Buscar archivos en esta carpeta
          const objects = await getObjectsInFolder(folderPrefix);
          
          if (objects.length > 0) {
            // Crear un objeto de inspección con los datos disponibles
            const createdAt = objects[0]?.LastModified || new Date().toISOString();
            
            // Extraer información del ID de carpeta (formato esperado: insp_ID_EMAIL)
            const folderParts = inspId.split('_');
            const email = folderParts.length > 2 ? folderParts[2] : 'unknown@email.com';
            
            // Crear las URLs para cada archivo
            const fileUrls = {};
            let status = 'pending';
            let answersData = {};
            let rawFormData = null; // Inicializamos rawFormData
            
            // Extraer los metadatos (si existe un archivo JSON) para el listado
            const jsonFile = objects.find(obj => obj.Key.endsWith('.json'));
            if (jsonFile) {
              try {
                const jsonData = await getJson(jsonFile.Key);
                answersData = jsonData;
                
                // Extraer rawFormData si existe
                if (jsonData.rawFormData) {
                  rawFormData = jsonData.rawFormData;
                  console.log(`[DEBUG] Encontrado rawFormData para ${inspId}`);
                }
                
                // Asegurar que el estado se asigna correctamente
                if (jsonData.status) {
                  status = jsonData.status;
                  console.log(`[DEBUG] Estado tomado del JSON para ${inspId}: ${status}`);
                }
              } catch (jsonErr) {
                console.warn(`Error loading JSON metadata for list: ${jsonErr.message}`);
              }
            }
            
            objects.forEach(obj => {
              const fileName = obj.Key.split('/').pop();
              const fileType = fileName.split('.').pop();
              
              // Asignar el nombre adecuado a cada archivo según su nombre
              if (fileName.includes('crlv')) {
                fileUrls.crlvPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileName.includes('safety') || fileName.includes('safetyItems')) {
                fileUrls.safetyItemsPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileName.includes('windshield')) {
                fileUrls.windshieldPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileName.includes('lights')) {
                fileUrls.lightsPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileName.includes('tire')) {
                fileUrls.tiresPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileName.includes('video')) {
                fileUrls.videoFileUrl = `${folderPrefix}${fileName}`;
              }
              
              // Para las vistas específicas
              if (fileName.startsWith('crlv')) {
                fileUrls.crlvPhotoUrl = `${folderPrefix}${fileName}`;
              } else if (fileType === 'mp4' || fileType === 'mov') {
                fileUrls.videoFileUrl = `${folderPrefix}${fileName}`;
              }
            });
            
            // Crear un objeto de inspección con los datos disponibles
            const inspection = {
              id: inspId,
              email: email,
              createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
              status: status, // Usar el estado del JSON
              fileUrls: fileUrls,
              answers: answersData,
              rawFormData: rawFormData, // Incluir rawFormData en el objeto
              uploadHistory: answersData.uploadHistory || [{ status: 'pending', date: new Date().toISOString() }],
              isNewFormat: true // Marcar como formato nuevo
            };

            allInspections.push(inspection);
          }
        } catch (folderErr) {
          console.error(`Error processing folder ${folderPrefix}:`, folderErr);
        }
      }
    } catch (err) {
      console.warn('Error accessing S3 inspections/ folder:', err.message);
    }
    
    // 3. Usar datos locales si no hay nada en S3
    if (allInspections.length === 0) {
      if (global.localDb && global.localDb.meta) {
        allInspections = Object.values(global.localDb.meta);
      }
    }
    
    // Process inspection data for the list view
    const processedMetas = allInspections.map(meta => {
      // Include only essential fields for the list view
      const processedMeta = {
        id: meta.id,
        createdAt: meta.createdAt,
        reviewedAt: meta.reviewedAt,
        status: meta.status,
        email: meta.email,
        ownerName: meta.ownerName || '',
        licensePlate: meta.licensePlate || '',
        vehicleBrand: meta.vehicleBrand || '',
        vehicleModel: meta.vehicleModel || '',
        vehicleYear: meta.vehicleYear || '',
        hasVisibleMechanicalIssues: meta.hasVisibleMechanicalIssues || 'unknown',
        isNewFormat: meta.isNewFormat || false,
        // Include a thumbnail image if available
        thumbnailUrl: meta.fileUrls?.frontalUrl || meta.fileUrls?.crlvPhotoUrl || null,
        // Include answers for data access in the review-app
        answers: meta.answers || {},
        // Incluir rawFormData para que esté disponible en el frontend
        rawFormData: meta.rawFormData || null
      };
      
      // Debug para inspección específica si está incluida
      if (meta.id.includes('1747919416962')) {
        console.log(`[DEBUG] Inspección específica encontrada en lista:`, {
          id: meta.id,
          status: meta.status,
          answersStatus: meta.answers?.status,
          hasRawFormData: !!meta.rawFormData,
          processedStatus: processedMeta.status
        });
      }
      
      return processedMeta;
    });
    
    processedMetas.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    
    // Log de estados para depuración
    console.log(`[DEBUG] Estados de inspecciones en la lista:`);
    processedMetas.forEach(item => {
      console.log(`- ${item.id}: ${item.status}`);
    });
    
    // Guardar en caché para futuras solicitudes
    global.listCache = processedMetas;
    global.listCacheTime = Date.now();
    
    console.log(`[DEBUG] Lista actualizada y almacenada en caché (${processedMetas.length} items)`);
    res.json(processedMetas);
  } catch (e) {
    console.error('Error in /review/list endpoint:', e);
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get('/review/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`[DEBUG] Solicitando detalle para inspección ${id}`);
    
    let meta = null;
    let isNewFormat = false;
    
    // 1. Intentar cargar desde la carpeta meta/ (formato antiguo)
    try {
      meta = await getJson(`meta/${id}.json`);
      console.log(`[DEBUG] Found inspection ${id} in meta/ folder`);
    } catch (err) {
      console.log(`[DEBUG] Inspection ${id} not found in meta/ folder, checking inspections/ folder`);
      
      // 2. Intentar cargar desde la carpeta inspections/ (formato nuevo)
      try {
        // Buscar la carpeta de inspección específica
        const folderPrefix = `inspections/${id}/`;
        console.log(`[DEBUG] Looking for inspection in folder: ${folderPrefix}`);
        
        const objects = await getObjectsInFolder(folderPrefix);
        
        if (objects && objects.length > 0) {
          console.log(`[DEBUG] Found ${objects.length} objects in inspection folder`);
          
          // Extraer información del ID de carpeta (formato esperado: insp_ID_EMAIL)
          const folderParts = id.split('_');
          const email = folderParts.length > 2 ? folderParts[2] : 'unknown@email.com';
          
          // Crear las URLs para cada archivo
          const fileUrls = {};
          const answers = {};
          let rawFormData = null; // Inicializar rawFormData
          
          // Extraer los metadatos (si existe un archivo JSON)
          const jsonFile = objects.find(obj => obj.Key.endsWith('.json'));
          if (jsonFile) {
            try {
              const jsonData = await getJson(jsonFile.Key);
              Object.assign(answers, jsonData);
              console.log('[DEBUG] Successfully loaded JSON metadata from inspection folder');
              console.log('[DEBUG] Estado en JSON:', jsonData.status);
              
              // Extraer rawFormData si existe
              if (jsonData.rawFormData) {
                rawFormData = jsonData.rawFormData;
                console.log(`[DEBUG] Encontrado rawFormData para inspección ${id}`);
                console.log(`[DEBUG] Nombre en rawFormData: ${rawFormData.name || 'No disponible'}`);
              }
              
              // Asegurar explícitamente que el estado se transfiere correctamente
              if (jsonData.status) {
                answers.status = jsonData.status;
                console.log(`[DEBUG] Asignado estado explícitamente: ${jsonData.status}`);
              }
            } catch (jsonErr) {
              console.warn(`[DEBUG] Error loading JSON metadata: ${jsonErr.message}`);
            }
          }
          
          // Procesar todos los archivos en la carpeta
          objects.forEach(obj => {
            const fileName = obj.Key.split('/').pop();
            const fileType = fileName.split('.').pop().toLowerCase();
            
            // Asignar el nombre adecuado a cada archivo según su nombre
            if (fileName.includes('crlv')) {
              fileUrls.crlvPhotoUrl = obj.Key;
            } else if (fileName.includes('safety') || fileName.includes('safetyItems')) {
              fileUrls.safetyItemsPhotoUrl = obj.Key;
            } else if (fileName.includes('windshield')) {
              fileUrls.windshieldPhotoUrl = obj.Key;
            } else if (fileName.includes('lights')) {
              fileUrls.lightsPhotoUrl = obj.Key;
            } else if (fileName.includes('tire')) {
              fileUrls.tiresPhotoUrl = obj.Key;
            } else if (fileType === 'mp4' || fileType === 'mov') {
              fileUrls.videoFileUrl = obj.Key;
            }
          });
          
          // Crear un objeto de inspección con los datos disponibles
          const status = answers.status || 'pending';
          
          meta = {
            id: id,
            email: email,
            createdAt: objects[0]?.LastModified ? (typeof objects[0].LastModified === 'string' ? objects[0].LastModified : objects[0].LastModified.toISOString()) : new Date().toISOString(),
            status: status, // Usar el estado del JSON si existe
            fileUrls: fileUrls,
            answers: answers,
            rawFormData: rawFormData, // Incluir rawFormData en el objeto
            uploadHistory: answers.uploadHistory || [{ status: 'pending', date: new Date().toISOString() }],
            isNewFormat: true
          };
          
          isNewFormat = true;
          console.log(`[DEBUG] Created inspection object from folder contents`);
          console.log(`[DEBUG] Estado final a enviar: ${meta.status}`);
        } else {
          console.warn(`[DEBUG] No objects found in inspection folder ${folderPrefix}`);
        }
      } catch (err2) {
        console.warn(`[DEBUG] Error accessing inspection folder: ${err2.message}`);
        
        // 3. Usar datos locales si no se encuentra en S3
        if (global.localDb && global.localDb.meta && global.localDb.meta[id]) {
          meta = global.localDb.meta[id];
          console.log(`[DEBUG] Using local data for inspection ${id}`);
        } else {
          return res.status(404).json({ error: 'Not found' });
        }
      }
    }
    
    if (!meta) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    console.log(`[DEBUG] Respuesta final para ${id} - Estado: ${meta.status || 'No definido'}`);
    console.log(`[DEBUG] Metadata completa (resumida):`, JSON.stringify({
      id: meta.id,
      status: meta.status,
      createdAt: meta.createdAt,
      reviewedAt: meta.reviewedAt,
      hasAnswers: !!meta.answers,
      answersStatus: meta.answers?.status,
      hasRawFormData: !!meta.rawFormData,
      rawFormDataName: meta.rawFormData ? meta.rawFormData.name : null
    }));
    
    // Generate file URLs for preview
    if (meta.fileUrls) {
      // Process all URLs asynchronously
      const urlProcessingPromises = Object.keys(meta.fileUrls).map(async (key) => {
        const url = meta.fileUrls[key];
        // If URL is already a mock URL, leave it as is
        if (url && url.includes('mock-file')) return;
        
        try {
          // Si es nuevo formato, la URL es la clave directa de S3
          if (isNewFormat) {
            const s3Key = meta.fileUrls[key];
            console.log(`[DEBUG] Generating signed URL for S3 key: ${s3Key}`);
            try {
              // Generate a signed URL for the file
              const signedUrl = await getReadUrl(s3Key, 3600); // 1 hour expiration
              meta.fileUrls[key] = signedUrl;
            } catch (signedUrlErr) {
              console.error(`Error generating signed URL for ${s3Key}:`, signedUrlErr);
            }
          } 
          // Para formato antiguo
          else {
            // Get the file key from the URL (everything after last slash, before query params)
            const filePath = url.split('/').pop().split('?')[0];
            // For S3 URLs, we need to generate signed URLs
            if (url.includes('amazonaws.com')) {
              // Extract the S3 key from the URL
              const keyParts = url.split('amazonaws.com/');
              if (keyParts.length > 1) {
                const s3Key = keyParts[1].split('?')[0]; // Remove query params
                console.log(`[DEBUG] Generating signed URL for S3 key: ${s3Key}`);
                try {
                  // Generate a signed URL for the file
                  const signedUrl = await getReadUrl(s3Key, 3600); // 1 hour expiration
                  meta.fileUrls[key] = signedUrl;
                } catch (signedUrlErr) {
                  console.error(`Error generating signed URL for ${s3Key}:`, signedUrlErr);
                  // Fallback to the original URL if we can't generate a signed URL
                }
              }
            } else {
              // For local development, use mock URLs
              meta.fileUrls[key] = `/api/mock-file/${filePath}`;
            }
          }
        } catch (urlErr) {
          console.error(`Error processing URL for ${key}:`, urlErr);
        }
      });
      
      // Wait for all URL processing to complete
      await Promise.all(urlProcessingPromises);
    }
    
    res.json(meta);
  } catch (e) {
    console.error('Error in /review/:id endpoint:', e);
    res.status(404).json({ error: 'Not found' });
  }
});

apiRouter.patch('/review/:id', async (req, res) => {
  try {
    console.log(`[DEBUG] Actualizando estado de inspección ${req.params.id} a ${req.body.status}`);
    
    const { status } = req.body;
    if (!['approved', 'rejected', 'error', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    let meta;
    const isNewFormat = req.params.id.startsWith('insp_');
    let key = isNewFormat ? null : `meta/${req.params.id}.json`;
    let savedSuccessfully = false;
    
    try {
      // Si es una inspección de formato antiguo
      if (key) {
        meta = await getJson(key);
        
        // Verificar las reglas de transición de estado
        if ((meta.status === 'approved' || meta.status === 'rejected') && 
            (status !== meta.status)) {
          return res.status(400).json({ 
            error: 'Não é possível alterar o estado de uma inspeção já aprovada ou rejeitada' 
          });
        }
        
        meta.status = status;
        meta.reviewedAt = new Date().toISOString();
        meta.uploadHistory = meta.uploadHistory || [];
        meta.uploadHistory.push({ 
          status: status, 
          date: new Date().toISOString(),
          message: `Estado atualizado para ${status}`
        });
        
        await putJson(key, meta);
        savedSuccessfully = true;
      } 
      // Si es una inspección de nuevo formato
      else {
        // Buscar la carpeta de inspección
        const folderPrefix = `inspections/${req.params.id}/`;
        const objects = await getObjectsInFolder(folderPrefix);
        
        if (objects && objects.length > 0) {
          // Intentar encontrar un archivo de metadatos existente
          const jsonFile = objects.find(obj => obj.Key.endsWith('.json'));
          
          if (jsonFile) {
            // Si existe un archivo de metadatos, actualizarlo
            try {
              meta = await getJson(jsonFile.Key);
              
              // Verificar las reglas de transición de estado
              if ((meta.status === 'approved' || meta.status === 'rejected') && 
                  (status !== meta.status)) {
                return res.status(400).json({ 
                  error: 'Não é possível alterar o estado de uma inspeção já aprovada ou rejeitada' 
                });
              }
              
              meta.status = status;
              meta.reviewedAt = new Date().toISOString();
              meta.uploadHistory = meta.uploadHistory || [];
              meta.uploadHistory.push({ 
                status: status, 
                date: new Date().toISOString(),
                message: `Estado atualizado para ${status}`
              });
              
              await putJson(jsonFile.Key, meta);
              savedSuccessfully = true;
            } catch (err) {
              console.warn(`Error updating JSON metadata: ${err.message}`);
              return res.status(500).json({ error: 'Erro ao atualizar os metadados da inspeção' });
            }
          } else {
            // Si no existe, crear un nuevo archivo de metadatos
            const metaKey = `${folderPrefix}metadata.json`;
            const folderParts = req.params.id.split('_');
            const email = folderParts.length > 2 ? folderParts[2] : 'unknown@email.com';
            
            meta = {
              id: req.params.id,
              email: email,
              status: status,
              createdAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
              isNewFormat: true,
              uploadHistory: [{
                status: status,
                date: new Date().toISOString(),
                message: `Estado atualizado para ${status}`
              }]
            };
            
            try {
              await putJson(metaKey, meta);
              savedSuccessfully = true;
            } catch (putErr) {
              console.error('Error saving metadata:', putErr);
              return res.status(500).json({ error: 'Erro ao salvar os metadados da inspeção' });
            }
          }
        } else {
          return res.status(404).json({ error: 'Inspeção não encontrada' });
        }
      }
    } catch (err) {
      console.warn('Error accessing AWS S3, using local data:', err.message);
      // Usar datos locales si AWS S3 falla
      if (global.localDb && global.localDb.meta && global.localDb.meta[req.params.id]) {
        meta = global.localDb.meta[req.params.id];
        
        // Verificar las reglas de transición de estado
        if ((meta.status === 'approved' || meta.status === 'rejected') && 
            (status !== meta.status)) {
          return res.status(400).json({ 
            error: 'Não é possível alterar o estado de uma inspeção já aprovada ou rejeitada' 
          });
        }
        
        meta.status = status;
        meta.reviewedAt = new Date().toISOString();
        meta.uploadHistory = meta.uploadHistory || [];
        meta.uploadHistory.push({ 
          status: status, 
          date: new Date().toISOString(),
          message: `Estado atualizado para ${status}`
        });
        
        global.localDb.meta[req.params.id] = meta;
        savedSuccessfully = true;
      } else {
        return res.status(404).json({ error: 'Inspeção não encontrada' });
      }
    }
    
    if (!savedSuccessfully) {
      return res.status(500).json({ error: 'Erro interno ao salvar os dados da inspeção' });
    }
    
    // Limpiar todas las cachés para que los cambios sean visibles inmediatamente
    if (global.inspectionCache) {
      delete global.inspectionCache[req.params.id];
    }
    
    // Invalida la caché de lista para forzar recarga en próxima solicitud
    global.listCache = null;
    global.listCacheTime = null;
    console.log(`[DEBUG] Caché invalidada, próxima solicitud obtendrá datos frescos`);
    
    // Devolver los datos actualizados
    const response = {
      success: true,
      id: req.params.id,
      status: status,
      reviewedAt: meta.reviewedAt
    };
    
    console.log(`[DEBUG] Enviando respuesta de actualización:`, response);
    res.json(response);
  } catch (e) {
    console.error('Error in PATCH /review/:id endpoint:', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

apiRouter.delete('/review/list', async (req, res) => {
  try {
    let deleted = 0;
    try {
      deleted = await deleteAllMetaJson();
    } catch (err) {
      console.warn('Error accessing AWS S3, clearing local data:', err.message);
      // Limpiar datos locales si AWS S3 falla
      if (global.localDb && global.localDb.meta) {
        deleted = Object.keys(global.localDb.meta).length;
        global.localDb.meta = {};
      }
    }
    
    res.json({ deleted });
  } catch (e) {
    console.error('Error in DELETE /review/list endpoint:', e);
    res.status(500).json({ error: e.message });
  }
});

// URL del webhook de Zapier
const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || "https://hooks.zapier.com/hooks/catch/10702199/275d6f8/";

// Endpoint para Zapier (relay al webhook externo)
apiRouter.post('/zapier', async (req, res) => {
  try {
    // Recibir los datos
    const data = req.body;
    
    // Determinar el tipo de datos (inicial o completo)
    const isInitial = !!data.formType && data.formType === 'initial';
    const type = isInitial ? 'initial' : 'complete';
    
    // Crear payload para Zapier
    const payload = {
      ...data,
      submission_type: type,
      step: type === 'initial' ? 'Initial Step' : 'Complete',
      submission_date: new Date().toISOString(),
      formatted_date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    // Convertir arrays a strings separados por comas para Zapier
    if (Array.isArray(payload.conditions)) {
      payload.conditions = payload.conditions.join(', ');
    }
    
    if (Array.isArray(payload.safetyItems)) {
      payload.safetyItems = payload.safetyItems.join(', ');
    }
    
    // Enviar a Zapier
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VehicleInspection/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Error al enviar a Zapier: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Devolver respuesta
    return res.json({
      success: true,
      zapier_response: result
    });
    
  } catch (error) {
    console.error("Error al procesar solicitud Zapier:", error.message);
    return res.status(500).json({
      success: false, 
      message: "Error al procesar la solicitud", 
      error: error.message
    });
  }
});

// Mount the API router with the /api prefix
app.use('/api', apiRouter);

// Endpoint de diagnóstico para ver los datos almacenados
app.get('/api/debug/state', (req, res) => {
  const state = {
    hasLocalDb: !!global.localDb,
    metaCount: global.localDb?.meta ? Object.keys(global.localDb.meta).length : 0,
    metaKeys: global.localDb?.meta ? Object.keys(global.localDb.meta) : [],
    envVars: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      PORT: process.env.PORT
    }
  };
  
  console.log('[DEBUG] Current state:', state);
  res.json(state);
});

// Endpoint para obtener todas las inspecciones incluyendo la muestra
app.get('/api/debug/all-inspections', (req, res) => {
  try {
    // Obtener todas las inspecciones del almacenamiento local
    const localInspections = global.localDb?.meta ? Object.values(global.localDb.meta) : [];
    
    // Procesar los datos para la vista de lista
    const processedInspections = localInspections.map(meta => ({
      id: meta.id,
      createdAt: meta.createdAt,
      reviewedAt: meta.reviewedAt,
      status: meta.status,
      email: meta.email,
      ownerName: meta.ownerName,
      licensePlate: meta.licensePlate,
      vehicleBrand: meta.vehicleBrand,
      vehicleModel: meta.vehicleModel,
      vehicleYear: meta.vehicleYear,
      hasVisibleMechanicalIssues: meta.hasVisibleMechanicalIssues,
      thumbnailUrl: meta.fileUrls?.frontalUrl || meta.fileUrls?.crlvPhotoUrl || null
    }));
    
    // Ordenar por fecha de creación descendente
    processedInspections.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    console.log(`[DEBUG] Returning ${processedInspections.length} total inspections`);
    res.json(processedInspections);
  } catch (e) {
    console.error('Error in /api/debug/all-inspections endpoint:', e);
    res.status(500).json({ error: e.message });
  }
});

// Endpoint para crear una inspección de prueba
app.get('/api/debug/create-sample', (req, res) => {
  try {
    // Inicializar localDb si no existe
    if (!global.localDb) global.localDb = {};
    if (!global.localDb.meta) global.localDb.meta = {};
    
    // Crear una inspección de prueba
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    const sampleInspection = {
      // Core fields
      id,
      email: "test@example.com",
      licensePlate: "ABC1234",
      ownerName: "Usuario de Prueba",
      phone: "+12345678900",
      
      // Vehicle information
      vehicleBrand: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2020,
      currentKm: "45000",
      
      // Vehicle condition
      hasOriginalInfotainment: "yes",
      hasDocumentIssues: "no",
      hasVisibleMechanicalIssues: "no",
      
      // Safety & condition details
      safetyItems: ["triangle", "wrench", "fireExtinguisher"],
      tiresCondition: "good",
      glassCondition: "good",
      
      // URLs for files
      fileUrls: {
        crlvPhotoUrl: `/api/mock-file/${id}_crlvPhoto.jpg`,
        frontalUrl: `/api/mock-file/${id}_frontal.jpg`,
        traseraUrl: `/api/mock-file/${id}_trasera.jpg`,
        lateral_izquierdoUrl: `/api/mock-file/${id}_lateral_izquierdo.jpg`,
        lateral_derechoUrl: `/api/mock-file/${id}_lateral_derecho.jpg`,
        interior_frontalUrl: `/api/mock-file/${id}_interior_frontal.jpg`,
        interior_traseroUrl: `/api/mock-file/${id}_interior_trasero.jpg`,
        videoFileUrl: `/api/mock-file/${id}_videoFile.mp4`
      },
      
      // Store complete form data for reference
      answers: {
        ownerName: "Usuario de Prueba",
        email: "test@example.com",
        phone: "+12345678900",
        licensePlate: "ABC1234",
        currentKm: "45000",
        modelYear: "2020",
        hasChassisNumber: "sim",
        hasSecondKey: "sim",
        vehicleConditions: ["none"],
        safetyItems: ["triangle", "wrench", "fireExtinguisher"],
        hasAirConditioner: "sim",
        hasWindshieldDamage: "nao",
        hasLightsDamage: "nao",
        hasTiresDamage: "nao",
        hasOriginalSoundSystem: "sim"
      },
      
      // Status metadata
      status: "pending",
      createdAt,
      uploadHistory: [
        { status: "pending", date: createdAt }
      ]
    };
    
    // Guardar en localDb
    global.localDb.meta[id] = sampleInspection;
    
    console.log(`[DEBUG] Created sample inspection with ID: ${id}`);
    res.json({ 
      success: true, 
      message: "Sample inspection created", 
      inspection: sampleInspection 
    });
  } catch (error) {
    console.error("Error creating sample inspection:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mock upload endpoint to handle file uploads in development
app.put('/mock-upload/:path(*)', (req, res) => {
  console.log(`[MOCK] Received file upload for path: ${req.params.path}`);
  
  // Log file details
  const isVideo = req.params.path.includes('videoFile');
  const fileType = isVideo ? 'video/mp4' : 'image/jpeg';
  const fileCategory = req.params.path.split('_')[1]?.split('.')[0] || 'unknown';
  
  console.log(`[MOCK] File type: ${fileType}, category: ${fileCategory}`);
  
  // Just acknowledge the upload, we're not actually storing the file
  res.status(200).end();
});

// Mock endpoint to serve video files (for development only)
app.get('/api/mock-file/:filename', (req, res) => {
  console.log(`[MOCK] Serving mock file: ${req.params.filename}`);
  
  // Determine content type based on extension
  const isVideo = req.params.filename.endsWith('.mp4');
  
  // Extract file category from filename if available
  const fileMatch = req.params.filename.match(/insp_[^_]+_([a-zA-Z_]+)\./);
  const fileCategory = fileMatch ? fileMatch[1] : 'unknown';
  
  console.log(`[MOCK] Serving ${isVideo ? 'video' : 'image'} file, category: ${fileCategory}`);
  
  // Set appropriate headers
  res.setHeader('Content-Type', isVideo ? 'video/mp4' : 'image/jpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Servir el archivo local en lugar de redirigir
  if (isVideo) {
    // Usar nuestro archivo de video local
    const videoPath = path.join(__dirname, 'public', 'sample_video.mp4');
    res.sendFile(videoPath);
  } else {
    // Para imágenes, verificar si existe un placeholder específico para la categoría
    const imagePlaceholders = {
      'crlvPhoto': 'crlv_placeholder.jpg',
      'frontal': 'frontal_placeholder.jpg',
      'trasera': 'trasera_placeholder.jpg',
      'lateral_izquierdo': 'lateral_izquierdo_placeholder.jpg',
      'lateral_derecho': 'lateral_derecho_placeholder.jpg',
      'interior_frontal': 'interior_frontal_placeholder.jpg',
      'interior_trasero': 'interior_trasero_placeholder.jpg',
      'default': 'placeholder.jpg'
    };
    
    const placeholderName = imagePlaceholders[fileCategory] || imagePlaceholders.default;
    const imagePath = path.join(__dirname, 'public', placeholderName);
    
    // Intentar enviar el placeholder específico, si no existe enviar respuesta vacía
    try {
      if (require('fs').existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        console.log(`[MOCK] Placeholder not found: ${imagePath}, returning empty response`);
        res.status(200).end();
      }
    } catch (error) {
      console.error(`[MOCK] Error serving placeholder: ${error.message}`);
      res.status(200).end();
    }
  }
});

// Inicio del servidor
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  
  // Información sobre el modo de operación
  if (process.env.NODE_ENV === 'production') {
    console.log('Ejecutando en modo PRODUCCIÓN con optimizaciones activadas:');
    console.log('- Sistema anti-sleep');
    console.log('- Caché para endpoints GET');
    console.log('- Compresión HTTP');
    console.log('- Cabeceras de caché para archivos estáticos');
  } else {
    console.log('Ejecutando en modo DESARROLLO');
  }
}); 