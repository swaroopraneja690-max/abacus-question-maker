import fs from 'node:fs';
import path from 'node:path';

const folder = 'C:\\Users\\swaro\\OneDrive\\Desktop\\NEW PROJECT';
const outDir = 'C:\\Users\\swaro\\abacus-question-maker\\scripts\\samples';
fs.mkdirSync(outDir, { recursive: true });

function extractJpeg(src, out) {
  const bytes = fs.readFileSync(src);
  const latin = bytes.toString('latin1');
  const re = /(\d+)\s+0\s+obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g;
  let match;
  while ((match = re.exec(latin)) !== null) {
    const dict = match[2];
    if (!/DCTDecode/.test(dict) || !/Subtype\s*\/Image/.test(dict)) continue;
    const lenMatch = dict.match(/\/Length\s+(\d+)/);
    if (!lenMatch) continue;
    const len = Number(lenMatch[1]);
    const start = match.index + match[0].length;
    const jpeg = bytes.subarray(start, start + len);
    const w = dict.match(/\/Width\s+(\d+)/)?.[1];
    const h = dict.match(/\/Height\s+(\d+)/)?.[1];
    fs.writeFileSync(out, jpeg);
    console.log(`${path.basename(src)} -> ${path.basename(out)} (${w}x${h})`);
    return;
  }
  console.log(`${path.basename(src)} -> NO IMAGE`);
}

for (const name of fs.readdirSync(folder)) {
  if (!name.toLowerCase().endsWith('.pdf')) continue;
  const base = name.replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  extractJpeg(path.join(folder, name), path.join(outDir, `${base}.jpg`));
}

// Copy the .jpeg file too
for (const name of fs.readdirSync(folder)) {
  if (/\.(jpg|jpeg|png)$/i.test(name)) {
    fs.copyFileSync(path.join(folder, name), path.join(outDir, name));
    console.log(`${name} -> copied`);
  }
}
