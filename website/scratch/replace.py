import os
import glob

replacements = {
    "color: 'white'": "color: 'var(--text-primary)'",
    "color: 'white',": "color: 'var(--text-primary)',",
    "color: \"white\"": "color: 'var(--text-primary)'",
    "'#0A0A0F'": "'var(--bg-main)'",
    "#0A0A0F": "var(--bg-main)",
    "#0F0800": "var(--bg-card)",
    "#080508": "var(--bg-card)",
    "rgba(10,10,15,0)": "rgba(250,244,235,0)"
}

files = glob.glob('src/components/**/*.jsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Done modifying components')
