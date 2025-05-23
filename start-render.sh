#!/bin/bash

# Script para iniciar la aplicación en Render
echo "Iniciando script de despliegue para Render..."

# Verificar la estructura de directorios
echo "Verificando estructura de directorios..."
ls -la

# Verificar si existe la carpeta apps/backend
if [ -d "apps/backend" ]; then
  echo "✅ Directorio apps/backend encontrado"
else
  echo "❌ Error: No se encontró el directorio apps/backend"
  echo "Listando contenido de la carpeta apps:"
  if [ -d "apps" ]; then
    ls -la apps/
  else
    echo "❌ Error: No se encontró la carpeta apps"
    echo "Contenido del directorio actual:"
    ls -la
  fi
  exit 1
fi

# Verificar el package.json del backend
if [ -f "apps/backend/package.json" ]; then
  echo "✅ package.json encontrado en apps/backend"
else
  echo "❌ Error: No se encontró package.json en apps/backend"
  exit 1
fi

# Configurar variables de entorno para producción
echo "NODE_ENV=production" > apps/backend/.env
if [ ! -z "$BACKEND_URL" ]; then
  echo "BACKEND_URL=$BACKEND_URL" >> apps/backend/.env
fi
if [ ! -z "$CORS_ORIGIN" ]; then
  echo "CORS_ORIGIN=$CORS_ORIGIN" >> apps/backend/.env
fi
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> apps/backend/.env
fi
if [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> apps/backend/.env
fi
if [ ! -z "$AWS_REGION" ]; then
  echo "AWS_REGION=$AWS_REGION" >> apps/backend/.env
fi
if [ ! -z "$BUCKET" ]; then
  echo "BUCKET=$BUCKET" >> apps/backend/.env
fi
if [ ! -z "$ZAPIER_WEBHOOK_URL" ]; then
  echo "ZAPIER_WEBHOOK_URL=$ZAPIER_WEBHOOK_URL" >> apps/backend/.env
fi

echo "Variables de entorno configuradas en apps/backend/.env"

# Iniciar el servidor backend
echo "Iniciando el servidor backend..."
cd apps/backend && npm start 