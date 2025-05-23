import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

// Usar directamente las credenciales sin dotenv
const AWS_ACCESS_KEY_ID = 'AKIA5DVBKYHWC7ARDZWW';
const AWS_SECRET_ACCESS_KEY = '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';
const AWS_REGION = 'sa-east-1';
const BUCKET = 'multimedia-form-pdr';

async function testS3Connection() {
  try {
    console.log('Creando cliente S3...');
    const s3 = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('Conectando a S3...');
    const { Buckets } = await s3.send(new ListBucketsCommand({}));
    console.log('Conexión exitosa!');
    console.log('Buckets:', Buckets.map(b => b.Name).join(', '));
    
    const bucketExists = Buckets.some(b => b.Name === BUCKET);
    if (bucketExists) {
      console.log();
    } else {
      console.log();
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testS3Connection();
