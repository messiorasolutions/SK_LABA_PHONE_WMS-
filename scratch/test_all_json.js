const fs = require('fs');
const content = fs.readFileSync('database.sql', 'utf8');

const lines = content.split(/\r?\n/);

let totalJsonChecked = 0;
let errors = [];

lines.forEach((line, lineNum) => {
    if (!line.startsWith('INSERT INTO')) return;
    
    // Find all single-quoted segments that look like JSON arrays or objects
    const matches = line.match(/'(\[[\s\S]*?\]|\{[\s\S]*?\})'/g);
    if (!matches) return;

    matches.forEach(m => {
        const raw = m.slice(1, -1);
        // Only test if it looks like json
        if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
            try {
                JSON.parse(raw);
                totalJsonChecked++;
            } catch(e) {
                errors.push({ lineNum: lineNum + 1, error: e.message, snippet: raw.slice(0, 80) });
            }
        }
    });
});

console.log('Total JSON values checked:', totalJsonChecked);
if (errors.length === 0) {
    console.log('ALL JSON VALUES IN database.sql ARE 100% VALID!');
} else {
    console.error('Errors found:', errors);
}

