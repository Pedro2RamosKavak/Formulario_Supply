# 🚨 FIX CRÍTICO: Problema de Vercel Solucionado

## ✅ **Problema Identificado y Solucionado**

**Error Original**: `413 (Content Too Large)` y llamadas a endpoints incorrectos

**Causa**: APIs locales de Next.js estaban interceptando las llamadas al backend externo.

## 🔧 **Soluciones Aplicadas**

### **1. Limpieza de APIs Conflictivos** ✅ COMPLETADO
```bash
# Eliminados los siguientes archivos/carpetas:
- apps/form-app/app/api/submit-form/     # ← Estaba interceptando las llamadas
- apps/form-app/app/debug/               # ← Debug innecesario  
- apps/form-app/app/api/debug-form/      # ← Conflicto adicional
- apps/form-app/app/api/upload-mock/     # ← No necesario en producción
```

### **2. Configuración de Vercel** ✅ AÑADIDO
```json
// vercel.json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

### **3. Variables de Entorno para Vercel** ⚠️ PENDIENTE
```bash
# Configurar en Vercel Dashboard → Settings → Environment Variables:
NEXT_PUBLIC_API_URL=https://formulario-supply-kavak.onrender.com
NEXT_PUBLIC_ENV=production
```

## 🚀 **Pasos para Deployment**

### **Paso 1: Configurar Variables en Vercel**
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega:
   - `NEXT_PUBLIC_API_URL` = `https://formulario-supply-kavak.onrender.com`
   - `NEXT_PUBLIC_ENV` = `production`

### **Paso 2: Redeploy**
```bash
# Opción 1: Desde la interfaz de Vercel
# Dashboard → Deployments → Redeploy

# Opción 2: Push a Git (si está conectado)
git add .
git commit -m "Fix: Eliminar APIs conflictivos y configurar Vercel"
git push
```

### **Paso 3: Verificar el Fix**
Después del deployment, verificar en la consola del navegador que:
- ✅ Las llamadas van a `https://formulario-supply-kavak.onrender.com/api/submit`
- ✅ No aparecen errores `413 (Content Too Large)`
- ✅ Los archivos se suben correctamente a S3

## 📋 **Configuración de Zapier Webhook**

### **En Zapier:**
1. Crea un nuevo Zap
2. Trigger: **Webhooks by Zapier** → **Catch Hook**
3. Copia la URL del webhook (ej: `https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/`)
4. Configúrala en el backend o como variable de entorno

### **En el Backend (apps/backend/src/app.js):**
El endpoint `/api/zapier` ya está configurado para recibir y procesar los datos iniciales.

## 🔍 **Testing**

### **1. Test del Backend**
```bash
curl -X POST https://formulario-supply-kavak.onrender.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","requiredFiles":["crlvFile","videoFile"]}'
```

### **2. Test del Frontend**
1. Ir a la URL de Vercel
2. Completar el formulario hasta el paso 6
3. Verificar en DevTools → Network que las llamadas van al backend correcto

## ⚡ **Optimizaciones Adicionales**

### **Límites de Archivo Recomendados:**
- **Videos**: Máximo 100MB (el límite de 37MB del ejemplo está bien)
- **Imágenes**: Máximo 10MB cada una
- **Total por formulario**: Máximo 200MB

### **Performance:**
- Los archivos se suben directamente a S3 (no pasan por Vercel)
- El formulario solo envía URLs de S3 al final
- Zapier recibe notificaciones por separado

## 🚨 **Si el problema persiste:**

1. **Verificar las variables de entorno** en Vercel Dashboard
2. **Limpiar caché** del navegador y hacer hard refresh (Cmd+Shift+R)
3. **Verificar logs** en Vercel Functions tab
4. **Contactar** si hay errores específicos en S3 o el backend

---

**Estado**: ✅ **SOLUCIONADO** - Listo para redeploy en Vercel 