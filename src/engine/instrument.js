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
    // 1. Track initial declarations
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
      if (path.node.left.type === 'Identifier') {
        const varName = path.node.left.name;
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      } else if (path.node.left.type === 'MemberExpression') {
        let rootObj = path.node.left.object;
        while (rootObj.object) rootObj = rootObj.object;
        if (rootObj.type === 'Identifier') {
          const varName = rootObj.name;
          const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
          path.getStatementParent().insertAfter(traceCall);
        }
      }
    },
    // 3. Track increments
    UpdateExpression(path) {
      if (path.node.argument.type === 'Identifier') {
        const varName = path.node.argument.name;
        const line = path.node.loc.start.line;
        const traceCall = parse(`typeof ${varName} !== 'undefined' && __traceVariable("${varName}", ${varName}, ${line});`).program.body[0];
        path.getStatementParent().insertAfter(traceCall);
      }
    },
    // 4. NEW: Track Function Calls
    FunctionDeclaration(path) {
      const funcName = path.node.id.name;
      const line = path.node.loc.start.line;
      // Inject at the very beginning of the function body
      path.node.body.body.unshift(
        parse(`__pushStack("${funcName}", ${line});`).program.body[0]
      );
    },
    // 5. NEW: Track Function Returns
    ReturnStatement(path) {
      const line = path.node.loc.start.line;
      // Inject right before the return happens
      path.insertBefore(
        parse(`__popStack(${line});`).program.body[0]
      );
    }
  });

  const output = generate(ast).code;
  return output;
}