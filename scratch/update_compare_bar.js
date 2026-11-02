const fs = require('fs');
const file = 'Website-frontend/src/components/CompareBar.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix + + Add Phone
content = content.replace(
  '<span className="text-[11px] font-medium">+ Add Phone</span>',
  '<span className="text-[11px] font-medium">Add Phone</span>'
);

// 2. Change Compare Now button style
const oldStyle = 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer';
const newStyle = 'bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-sm hover:scale-[1.02] cursor-pointer';

if (content.includes(oldStyle)) {
  content = content.replace(oldStyle, newStyle);
  console.log('Compare Now style updated');
}

fs.writeFileSync(file, content, 'utf8');
console.log('CompareBar.jsx saved');

