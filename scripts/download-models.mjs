import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const modelsDir = path.join(process.cwd(), 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api@latest/model/';
const files = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      resolve(res);
    }).on('error', reject);
  });
}

async function downloadFile(file) {
  const filePath = path.join(modelsDir, file);
  console.log(`Downloading ${file}...`);
  const res = await fetch(`${baseUrl}${file}`);
  const ws = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    res.pipe(ws);
    ws.on('finish', () => { ws.close(); resolve(); });
    ws.on('error', reject);
  });
  const stat = fs.statSync(filePath);
  console.log(`  -> ${file} (${stat.size} bytes)`);
}

async function downloadAll() {
  for (const file of files) {
    try {
      await downloadFile(file);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }
  console.log('Done.');
}

downloadAll();
