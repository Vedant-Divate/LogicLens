import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

export function instrumentCode(sourceCode) {
  // SAFETY CHECK: Ensure we always pass a string to Babel
  if (typeof sourceCode !== 'string' || sourceCode.trim() === '') {
    return ''; // Return empty string if code is empty or undefined
  }

  // 1. Parse the code into an AST
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
    // NEW: Track variables inside for-loop headers (i, j)
    ForStatement(path) {
      if (path.node.__instrumented) return;
      
      // Ensure the loop body is a block statement { ... }
      if (path.node.body.type !== 'BlockStatement') {
        path.node.body = { type: 'BlockStatement', body: [path.node.body] };
      }
      
      const varsToTrace = new Set();
      
      // 1. Find variables in the init statement (let i = 0)
      if (path.node.init && path.node.init.type === 'VariableDeclaration') {
        path.node.init.declarations.forEach(dec => {
          if (dec.id.type === 'Identifier') varsToTrace.add(dec.id.name);
        });
      }
      
      // 2. Find variables in the update statement (i++)
      if (path.node.update && path.node.update.type === 'UpdateExpression' && path.node.update.argument.type === 'Identifier') {
        varsToTrace.add(path.node.update.argument.name);
      }
      
      // 3. Inject tracking hooks at the START of the loop body
      const traceNodes = Array.from(varsToTrace).map(v => {
        const node = parse(`typeof ${v} !== 'undefined' && __traceVariable("${v}", ${v}, ${path.node.loc.start.line});`).program.body[0];
        node.__instrumented = true;
        return node;
      });
      
      path.node.body.body.unshift(...traceNodes);
      path.node.__instrumented = true;
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
    },
    
    // 6. Intercept console.log to create an immediate frame
    CallExpression(path) {
      if (path.node.__instrumented) return;

      const callee = path.node.callee;
      if (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'log'
      ) {
        const line = path.node.loc.start.line;
        const args = path.node.arguments;
        
        // Safely convert arguments back to code strings
        const argsString = args.map(arg => generate(arg).code).join(', ');
        
        // SAFETY CHECK: Ensure argsString isn't empty
        const codeToParse = argsString.length > 0 
          ? `__traceLog(${line}, ${argsString})` 
          : `__traceLog(${line})`;
          
        const traceCall = parse(codeToParse).program.body[0].expression;
        traceCall.__instrumented = true;
        path.replaceWith(traceCall);
      }
    }
  });

  const output = generate(ast).code;
  return output;
}