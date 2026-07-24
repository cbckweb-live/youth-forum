import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

let content = readFileSync(envPath, 'utf8');
let lines = content.split('\n');

// Remove lines with stray backticks or duplicate sentry URLs
let cleaned = lines.filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('```')) return false;
  if (trimmed.startsWith('https://225853ffed006472793846a42689e9b2@o4511737737117696.ingest.us.sentry.io/4511737809207301')) return false;
  return true;
});

// Deduplicate SENTRY entries - keep only the last occurrence of each
const seen = new Set();
let finalLines = [];
for (let i = cleaned.length - 1; i >= 0; i--) {
  const line = cleaned[i];
  const key = line.split('=')[0];
  if (line.includes('=') && !line.startsWith('#') && line.trim() !== '') {
    if (seen.has(key)) continue;
    seen.add(key);
  }
  finalLines.push(line);
}
finalLines.reverse();

writeFileSync(envPath, finalLines.join('\n') + '\n');
console.log(`Cleaned .env.local: ${lines.length} lines -> ${finalLines.length} lines`);
