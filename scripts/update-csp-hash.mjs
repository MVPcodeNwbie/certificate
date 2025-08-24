import fs from 'fs';
import crypto from 'crypto';

const htmlPath = 'build/index.html';
if(!fs.existsSync(htmlPath)) { console.error('Build first.'); process.exit(1); }
const html = fs.readFileSync(htmlPath,'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/i);
if(!m){ console.error('No inline script found'); process.exit(1);} 
const body = m[1].trim();
const hash = 'sha256-' + crypto.createHash('sha256').update(body).digest('base64');
console.log('Computed inline script hash:', hash);
console.log('Add to firebase.json script-src like: script-src \'self\' '+hash+';');
