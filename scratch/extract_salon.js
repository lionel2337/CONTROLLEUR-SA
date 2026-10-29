const fs = require('fs');

const logFile = 'C:/Users/USER/.gemini/antigravity/brain/4d118422-e002-4207-8f7c-4f002bb5e37b/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(logFile, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('Pointage Arriv') && line.includes('Pointage Arrivée')) {
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

        fs.writeFileSync('c:/Users/USER/Documents/controlleur SA/public/salon_original_index.html', html, 'utf8');
        console.log('Saved salon_original_index.html from line ' + i + ', length: ' + html.length);
        if (html.length > 5000) break;
      }
    } catch (e) {}
  }
}
