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
        // 4. Track Function Calls
    FunctionDeclaration(path) {
      const funcName = path.node.id.name;
      const line = path.node.loc.start.line;
      
      // NEW: Grab the parameter names (e.g., ["n"])
      const paramNames = path.node.params
        .filter(p => p.type === 'Identifier')
        .map(p => p.name);
      
      // Create an array string to pass the values at runtime, e.g., [n]
      const argsArrayString = `[${paramNames.join(', ')}]`;
      
      // Inject at the very beginning of the function body
      path.node.body.body.unshift(
        parse(`__pushStack("${funcName}", ${argsArrayString}, ${line});`).program.body[0]
      );
    },
    // 5. NEW: Track Function Returns
    
        // 5. Track Function Returns
        // 5. Track Function Returns
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

      const line = path.node.loc.start.line;
      const tempName = path.scope.generateUid("retVal");
      
      const newNodes = parse(
        `let ${tempName} = 0; __popStack(${tempName}, ${line}); return ${tempName};`,
        { allowReturnOutsideFunction: true }
      ).program.body;
      
      // Replace the '0' with the actual return expression
      newNodes[0].declarations[0].init = path.node.argument;
      
      // CRITICAL FIX: Mark the newly generated return statement so Babel ignores it!
      const newReturnNode = newNodes[2]; // Index 0 is let, 1 is __popStack, 2 is return
      if (newReturnNode) {
        newReturnNode.__instrumented = true;
      }
      
      path.replaceWithMultiple(newNodes);
    }
  });

  const output = generate(ast).code;
  return output;
}