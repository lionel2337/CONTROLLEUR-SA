const fs = require('fs');

const path = 'C:/Users/USER/.gemini/antigravity/brain/b2b238f7-ea5e-4d4d-b1b1-d8ca7374c805/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('js/client.js') && line.includes('<!DOCTYPE html>')) {
    try {
      const obj = JSON.parse(line);
      let content = '';
      if (obj.content) content = obj.content;
      else if (obj.tool_calls) content = JSON.stringify(obj.tool_calls);

      const start = content.indexOf('<!DOCTYPE html>');
      if (start !== -1) {
        let html = content.substring(start);
        const end = html.lastIndexOf('</html>');
        if (end !== -1) html = html.substring(0, end + 7);
        html = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');

        fs.writeFileSync(`c:/Users/USER/Documents/controlleur SA/public/salon_tablet_index_${i}.html`, html, 'utf8');
        console.log(`FOUND TABLET HTML at line ${i}! Length: ${html.length}`);
      }
    } catch (e) {}
  }
}
