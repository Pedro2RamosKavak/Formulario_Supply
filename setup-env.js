// Script para configurar variables de entorno
const fs = require('fs');
const path = require('path');

const envContent = `# AWS S3 Credentials
AWS_REGION=sa-east-1
BUCKET=multimedia-form-pdr
AWS_ACCESS_KEY_ID=AKIA5DVBKYHWC7ARDZWW
AWS_SECRET_ACCESS_KEY=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

# API Endpoint
NEXT_PUBLIC_API_URL=http://localhost:3003/api
`;

// Crear .env en backend
const backendEnvPath = path.join(__dirname, 'apps', 'backend', '.env');
fs.writeFileSync(backendEnvPath, envContent);
console.log(`Archivo .env creado en: ${backendEnvPath}`);

// También en la raíz por si acaso
fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('Archivo .env creado en la raíz');

console.log('Variables de entorno configuradas correctamente.'); 