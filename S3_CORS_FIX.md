# 🔧 FIX: S3 CORS Configuration

## 🚨 **Problema Actual**
```
Access to fetch at 'https://multimedia-form-pdr.s3.sa-east-1.amazonaws.com/...' 
from origin 'https://kavak-supply-form-mf65flgdf-pedrodosramos-kavakcoms-projects.vercel.app' 
has been blocked by CORS policy
```

## ✅ **Lo que funciona:**
- ✅ Backend en Render funcionando
- ✅ URLs pre-firmadas generándose correctamente
- ✅ Integración con Zapier
- ✅ Formulario llegando hasta S3

## ❌ **El problema:**
El bucket S3 `multimedia-form-pdr` no tiene configuración CORS para permitir uploads desde Vercel.

---

## 🛠️ **SOLUCIÓN 1: Configurar CORS en S3 (AWS Console)**

### **Paso 1: Acceder a AWS Console**
1. Ve a [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Busca el bucket `multimedia-form-pdr`
3. Click en el bucket

### **Paso 2: Configurar CORS**
1. Ve a **Permissions** tab
2. Scroll hasta **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Reemplaza con esta configuración:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://*.vercel.app",
            "https://kavak-supply-form-mf65flgdf-pedrodosramos-kavakcoms-projects.vercel.app",
            "http://localhost:3000",
            "https://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id"
        ]
    }
]
```

### **Paso 3: Guardar**
- Click **Save changes**
- Esperar 1-2 minutos para propagación

---

## 🛠️ **SOLUCIÓN 2: Modificar Backend para incluir CORS**

Si no tienes acceso a AWS Console, modifica el backend:

### **En `apps/backend/src/lib/s3.js`:**

```javascript
export async function getUploadUrl(key, mime, expiresSec = 300) {
  const command = new PutObjectCommand({ 
    Bucket: BUCKET, 
    Key: key, 
    ContentType: mime,
    // Agregar metadata para CORS
    Metadata: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, POST, GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
  
  return getSignedUrl(s3, command, { 
    expiresIn: expiresSec,
    // Opcional: agregar parámetros adicionales
    signableHeaders: new Set(['host'])
  });
}
```

---

## 🛠️ **SOLUCIÓN 3: Upload via Backend (Más Confiable)**

Modificar el flujo para subir archivos a través del backend en lugar de directo a S3:

### **Nueva API en Backend:**

```javascript
// En apps/backend/src/app.js
apiRouter.post('/submit/upload', async (req, res) => {
  try {
    // Recibir archivos via multipart
    // Subir a S3 desde el backend
    // Retornar URLs finales
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## ⚡ **SOLUCIÓN RÁPIDA RECOMENDADA**

**Opción 1 es la más rápida** si tienes acceso a AWS Console:

1. **AWS Console** → **S3** → **multimedia-form-pdr**
2. **Permissions** → **CORS** → **Edit**
3. **Pegar la configuración** de arriba
4. **Save changes**
5. **Probar el formulario** en 2-3 minutos

---

## 🔍 **Testing después del fix**

1. **Abrir formulario** en Vercel
2. **Completar hasta paso 6**
3. **DevTools** → **Network** tab
4. **Verificar** que los uploads a S3 funcionen sin errores CORS

---

## 📋 **Si el problema persiste:**

1. **Verificar** que el dominio de Vercel esté en AllowedOrigins
2. **Limpiar caché** del navegador (Cmd+Shift+R)
3. **Probar** en modo incógnito
4. **Contactar** para implementar Solución 3 (upload via backend)

---

**Estado**: ⚠️ **Pendiente configuración CORS en S3** 