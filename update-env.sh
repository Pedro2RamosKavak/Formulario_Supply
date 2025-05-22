#!/bin/bash

# Actualizar el archivo .env.local de form-app
echo "NEXT_PUBLIC_API_URL=http://localhost:3003/api" > apps/form-app/.env.local

# Actualizar el archivo .env.local de review-app si existe
if [ -f "apps/review-app/.env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:3003/api" > apps/review-app/.env.local
fi

echo "Los archivos .env.local han sido actualizados para usar el puerto 3003" 