#!/bin/bash
# Script para preparar el entorno en Vercel
# Crea el paquete @types/shared simplificado para evitar errores TypeScript

echo "🔧 Preparando entorno para compilación en Vercel..."

# Crear estructura de directorios
mkdir -p packages/types/dist

# Crear package.json simple
echo '{"name":"@types/shared","version":"0.0.0","private":true,"main":"./dist/index.js","types":"./dist/index.d.ts","scripts":{"build":"exit 0"}}' > packages/types/package.json

# Crear archivos JS y TS vacíos
echo "export {};" > packages/types/dist/index.js
echo "export {};" > packages/types/dist/index.d.ts

# Confirmar éxito
echo "✅ Entorno preparado para compilación" 