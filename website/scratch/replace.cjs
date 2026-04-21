const fs = require('fs');
const path = require('path');

const replacements = {
    "color: 'white'": "color: 'var(--text-primary)'",
    "color: 'white',": "color: 'var(--text-primary)',",
    'color: "white"': "color: 'var(--text-primary)'",
    "'#0A0A0F'": "'var(--bg-main)'",
    "#0A0A0F": "var(--bg-main)",
    "#0F0800": "var(--bg-card)",
    "#080508": "var(--bg-card)",
    "rgba(10,10,15,0)": "rgba(250,244,235,0)"
};

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, '../src/components'));

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    for (const [k, v] of Object.entries(replacements)) {
        content = content.split(k).join(v);
    }
    fs.writeFileSync(f, content, 'utf8');
});

console.log('Done modifying components');
