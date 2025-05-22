#!/bin/bash

# Establecer la variable de entorno
export NEXT_PUBLIC_API_URL=http://localhost:3003/api

# Mostrar la variable para confirmar
echo "NEXT_PUBLIC_API_URL configurado como: $NEXT_PUBLIC_API_URL"

# Iniciar la aplicación
npm run dev 