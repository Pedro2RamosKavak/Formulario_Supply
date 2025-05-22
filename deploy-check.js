/**
 * Script para verificar que todo está listo para el despliegue
 * Ejecutar: node deploy-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== VERIFICACIÓN PRE-DESPLIEGUE ===${colors.reset}\n`);

// Verificar package.json
const checkPackageJson = () => {
  console.log(`${colors.magenta}Verificando configuración de package.json...${colors.reset}`);
  let success = true;
  
  try {
    // Backend
    const backendPackage = JSON.parse(fs.readFileSync('./apps/backend/package.json', 'utf8'));
    
    // Verificar script start
    if (!backendPackage.scripts || !backendPackage.scripts.start) {
      console.log(`${colors.red}✗ El backend no tiene un script 'start' definido${colors.reset}`);
      success = false;
    } else {
      console.log(`${colors.green}✓ Script 'start' encontrado: ${backendPackage.scripts.start}${colors.reset}`);
    }
    
    // Verificar dependencias críticas
    const requiredDeps = ['express', 'cors', 'dotenv'];
    for (const dep of requiredDeps) {
      if (!backendPackage.dependencies[dep]) {
        console.log(`${colors.red}✗ Falta dependencia crítica: ${dep}${colors.reset}`);
        success = false;
      }
    }
    
    // Verificar módulo de compresión
    if (!backendPackage.dependencies.compression) {
      console.log(`${colors.yellow}! Recomendación: Instalar 'compression' para mejor rendimiento${colors.reset}`);
      console.log(`  npm install compression --save`);
    } else {
      console.log(`${colors.green}✓ Módulo de compresión instalado${colors.reset}`);
    }
    
    console.log(`${colors.green}✓ package.json del backend verificado${colors.reset}`);
  } catch (err) {
    console.log(`${colors.red}✗ Error al leer package.json del backend: ${err.message}${colors.reset}`);
    success = false;
  }
  
  return success;
};

// Verificar archivos necesarios para optimizaciones
const checkOptimizationFiles = () => {
  console.log(`\n${colors.magenta}Verificando archivos de optimización...${colors.reset}`);
  let success = true;
  
  // Archivos que deben existir
  const requiredFiles = [
    './apps/backend/src/keep-alive.js',
    './apps/backend/src/cache-control.js'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`${colors.green}✓ Archivo encontrado: ${file}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Archivo no encontrado: ${file}${colors.reset}`);
      success = false;
    }
  }
  
  return success;
};

// Verificar que el código usa las optimizaciones
const checkCodeOptimizations = () => {
  console.log(`\n${colors.magenta}Verificando implementación de optimizaciones...${colors.reset}`);
  let success = true;
  
  try {
    const appJs = fs.readFileSync('./apps/backend/src/app.js', 'utf8');
    
    // Verificar importaciones
    if (!appJs.includes('import { setupKeepAlive }') && !appJs.includes("require('./keep-alive.js')")) {
      console.log(`${colors.red}✗ No se encontró la importación de 'keep-alive.js'${colors.reset}`);
      success = false;
    } else {
      console.log(`${colors.green}✓ Sistema anti-sleep importado${colors.reset}`);
    }
    
    if (!appJs.includes('setupStaticCache') && !appJs.includes("require('./cache-control.js')")) {
      console.log(`${colors.red}✗ No se encontró la importación de 'cache-control.js'${colors.reset}`);
      success = false;
    } else {
      console.log(`${colors.green}✓ Sistema de caché importado${colors.reset}`);
    }
    
    // Verificar uso
    if (!appJs.includes('setupKeepAlive(app)')) {
      console.log(`${colors.red}✗ No se encontró la inicialización del sistema anti-sleep${colors.reset}`);
      success = false;
    } else {
      console.log(`${colors.green}✓ Sistema anti-sleep inicializado${colors.reset}`);
    }
    
    if (!appJs.includes('cacheApiResponse')) {
      console.log(`${colors.yellow}! Advertencia: No se encontró uso de caché para endpoints${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Sistema de caché para API implementado${colors.reset}`);
    }
    
    if (!appJs.includes('compression')) {
      console.log(`${colors.yellow}! Advertencia: No se encontró uso de compresión HTTP${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Compresión HTTP implementada${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}✗ Error al leer app.js: ${err.message}${colors.reset}`);
    success = false;
  }
  
  return success;
};

// Verificar que no hay archivos sensibles o temporales
const checkSensitiveFiles = () => {
  console.log(`\n${colors.magenta}Verificando archivos sensibles...${colors.reset}`);
  
  const sensitivePatterns = [
    '**/.env',
    '**/node_modules',
    '**/.DS_Store',
    '**/tmp',
    '**/temp',
    '**/*.log'
  ];
  
  let foundSensitiveFiles = false;
  
  for (const pattern of sensitivePatterns) {
    try {
      // Usar find para buscar archivos que coincidan con el patrón
      const result = execSync(`find . -path "${pattern}" -not -path "./node_modules/*" | head -n 5`, { encoding: 'utf8' });
      
      if (result.trim()) {
        console.log(`${colors.yellow}! Archivos sensibles encontrados (patrón ${pattern}):${colors.reset}`);
        console.log(result.split('\n').slice(0, 5).map(f => `  - ${f}`).join('\n'));
        foundSensitiveFiles = true;
      }
    } catch (err) {
      // Ignorar errores de find
    }
  }
  
  if (!foundSensitiveFiles) {
    console.log(`${colors.green}✓ No se encontraron archivos sensibles${colors.reset}`);
  } else {
    console.log(`${colors.yellow}! Considere agregar estos archivos a .gitignore o eliminarlos antes del despliegue${colors.reset}`);
  }
  
  return !foundSensitiveFiles;
};

// Ejecutar todas las verificaciones
const packageJsonOk = checkPackageJson();
const optimizationFilesOk = checkOptimizationFiles();
const codeOptimizationsOk = checkCodeOptimizations();
const sensitiveFilesOk = checkSensitiveFiles();

// Resultado final
console.log(`\n${colors.bright}${colors.blue}=== RESULTADO ====${colors.reset}`);

if (packageJsonOk && optimizationFilesOk && codeOptimizationsOk && sensitiveFilesOk) {
  console.log(`\n${colors.bright}${colors.green}✅ ¡Todo listo para el despliegue!${colors.reset}`);
  console.log('\nRecomendaciones para el despliegue en Render:\n');
  console.log('1. Configura estas variables de entorno:');
  console.log('   - NODE_ENV=production');
  console.log('   - PORT=10000 (Render asigna este automáticamente)');
  console.log('   - BACKEND_URL=https://tu-app.onrender.com');
  console.log('   - CORS_ORIGIN=https://tu-form-app.vercel.app,https://tu-review-app.vercel.app');
  console.log('   - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET (para S3)');
  console.log('   - ZAPIER_WEBHOOK_URL (para integración Zapier)');
  console.log('\n2. Configura el Build Command: npm install');
  console.log('3. Configura el Start Command: cd apps/backend && npm start');
  console.log('\n¡Buena suerte con tu despliegue! 🚀');
} else {
  console.log(`\n${colors.bright}${colors.red}❌ Se encontraron problemas que deben resolverse antes del despliegue.${colors.reset}`);
  console.log('\nPor favor, corrige los problemas marcados y vuelve a ejecutar esta verificación.');
} 