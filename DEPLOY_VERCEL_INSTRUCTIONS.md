# 🚀 Instrucciones para Deploy en Vercel

## 📋 **Pre-requisitos Verificados** ✅
- [x] APIs conflictivos eliminados
- [x] Botón "Voltar" implementado 
- [x] vercel.json configurado
- [x] Código compilando correctamente

## 🚀 **OPCIÓN 1: Deploy desde Vercel Dashboard**

### **Paso 1: Acceder a Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión en tu cuenta
3. Busca tu proyecto existente o crea uno nuevo

### **Paso 2: Configurar el Proyecto**
Si es un **proyecto nuevo**:
- **Framework Preset**: Next.js
- **Root Directory**: `apps/form-app`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detectado)
- **Install Command**: `npm install`

### **Paso 3: Configurar Variables de Entorno** ⚠️ **CRÍTICO**
En Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://formulario-supply-kavak.onrender.com
NEXT_PUBLIC_ENV = production
```

### **Paso 4: Deploy**
- Haz click en **Deploy**
- Espera que termine el build (2-3 minutos)

---

## 🚀 **OPCIÓN 2: Deploy con Vercel CLI**

### **Instalar Vercel CLI**
```bash
npm i -g vercel
```

### **Deploy desde terminal**
```bash
# Ir al directorio del form-app
cd apps/form-app

# Hacer login en Vercel
vercel login

# Configurar proyecto (primera vez)
vercel

# Deploy a producción
vercel --prod
```

---

## ⚙️ **Configuraciones Importantes**

### **vercel.json** ✅ Ya configurado
```json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

### **Variables de Entorno Requeridas**
```
NEXT_PUBLIC_API_URL=https://formulario-supply-kavak.onrender.com
NEXT_PUBLIC_ENV=production
```

---

## 🔍 **Verificar Deploy Exitoso**

### **1. Verificar URL**
- Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### **2. Test en Navegador**
1. Abrir la URL
2. Completar formulario hasta paso 6
3. Abrir **DevTools** → **Network**
4. **Verificar** que las llamadas van a:
   - ✅ `https://formulario-supply-kavak.onrender.com/api/submit`
   - ❌ NO a URLs de Vercel

### **3. Test de Botones**
- ✅ Botón "Voltar" funciona en pasos 2-6
- ✅ Botón "Próximo" funciona en pasos 1-5
- ✅ Botón "Enviar inspeção" funciona en paso 6
- ✅ NO aparece "Voltar" en paso 7 (pantalla final)

---

## 🚨 **Si algo sale mal**

### **Error de Build**
```bash
# Verificar build local
cd apps/form-app
npm run build
```

### **Error 413 (Content Too Large)**
- Verificar que las variables de entorno estén configuradas
- Verificar que no haya APIs locales restantes

### **Calls van a endpoints incorrectos**
- Limpiar caché del navegador (Cmd+Shift+R)
- Verificar variables de entorno en Vercel Dashboard

---

## ✅ **Checklist Final**

- [ ] Deploy completado sin errores
- [ ] Variables de entorno configuradas
- [ ] Formulario carga correctamente
- [ ] Botones de navegación funcionan
- [ ] Llamadas van al backend correcto (Render)
- [ ] Archivos se suben a S3 exitosamente

---

**🎉 ¡Listo para producción!** 