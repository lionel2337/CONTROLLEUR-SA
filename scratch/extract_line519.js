const fs = require('fs');

const path = 'C:/Users/USER/.gemini/antigravity/brain/b2b238f7-ea5e-4d4d-b1b1-d8ca7374c805/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const line519 = JSON.parse(lines[519]);
let text = JSON.stringify(line519);

const start = text.indexOf('<!DOCTYPE html>');
if (start !== -1) {
  let html = text.substring(start);
  const end = html.lastIndexOf('</html>');
  if (end !== -1) html = html.substring(0, end + 7);

  // Clean json escaping
  html = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');

  fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/salon_original_index.html', html, 'utf8');
  console.log('BOOM! Saved salon_original_index.html, length:', html.length);
} else {
  console.log('Not found');
}
