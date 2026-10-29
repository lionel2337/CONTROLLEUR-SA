const fs = require('fs');

const path = 'C:/Users/USER/.gemini/antigravity/brain/b2b238f7-ea5e-4d4d-b1b1-d8ca7374c805/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const line223 = JSON.parse(lines[223]);
console.log('Keys in line223:', Object.keys(line223));

let text = '';
if (line223.content) {
  text = line223.content;
} else if (line223.tool_calls) {
  text = JSON.stringify(line223.tool_calls);
}

const start = text.indexOf('<!DOCTYPE html>');
if (start !== -1) {
  let html = text.substring(start);
  const end = html.lastIndexOf('</html>');
  if (end !== -1) html = html.substring(0, end + 7);

  // Unescape backslashes if stored as stringified code
  html = html.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');

  fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/salon_original_index.html', html, 'utf8');
  console.log('GREAT SUCCESS! Saved salon_original_index.html, length:', html.length);
} else {
  console.log('<!DOCTYPE html> not found in line 223');
}
