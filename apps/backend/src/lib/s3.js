import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('Inicializando cliente S3');
console.log('REGION:', REGION);
console.log('BUCKET:', BUCKET);
console.log('AWS_ACCESS_KEY_ID:', AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 5)}...` : 'No definido');
console.log('AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? 'Configurado (oculto)' : 'No definido');

const s3 = new S3Client({ 
  region: REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

export async function getUploadUrl(key, mime, expiresSec = 300) {
  const command = new PutObjectCommand({ 
    Bucket: BUCKET, 
    Key: key, 
    ContentType: mime,
    // Configuración adicional para ayudar con CORS
    CacheControl: 'max-age=31536000',
    ServerSideEncryption: 'AES256'
  });
  
  return getSignedUrl(s3, command, { 
    expiresIn: expiresSec,
    // Especificar headers que deben firmarse
    signableHeaders: new Set(['host', 'content-type']),
    // Usar algoritmo específico
    signingRegion: process.env.AWS_REGION || 'sa-east-1'
  });
}

export async function getReadUrl(key, expiresSec = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresSec });
}

export async function putJson(key, data) {
  const body = Buffer.from(JSON.stringify(data));
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/json',
  }));
}

export async function getJson(key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of Body) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function listMetaKeys() {
  const { Contents: metaContents } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'meta/' }));
  return (metaContents || []).map(obj => obj.Key);
}

export async function listInspectionFolders() {
  const { CommonPrefixes } = await s3.send(new ListObjectsV2Command({ 
    Bucket: BUCKET, 
    Prefix: 'inspections/', 
    Delimiter: '/'
  }));
  return (CommonPrefixes || []).map(prefix => prefix.Prefix);
}

export async function getObjectsInFolder(folderPrefix) {
  const { Contents } = await s3.send(new ListObjectsV2Command({ 
    Bucket: BUCKET, 
    Prefix: folderPrefix
  }));
  return Contents || [];
}

export async function deleteAllMetaJson() {
  const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'meta/' }));
  let count = 0;
  for (const obj of Contents || []) {
    if (obj.Key && obj.Key.endsWith('.json')) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
      count++;
    }
  }
  return count;
} 