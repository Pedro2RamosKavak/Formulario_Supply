# Sistema de Inspección de Vehículos - Kavak Supply

Este proyecto es un sistema completo de inspección de vehículos para **Kavak**, implementado como monorepo con tres aplicaciones principales que trabajan en conjunto para facilitar el proceso de inspección vehicular.

## 🏗️ Arquitectura del Sistema

### **1. Form App (Frontend)** - Puerto 3000
- **Función**: Formulario interactivo de 6 pasos para inspección vehicular
- **Deploy**: Vercel - https://formulario-supply-kavak.vercel.app
- **Tecnología**: Next.js 15, React 19, Tailwind CSS
- **Características**:
  - Formulario multi-paso intuitivo
  - Captura de fotos y videos desde móvil/desktop
  - Validación en tiempo real
  - Integración automática con Zapier

### **2. Review App (Dashboard)** - Puerto 3001  
- **Función**: Panel administrativo para revisar inspecciones
- **Deploy**: Vercel - https://kavak-inspections-review.vercel.app
- **Tecnología**: Next.js 15, React 19, Tailwind CSS
- **Características**:
  - Dashboard responsive con tabla optimizada
  - Visualización de imágenes con fallbacks inteligentes
  - Sistema de estados (pending/approved/rejected)
  - Tooltips para texto largo

### **3. Backend (API)** - Puerto 3003
- **Función**: API REST con integración AWS S3 y Zapier
- **Deploy**: Render - https://formulario-supply-kavak.onrender.com
- **Tecnología**: Express.js, AWS S3, Node.js
- **Características**:
  - Almacenamiento en AWS S3
  - Auto-deploy desde GitHub
  - Sistema de caché optimizado
  - Webhooks automáticos a Zapier

## 🛠️ Fixes y Mejoras Implementadas

### ✅ **1. Integración Zapier Completa** 
**Problema**: Zapier solo recibía webhook inicial, no el de formulario completo.

**Solución**:
- Envío automático a Zapier desde `/api/submit/final`
- Mapeo correcto de campos: `ownerName` → `name`
- Optimización de payload: ~800B vs ~3KB anterior
- **Resultado**: Dos webhooks correctos (inicial + completo)

### ✅ **2. Layout Visual Reparado**
**Problema**: Nombres/emails largos rompían el diseño de tabla.

**Solución**:
- Restricciones CSS: `max-w-[200px]` para nombres
- Truncado inteligente: 30 chars + "..." con tooltips
- Tabla responsive y consistente
- **Resultado**: Diseño limpio independiente de longitud de texto

### ✅ **3. Imágenes Móviles Funcionando** 
**Problema**: Imágenes de móvil no aparecían en review app.

**Solución**:
- Mapeo automático de URLs: `answers` → `fileUrls` para formato antiguo
- Regeneración de URLs firmadas S3 con 1 hora de expiración  
- Componente `ImageWithFallback` con estados de carga/error
- Endpoint de diagnóstico `/api/test/images/:id`
- **Resultado**: Todas las imágenes móviles aparecen correctamente

## 🚀 URLs de Producción

| Aplicación | URL | Estado |
|------------|-----|--------|
| **Form App** | https://formulario-supply-kavak.vercel.app | ✅ Activo |
| **Review App** | https://kavak-inspections-review.vercel.app | ✅ Activo |
| **Backend API** | https://formulario-supply-kavak.onrender.com | ✅ Activo |
| **Zapier Webhook** | https://hooks.zapier.com/hooks/catch/10702199/275d6f8/ | ✅ Activo |

## 📋 Endpoints API Principales

### **Formulario**
- `POST /api/submit` - Crear nueva inspección
- `POST /api/submit/final` - Completar inspección (+ Zapier automático)

### **Review/Administración** 
- `GET /api/review/list` - Listar todas las inspecciones
- `GET /api/review/:id` - Detalle de inspección específica
- `PATCH /api/review/:id` - Actualizar estado de inspección
- `DELETE /api/review/list` - Eliminar todas las inspecciones

### **Zapier**
- `POST /api/zapier` - Relay manual a webhook externo

### **Diagnóstico/Debug**
- `GET /api/debug/state` - Estado del sistema
- `GET /api/test/images/:id` - Test de accesibilidad de imágenes

## 🔧 Configuración Inicial

### **Prerequisitos**
- Node.js v18+
- npm/yarn
- Cuentas AWS S3 y Zapier (para producción)

### **Instalación Local**

1. **Clonar repositorio**:
   ```bash
   git clone <repositorio>
   cd vehicle-inspection
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de entorno** (opcional para desarrollo):
   ```bash
   # .env
   AWS_ACCESS_KEY_ID=tu_clave_aws
   AWS_SECRET_ACCESS_KEY=tu_secreto_aws
     AWS_REGION=sa-east-1
   BUCKET=multimedia-form-pdr
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/10702199/275d6f8/
     ```

### **Iniciar el Sistema**

```bash
# Opción 1: Iniciar todo con un comando
./start.sh

# Opción 2: Iniciar individualmente
cd apps/backend && npm run dev    # Puerto 3003
cd apps/form-app && npm run dev   # Puerto 3000  
cd apps/review-app && npm run dev # Puerto 3001
```

## 📁 Estructura del Proyecto

```
vehicle-inspection/
├── apps/
│   ├── backend/           # API Express.js + AWS S3
│   │   ├── src/app.js     # Servidor principal con todos los endpoints
│   │   └── src/lib/s3.js  # Funciones AWS S3
│   ├── form-app/          # Next.js - Formulario de inspección
│   │   ├── app/steps/     # Componentes de pasos del formulario
│   │   └── app/api/       # API routes de Next.js
│   └── review-app/        # Next.js - Dashboard administrativo
│       ├── app/page.tsx   # Lista de inspecciones
│       └── app/detail/    # Detalle de inspección específica
├── packages/
│   ├── ui/                # Componentes compartidos
│   └── types/             # TypeScript types compartidos
├── start.sh               # Script de inicio
├── README.md             # Este archivo
└── MOBILE_IMAGES_FIX.md  # Documentación del fix de imágenes
```

## 🎯 Flujo Completo del Sistema

1. **Usuario accede al formulario** → `formulario-supply-kavak.vercel.app`
2. **Completa inspección paso a paso** → Captura fotos/videos, llena datos
3. **Sistema envía automáticamente a Zapier** → Webhook inicial + completo
4. **Datos se almacenan en AWS S3** → Con URLs firmadas para acceso
5. **Admin revisa en dashboard** → `kavak-inspections-review.vercel.app`  
6. **Aprueba/rechaza inspección** → Estado actualizado en tiempo real

## 🧪 Testing y Debugging

### **Test de Endpoints**
```bash
# Test estado del backend
curl https://formulario-supply-kavak.onrender.com/api/debug/state

# Test lista de inspecciones  
curl https://formulario-supply-kavak.onrender.com/api/review/list

# Test imágenes específicas
curl https://formulario-supply-kavak.onrender.com/api/test/images/INSPECTION_ID
```

### **Herramientas de Debug**
- **Logs en tiempo real**: Render dashboard
- **Endpoint de diagnóstico**: `/api/debug/state`
- **Test de imágenes**: `/api/test/images/:id`
- **Console logs**: Disponibles en browser dev tools

## 📊 Estado Actual del Proyecto

| Componente | Estado | Última Actualización |
|------------|--------|---------------------|
| **Zapier Integration** | ✅ Completo | Mayo 23, 2024 |
| **Visual Layout** | ✅ Completo | Mayo 23, 2024 |
| **Mobile Images** | ✅ Completo | Mayo 23, 2024 |
| **Backend Optimizations** | ✅ Completo | Mayo 23, 2024 |
| **Auto-deployment** | ✅ Activo | Continuo |

## 🚀 Deploy y Versionado

- **Auto-deploy**: GitHub → Render (backend) y Vercel (frontends)
- **Commits importantes**:
  - `69f10b5` - Fix Zapier integration 
  - `f242009` - Fix visual layout
  - `f9b64bf` - Mobile images debugging
  - `d9a3a9a` - Complete mobile images fix

## 📄 Licencia

MIT License - Desarrollado para Kavak Supply Team

---

**💡 Proyecto completamente funcional y optimizado para producción**  
**🎯 Todos los issues principales resueltos**  
**🚀 Sistema robusto y escalable**
