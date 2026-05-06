const fs = require('fs');
let content = fs.readFileSync('src/data/fridgeModelsDatabase.ts', 'utf8');
content = content.replace(/image_url:/g, 'image:');
fs.writeFileSync('src/data/fridgeModelsDatabase.ts', content);
console.log('Updated image_url to image in fridgeModelsDatabase.ts');
