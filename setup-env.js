// Script para configurar variables de entorno
const fs = require('fs');
const path = require('path');

const envContent = `# AWS S3 Credentials
AWS_REGION=sa-east-1
BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_HERE

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