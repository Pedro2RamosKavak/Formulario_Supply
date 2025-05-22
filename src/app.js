import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getUploadUrl, getReadUrl, putJson, getJson, listMetaKeys, deleteAllMetaJson } from './lib/s3.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post('/submit', async (req, res) => {
  try {
    const { email, requiredFiles } = req.body;
    const id = uuidv4();
    const fileKeys = {};
    const uploadUrls = {};
    const files = requiredFiles || [
      'crlvPhoto',
      'safetyItemsPhoto',
      'windshieldPhoto',
      'lightsPhoto',
      'tiresPhoto',
      'videoFile'
    ];
    for (const file of files) {
      const ext = file === 'videoFile' ? '.mp4' : '.jpg';
      const key = `uploads/${id}_${file}${ext}`;
      fileKeys[file] = key;
      const mime = file === 'videoFile' ? 'video/mp4' : 'image/jpeg';
      uploadUrls[file] = await getUploadUrl(key, mime);
    }
    res.json({ id, uploadUrls });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/submit/final', async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: 'Falta el id de la inspección' });
    const createdAt = new Date().toISOString();
    const meta = {
      id,
      ...rest,
      status: 'pending',
      createdAt,
      uploadHistory: [
        { status: 'pending', date: createdAt }
      ]
    };
    await putJson(`meta/${id}.json`, meta);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/review/list', async (req, res) => {
  try {
    const keys = await listMetaKeys();
    const metas = await Promise.all(
      (keys || []).slice(-100).map(getJson)
    );
    metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(metas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/review/:id', async (req, res) => {
  try {
    const meta = await getJson(`meta/${req.params.id}.json`);
    res.json(meta);
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.patch('/review/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const key = `meta/${req.params.id}.json`;
    const meta = await getJson(key);
    meta.status = status;
    meta.reviewedAt = new Date().toISOString();
    await putJson(key, meta);
    res.status(204).end();
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/review/list', async (req, res) => {
  try {
    const deleted = await deleteAllMetaJson();
    res.json({ deleted });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 