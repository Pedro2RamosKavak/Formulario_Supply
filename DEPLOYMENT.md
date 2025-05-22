# Guía de Despliegue en Render

Esta guía detalla los pasos para desplegar este proyecto en Render, aprovechando su capa gratuita con optimizaciones para evitar el "sleep" y mejorar el rendimiento.

## 1. Preparar el código para el despliegue

Antes de subir el código a GitHub o desplegar directamente, asegúrate de que:

1. Todos los archivos sensibles están en `.gitignore`
2. Los módulos de optimización están implementados:
   - `keep-alive.js` para mantener el servicio activo
   - `cache-control.js` para optimizar el rendimiento
3. El `package.json` del backend tiene el script `start` configurado

Para verificar esta preparación, ejecuta:
```bash
node deploy-check.js
```

## 2. Crear una cuenta en Render

1. Visita [render.com](https://render.com) y regístrate
2. Conecta tu cuenta de GitHub si deseas usar despliegue automático desde un repositorio

## 3. Configurar el Backend (Web Service)

1. En el dashboard de Render, selecciona "New Web Service"
2. Conecta tu repositorio de GitHub o sube el código directamente
3. Configura los siguientes ajustes:
   - **Name**: `vehicle-inspection-backend` (o el nombre que prefieras)
   - **Region**: Selecciona el más cercano a tus usuarios
   - **Root Directory**: `/` (raíz del repositorio)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `cd apps/backend && npm start`
   - **Plan**: Free tier

4. En la sección "Environment Variables", añade las siguientes variables:
   ```
   NODE_ENV=production
   PORT=10000
   BACKEND_URL=https://tu-app.onrender.com
   CORS_ORIGIN=https://tu-form-app.vercel.app,https://tu-review-app.vercel.app
   AWS_ACCESS_KEY_ID=tu_clave_aws
   AWS_SECRET_ACCESS_KEY=tu_secreto_aws
   AWS_REGION=sa-east-1
   BUCKET=tu_bucket_s3
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/10702199/275d6f8/
   ```

5. Haz clic en "Create Web Service"

## 4. Configurar Form App en Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com) si aún no tienes
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Configura las siguientes opciones:
   - **Framework**: Next.js
   - **Root Directory**: `apps/form-app`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_API_URL=https://tu-backend-render.onrender.com/api
     ```
5. Haz clic en "Deploy"

## 5. Configurar Review App en Vercel

1. En tu dashboard de Vercel, haz clic en "New Project"
2. Importa el mismo repositorio de GitHub
3. Configura las siguientes opciones:
   - **Framework**: Next.js
   - **Root Directory**: `apps/review-app`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_API_URL=https://tu-backend-render.onrender.com/api
     ```
4. Haz clic en "Deploy"

## 6. Optimizaciones implementadas

El backend incluye varias optimizaciones para funcionar en el plan gratuito de Render:

### Sistema Anti-Sleep

El módulo `keep-alive.js` implementa un sistema que:
- Crea un endpoint `/api/ping` que responde rápidamente
- Realiza auto-pings periódicos cada 14 minutos para mantener el servicio activo
- Evita que Render duerma la aplicación después de 15 minutos de inactividad

### Sistema de Caché

El módulo `cache-control.js` implementa:
- Caché para respuestas API (30-60 segundos)
- Cabeceras de caché para archivos estáticos (imágenes, videos)
- Limpieza periódica de caché para evitar consumo excesivo de memoria

### Compresión HTTP

El middleware de compresión reduce el ancho de banda y mejora los tiempos de carga.

## 7. Verificación y monitoreo

Después del despliegue:

1. Verifica que el backend responde en `https://tu-app.onrender.com/api/ping`
2. Comprueba que las aplicaciones front-end pueden comunicarse con el backend
3. Realiza una inspección de prueba para verificar todo el flujo

## 8. Limitaciones del plan gratuito

El plan gratuito de Render:
- Tiene 750 horas/mes de tiempo de ejecución
- Se duerme tras 15 minutos de inactividad, pero nuestro sistema anti-sleep evita esto
- Proporciona suficiente para ~250 inspecciones/mes
- Tiene ancho de banda limitado a 100 GB/mes

El plan gratuito de Vercel:
- No tiene restricciones de sueño/wake
- Proporciona suficiente para miles de cargas de página al mes
- Tiene limitaciones en tiempo de construcción pero no afecta a este proyecto

## 9. Actualización de variables de entorno

Si necesitas cambiar las variables de entorno:

1. Ve al dashboard de Render > Tu servicio > Environment
2. Actualiza las variables necesarias
3. Haz clic en "Save Changes"
4. El servicio se reiniciará automáticamente

## 10. Solución de problemas

Si el servicio no responde correctamente:

1. Verifica los logs en el dashboard de Render
2. Comprueba que las variables de entorno sean correctas
3. Verifica que los dominios en CORS_ORIGIN coincidan con tus URLs de Vercel
4. Asegúrate de que las credenciales de AWS S3 sean válidas

## 11. Actualización de código

Para actualizar el código:
1. Si usas GitHub, simplemente haz push a tu rama principal
2. Si subes directamente, vuelve a desplegar en Render y Vercel con los mismos ajustes

## Notas adicionales

- Render ofrece una prueba gratuita de 90 días del plan Pro que evita el sueño automáticamente.
- Para producción a gran escala, considera actualizar a un plan de pago.
- Considera añadir supervisión con New Relic o Sentry para monitorear el rendimiento. 