const fs = require('fs');

const path = 'C:/Users/USER/.gemini/antigravity/brain/b2b238f7-ea5e-4d4d-b1b1-d8ca7374c805/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

[133, 233, 245, 293].forEach(lineIdx => {
  if (lines[lineIdx]) {
    const obj = JSON.parse(lines[lineIdx]);
    let text = JSON.stringify(obj);
    const start = text.indexOf('<!DOCTYPE html>');
    if (start !== -1) {
      let html = text.substring(start);
      const end = html.lastIndexOf('</html>');
      if (end !== -1) html = html.substring(0, end + 7);
      html = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');

      fs.writeFileSync(`c:/Users/USER/Documents/controlleur SA/public/salon_original_index_${lineIdx}.html`, html, 'utf8');
      console.log(`Saved salon_original_index_${lineIdx}.html! Length:`, html.length);
    }
  }
});
