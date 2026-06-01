const fs = require('fs');
const path = require('path');

function extractArticleText(filePath) {
  const s = fs.readFileSync(filePath, 'utf8');
  const m = s.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const content = m ? m[1] : s;
  // remove JSX expressions { ... }
  let t = content.replace(/\{[\s\S]*?\}/g, ' ');
  // remove tags
  t = t.replace(/<[^>]+>/g, ' ');
  // replace common HTML entities with spaces
  t = t.replace(/&[a-zA-Z0-9#]+;/g, ' ');
  // collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

const pages = [
  { label: 'Terms', file: 'src/app/terms/page.tsx' },
  { label: 'Privacy', file: 'src/app/privacy-policy/page.tsx' },
];

const wpm = 200;

for (const p of pages) {
  const fp = path.resolve(process.cwd(), p.file);
  if (!fs.existsSync(fp)) {
    console.error(`${p.label}: file not found: ${fp}`);
    continue;
  }
  const text = extractArticleText(fp);
  const words = countWords(text);
  const mins = words / wpm;
  const rounded = Math.max(1, Math.round(mins));
  console.log(`${p.label}: words=${words}, minutes (exact)=${mins.toFixed(2)}, minutes (rounded)=${rounded}`);
}
