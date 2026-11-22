import fs from 'node:fs';

const src = process.argv[2] ?? 'C:\\Users\\swaro\\OneDrive\\Desktop\\NEW PROJECT\\Level -1 Age - 5 to 10 years.pdf';
const out = process.argv[3] ?? 'C:\\Users\\swaro\\abacus-question-maker\\scripts\\sample-grade1.jpg';

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
  fs.writeFileSync(out, jpeg);
  const w = dict.match(/\/Width\s+(\d+)/)?.[1];
  const h = dict.match(/\/Height\s+(\d+)/)?.[1];
  console.log(`Extracted obj ${match[1]} -> ${out} (${jpeg.length} bytes, ${w}x${h})`);
  process.exit(0);
}
console.error('No JPEG image found');
process.exit(1);
