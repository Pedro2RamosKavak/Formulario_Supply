import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.S3_BUCKET!;
const PREFIX = 'inspecciones/';

export async function saveInspection(inspection: any) {
  const key = `${PREFIX}${inspection.id}.json`;
  const body = JSON.stringify(inspection, null, 2);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/json',
  }));
}

export async function getAllInspections() {
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: PREFIX,
  }));
  if (!list.Contents) return [];
  const files = list.Contents.filter(obj => obj.Key && obj.Key.endsWith('.json'));
  const results = await Promise.all(files.map(async (file) => {
    const id = file.Key!.replace(PREFIX, '').replace('.json', '');
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: file.Key! }));
      const body = await streamToString(obj.Body);
      return JSON.parse(body);
    } catch {
      return null;
    }
  }));
  return results.filter(Boolean);
}

export async function getInspectionById(id: string) {
  const key = `${PREFIX}${id}.json`;
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await streamToString(obj.Body);
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function deleteAllInspections() {
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: PREFIX,
  }));
  if (!list.Contents) return 0;
  let count = 0;
  for (const file of list.Contents) {
    if (file.Key && file.Key.endsWith('.json')) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file.Key }));
      count++;
    }
  }
  return count;
}

// Helper para convertir stream a string
async function streamToString(stream: any): Promise<string> {
  if (typeof stream === 'string') return stream;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
} 