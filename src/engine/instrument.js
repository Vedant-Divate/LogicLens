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
      // If it's an empty return (return;), just pop
      if (!path.node.argument) {
        const line = path.node.loc.start.line;
        path.insertBefore(
          parse(`__popStack(undefined, ${line});`).program.body[0]
        );
        return;
      }

      // Prevent infinite loops from our own injected code
      if (path.node.__instrumented) return;
      path.node.__instrumented = true;

      const line = path.node.loc.start.line;
      // Generate a unique variable name like "_retVal"
      const tempName = path.scope.generateUid("retVal");
      
      // Transform: return X;
      // Into: let _retVal = X; __popStack(_retVal, line); return _retVal;
      const newNodes = parse(`let ${tempName} = 0; __popStack(${tempName}, ${line}); return ${tempName};`).program.body;
      
      // Replace the '0' with the actual return expression
      newNodes[0].declarations[0].init = path.node.argument;
      
      path.replaceWithMultiple(newNodes);
    }
  });

  const output = generate(ast).code;
  return output;
}