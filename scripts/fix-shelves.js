const fs = require('fs');

const content = fs.readFileSync('src/services/fridgeLayoutService.ts', 'utf8');

// Fix all shelf definitions with position: number to position: object
const fixed = content.replace(
  /\{ id: '([^']+)', name: '([^']+)', position: (\d+), capacity: ([^}]+) \}/g,
  (match, id, name, pos, capacity) => {
    const y = parseInt(pos) * 10;
    const type = id.includes('drawer') ? 'drawer' : id.includes('legumeira') ? 'drawer' : 'shelf';
    return `{ id: '${id}', name: '${name}', type: '${type}', position: { x: 0, y: ${y}, width: 100, height: 10 }, capacity: ${capacity}, products: [] }`;
  }
);

fs.writeFileSync('src/services/fridgeLayoutService.ts', fixed);
console.log('Fixed shelves in fridgeLayoutService.ts');
