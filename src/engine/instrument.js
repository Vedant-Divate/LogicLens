import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

export function instrumentCode(sourceCode) {
  const ast = parse(sourceCode, {
    sourceType: "module",
    plugins: ["jsx", "typescript"]
  });

  traverse(ast, {
    // 1. Track initial declarations (let x = 5)
    VariableDeclarator(path) {
      if (path.node.id.type === 'Identifier') {
        const varName = path.node.id.name;
        const line = path.node.loc.start.line;
        
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      }
    },
    // 2. Track updates
    AssignmentExpression(path) {
      const line = path.node.loc.start.line;
      
      // Case A: Normal variable update (x = 5)
      if (path.node.left.type === 'Identifier') {
        const varName = path.node.left.name;
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      } 
      // Case B: Array or Object mutation (arr[0] = 5 or obj.prop = 5)
      else if (path.node.left.type === 'MemberExpression') {
        // We need to get the root object name (e.g., from arr[0][1], get "arr")
        let rootObj = path.node.left.object;
        while (rootObj.object) {
          rootObj = rootObj.object;
        }
        
        if (rootObj.type === 'Identifier') {
          const varName = rootObj.name;
          // We trace the whole object again so we can see the updated state
          const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
          path.getStatementParent().insertAfter(traceCall);
        }
      }
    },
    // 3. Track increments (i++)
    UpdateExpression(path) {
      if (path.node.argument.type === 'Identifier') {
        const varName = path.node.argument.name;
        const line = path.node.loc.start.line;
        
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      }
    }
  });

  const output = generate(ast).code;
  return output;
}