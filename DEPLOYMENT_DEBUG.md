# 🔧 Debugging Guide: Form App → Backend Integration

## ✅ **Estado Actual**
- **Backend**: ✅ Funcionando en https://formulario-supply-kavak.onrender.com
- **Frontend**: ⚠️ Desplegado en Vercel con errores de integración

## 🔍 **Problemas Identificados y Solucionados**

### **1. Funciones Faltantes** ✅ RESUELTO
- ❌ `handleSubmit` no estaba definida
- ❌ `handlePrevious` no estaba definida  
- ❌ Variables no definidas en `sendInitialData`
- ✅ **Solución**: Agregué todas las funciones faltantes

### **2. Variables de Entorno** ✅ CONFIGURADO
```bash
# Configurar en Vercel Dashboard
NEXT_PUBLIC_API_URL=https://formulario-supply-kavak.onrender.com
NEXT_PUBLIC_ENV=production
```

### **3. Endpoints del Backend** ✅ VERIFICADO
- `/api/submit` - Para obtener URLs pre-firmadas
- `/api/submit/final` - Para enviar datos finales
- `/api/zapier` - Para integración con Zapier

## 🚀 **Pasos para Deployment en Vercel**

### **Paso 1: Configurar Variables de Entorno en Vercel**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   ```
   NEXT_PUBLIC_API_URL = https://formulario-supply-kavak.onrender.com
   NEXT_PUBLIC_ENV = production
   ```

### **Paso 2: Verificar Build Commands**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### **Paso 3: Deployment Settings en Vercel**
- **Framework Preset**: Next.js
- **Root Directory**: `apps/form-app`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detectado)

## 🔍 **Debugging Steps**

### **1. Verificar Logs en Vercel**
```bash
# En Vercel Dashboard → Functions tab
# Buscar errores en las function logs
```

### **2. Testear Endpoints Manualmente**
```bash
# Test 1: Verificar que el backend esté funcionando
curl https://formulario-supply-kavak.onrender.com/api/health

# Test 2: Verificar endpoint de submit
curl -X POST https://formulario-supply-kavak.onrender.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","requiredFiles":["crlvFile","videoFile"]}'
```

### **3. Verificar CORS**
- El backend ya tiene CORS configurado correctamente
- Vercel debe poder comunicarse sin problemas

### **4. Console Debugging**
En el frontend (navegador), verificar:
```javascript
// Abrir DevTools → Console
console.log('Backend URL:', process.env.NEXT_PUBLIC_API_URL);
```

## 🚨 **Errores Comunes y Soluciones**

### **Error: "Network Error" o "Failed to fetch"**
```javascript
// Verificar en el código que la URL esté correcta
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://formulario-supply-kavak.onrender.com';
console.log('Using backend URL:', backendUrl);
```

### **Error: "Environment variable not found"**
1. Verificar que las variables estén en Vercel Dashboard
2. Redeploy después de agregar variables
3. Verificar que empiecen con `NEXT_PUBLIC_`

### **Error: "CORS policy"**
- El backend ya tiene CORS configurado
- Si persiste, agregar el dominio de Vercel a las variables de entorno del backend

## 📝 **Checklist Pre-Deploy**

- [ ] Variables de entorno configuradas en Vercel
- [ ] Build sin errores localmente
- [ ] Backend endpoints funcionando
- [ ] CORS configurado correctamente
- [ ] Archivos de configuración actualizados

## 🔄 **Próximos Pasos**

1. **Configurar variables en Vercel**
2. **Redeploy la aplicación**
3. **Testear el formulario completo**
4. **Verificar integración con Zapier**
5. **Optimizar performance si es necesario**

---

## 📊 **URLs de Testing**

- **Backend Health**: https://formulario-supply-kavak.onrender.com/health
- **Backend API**: https://formulario-supply-kavak.onrender.com/api/
- **Frontend**: [URL de Vercel deployment]

¿Cuál es el error específico que estás viendo en Vercel? Con esta información puedo ayudarte a resolverlo más precisamente. 