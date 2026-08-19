const fs = require('fs');
const ts = require('typescript');

const code = fs.readFileSync('c:/Users/MB540WS/Downloads/Food App Management/PANCHAWATI BILLBOOK/frontend/src/pages/Inventory.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
  'Inventory.tsx',
  code,
  ts.ScriptTarget.Latest,
  true, // setParentNodes
  ts.ScriptKind.TSX
);

function traverse(node, depth = 0) {
    if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxSelfClosingElement || node.kind === ts.SyntaxKind.JsxFragment) {
        // console.log(" ".repeat(depth) + ts.SyntaxKind[node.kind]);
    }
    ts.forEachChild(node, child => traverse(child, depth + 1));
}

let diagnostics = sourceFile.parseDiagnostics;
if (diagnostics.length > 0) {
    diagnostics.forEach(diag => {
        let pos = sourceFile.getLineAndCharacterOfPosition(diag.start);
        console.log(`Error at line ${pos.line + 1}, col ${pos.character + 1}: ${diag.messageText}`);
        let line = code.split('\n')[pos.line];
        console.log(line);
        console.log(' '.repeat(pos.character) + '^');
    });
} else {
    console.log("No syntax errors found by TypeScript parser!");
}
