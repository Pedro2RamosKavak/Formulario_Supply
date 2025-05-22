import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

export async function compressVideo(buffer) {
  const inputPath = `${tmpdir()}/${randomUUID()}.mp4`;
  const outputPath = `${tmpdir()}/${randomUUID()}-out.mp4`;
  await fs.writeFile(inputPath, buffer);
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .size('?x1280')
      .outputOptions('-preset veryfast', '-crf 28')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
  const outBuffer = await fs.readFile(outputPath);
  await fs.unlink(inputPath);
  await fs.unlink(outputPath);
  if (outBuffer.length > 10 * 1024 * 1024) throw new Error('Compressed video > 10MB');
  return outBuffer;
} 