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
        
        // Use typeof check to prevent ReferenceError if variable is block-scoped
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      }
    },
    // 2. Track updates (i = i + 1, sum += 5)
    AssignmentExpression(path) {
      if (path.node.left.type === 'Identifier') {
        const varName = path.node.left.name;
        const line = path.node.loc.start.line;
        
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
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