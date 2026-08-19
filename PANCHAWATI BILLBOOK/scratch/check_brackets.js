const fs = require('fs');
const content = fs.readFileSync('c:/Users/MB540WS/Downloads/Food App Management/PANCHAWATI BILLBOOK/frontend/src/pages/Inventory.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let j = 0; j < line.length; j++) {
    let char = line[j];
    if (char === '{' || char === '(' || char === '<') {
      // Ignore `<` for tags for now, just check `{` and `(`
      if (char === '{' || char === '(') {
        stack.push({ char, line: i + 1, col: j + 1 });
      }
    } else if (char === '}' || char === ')') {
      if (stack.length === 0) {
        console.log(`Unmatched closing ${char} at line ${i + 1}:${j + 1}`);
      } else {
        let last = stack.pop();
        if ((char === '}' && last.char !== '{') || (char === ')' && last.char !== '(')) {
          console.log(`Mismatched closing ${char} at line ${i + 1}:${j + 1}. Expected closing for ${last.char} from line ${last.line}:${last.col}`);
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed brackets:');
  stack.forEach(s => console.log(`- ${s.char} at line ${s.line}:${s.col}`));
} else {
  console.log('All brackets balanced!');
}
