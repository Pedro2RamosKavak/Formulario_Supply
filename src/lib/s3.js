import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.BUCKET;
const s3 = new S3Client({ region: REGION });

export async function getUploadUrl(key, mime, expiresSec = 300) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mime });
  return getSignedUrl(s3, command, { expiresIn: expiresSec });
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
  const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'meta/' }));
  return (Contents || []).map(obj => obj.Key);
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