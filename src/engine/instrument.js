import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

// Vite uses ESM, but Babel packages are often CJS. 
// We need to grab the .default property if it exists.
const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

/**
 * Takes raw JavaScript code, parses it, injects tracing hooks,
 * and returns the modified code string.
 */
export function instrumentCode(sourceCode) {
  // 1. Parse the code into an AST
  const ast = parse(sourceCode, {
    sourceType: "module",
    plugins: ["jsx", "typescript"] // Allow basic JS/JSX
  });

  // 2. Traverse the AST to find variable declarations
  traverse(ast, {
    VariableDeclarator(path) {
      // Only track variables that have a name (ignore destructuring for now)
      if (path.node.id.type === 'Identifier') {
        const varName = path.node.id.name;
        
        // 3. Create the tracing function call AST node
        const traceCall = parse(`__traceVariable("${varName}", ${varName});`).program.body[0];
        
        // 4. Insert it immediately AFTER the current declaration
        path.getStatementParent().insertAfter(traceCall);
      }
    }
  });

  // 5. Turn the modified AST back into a string
  const output = generate(ast).code;
  return output;
}