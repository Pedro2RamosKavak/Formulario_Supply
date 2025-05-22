# Integración con AWS S3 - Formulario de Inspección Vehicular

Este proyecto implementa un formulario de inspección vehicular con capacidad para subir imágenes y videos a AWS S3.

## Configuración del entorno

Para que la integración con AWS S3 funcione correctamente, necesitas configurar las credenciales de AWS en un archivo `.env.local`:

1. Crea un archivo `.env.local` en la raíz del directorio `apps/form-app` con el siguiente contenido:

```
# AWS S3 Configuration
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY_AQUI
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY_AQUI
S3_BUCKET=kavak-inspection-files
```

2. Reemplaza `TU_ACCESS_KEY_AQUI` y `TU_SECRET_KEY_AQUI` con tus credenciales reales de AWS.
3. Asegúrate de tener un bucket S3 llamado `kavak-inspection-files` o cambia el nombre por tu bucket real.
4. Configura las políticas CORS en tu bucket S3 para permitir cargas desde tu dominio.

## Modos de funcionamiento

El sistema está diseñado para funcionar en dos modos:

1. **Modo real**: Cuando se proporcionan credenciales de AWS válidas, el sistema utiliza S3 para almacenar archivos.
2. **Modo simulación**: Cuando no hay credenciales o son inválidas, el sistema simula la carga a S3 usando endpoints locales.

## Desarrollo local sin AWS

Si estás desarrollando localmente y no tienes acceso a AWS, el sistema funcionará en modo simulación automáticamente.
En este modo:

- Las URL generadas apuntan a `/api/upload-mock` en tu servidor local
- Los archivos no se guardan realmente, pero se simula el proceso
- Todo el flujo funciona para pruebas de UI y desarrollo
- La consola del servidor mostrará mensajes indicando que está en modo simulación

## Confirmación de funcionamiento

Puedes verificar si está funcionando en modo real o simulación revisando:

1. La consola del servidor muestra `[S3-CONFIG] Modo: REAL S3` si las credenciales son correctas
2. La respuesta de la API incluye `"mode":"real"` si está usando S3 real

## Depuración

Si tienes problemas con las cargas a S3:

1. Verifica tus credenciales en `.env.local`
2. Asegúrate de que tu bucket S3 exista y tenga los permisos correctos
3. Revisa la configuración CORS del bucket
4. Consulta los logs del servidor para ver errores detallados

## Soporte

Si necesitas ayuda adicional, contacta al equipo de desarrollo. 