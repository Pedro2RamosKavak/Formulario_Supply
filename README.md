# Sistema de Inspección de Vehículos

Este proyecto consiste en un sistema completo para realizar inspecciones de vehículos, con tres aplicaciones principales:

1. **Form App (Puerto 3000)**: Aplicación para realizar inspecciones de vehículos, capturar fotos y videos.
2. **Review App (Puerto 3001)**: Panel administrativo para revisar y aprobar/rechazar inspecciones.
3. **Backend (Puerto 3003)**: Servidor API para almacenar y gestionar datos.

## Características

- Formulario de inspección completo e intuitivo
- Captura de fotos y videos del vehículo
- Panel administrativo para revisar inspecciones
- Integración con Zapier para notificaciones
- Almacenamiento de datos en Amazon S3

## Requisitos

- Node.js v18 o superior
- npm o yarn
- Cuentas en AWS S3 (opcional) y Zapier

## Configuración Inicial

1. Clona el repositorio:
   ```
   git clone <repositorio>
   cd vehicle-inspection
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno (opcional):
   - Crea un archivo `.env` en el directorio raíz
   - Configura las siguientes variables:
     ```
     AWS_ACCESS_KEY_ID=tu_clave_de_aws
     AWS_SECRET_ACCESS_KEY=tu_secreto_de_aws
     AWS_REGION=sa-east-1
     BUCKET=nombre_de_tu_bucket
     ```

## Uso

### Iniciar todas las aplicaciones

Simplemente ejecuta:

```
./start.sh
```

Este script inicia las tres aplicaciones y verifica que los puertos estén disponibles.

### Iniciar aplicaciones individualmente

Si prefieres iniciar las aplicaciones por separado:

```
# Backend
cd apps/backend
npm run dev

# Form App
cd apps/form-app
npm run dev

# Review App
cd apps/review-app
npm run dev
```

## Acceso

- Form App: http://localhost:3000
- Review App: http://localhost:3001
- Backend API: http://localhost:3003/api

## Integración con Zapier

El sistema está configurado para enviar datos a Zapier en dos momentos:

1. Al iniciar el formulario (datos iniciales)
2. Al completar la inspección (datos completos)

El webhook de Zapier está configurado en:
`https://hooks.zapier.com/hooks/catch/10702199/275d6f8/`

## Estructura del Proyecto

```
vehicle-inspection/
├── apps/
│   ├── backend/        # API y servidor
│   ├── form-app/       # Aplicación de formulario
│   └── review-app/     # Panel de revisión administrativo
├── packages/
│   ├── ui/             # Componentes UI compartidos
│   └── types/          # Tipos compartidos
└── start.sh            # Script para iniciar todo el sistema
```

## Tecnologías utilizadas

- **Backend**: Express.js, AWS S3
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Monorepo**: Turborepo
- **Componentes UI compartidos**: Tailwind + React

## Licencia

MIT # Deploy trigger Fri May 23 14:55:17 -03 2025
