const fs = require('fs');
const content = fs.readFileSync('database.sql', 'utf8');

const match = content.match(/INSERT INTO `phones`[^\n]*A54[^\n]*/);
if (match) {
    const jsonMatch = match[0].match(/'(\[\{"name"[\s\S]*?\}\])'/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            console.log('JSON parsed successfully! Color name:', parsed[0].name, 'Photos length:', parsed[0].photos.length);
        } catch(e) {
            console.error('Parse failed:', e.message);
        }
    } else {
        console.log('JSON match not found');
    }
} else {
    console.log('Phone 4 not found');
}

