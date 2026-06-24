let executionFrames = [];
let currentMemory = {};
let callStack = []; 

self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: null
  });
};

// Updated to accept args
self.__pushStack = (funcName, args, line) => {
  callStack.push({ name: funcName, args: args });
  const argsString = args.map(a => JSON.stringify(a)).join(', ');
  
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `Called ${funcName}(${argsString})` // Log the call with args
  });
};

// Updated to format the return event with the original call signature
self.__popStack = (returnValue, line) => {
  const popped = callStack.pop() || { name: "global", args: [] };
  const argsString = popped.args.map(a => JSON.stringify(a)).join(', ');
  
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `${popped.name}(${argsString}) returned ${JSON.stringify(returnValue)}` // Log the return with args!
  });
};

self.onmessage = function(e) {
  const { instrumentedCode } = e.data;
  executionFrames = [];
  currentMemory = {};
  callStack = [];

  try {
    eval(instrumentedCode);
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};