import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules', '@techstark', 'opencv-js', 'dist', 'opencv.js');
const targetDir = path.join(root, 'public', 'vendor', 'opencv');
const target = path.join(targetDir, 'opencv.js');

if (!fs.existsSync(source)) {
  console.warn('[copy-opencv] @techstark/opencv-js not installed; skipping.');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log('[copy-opencv] copied opencv.js to public/vendor/opencv/');
