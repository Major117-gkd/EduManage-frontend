const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
let changedFiles = 0;

files.forEach(file => {
    if (!file.match(/\.(jsx|css|js)$/)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace old hover with new hover
    content = content.replace(/#1e40af/gi, '#06204a'); // darker hover
    // Replace old primary with new primary (#0A2F6B)
    content = content.replace(/#1d4ed8/gi, '#0A2F6B');
    
    // Replace multi-colors in Home.jsx
    if (file.endsWith('Home.jsx')) {
        content = content.replace(/#2563eb/gi, '#0A2F6B');
        content = content.replace(/#3b82f6/gi, '#1a4e9b'); 
        content = content.replace(/#60a5fa/gi, '#2b6dc4'); 
    }
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Updated ${changedFiles} files with the new blue theme.`);
