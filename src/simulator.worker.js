let executionFrames = [];
let currentMemory = {};
let callStack = [];
let consoleLogs = [];

// Intercept console.log inside the worker!
const originalLog = console.log;
console.log = (...args) => {
  const logString = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  consoleLogs.push(logString);
  originalLog.apply(console, args); // Still print to browser dev tools
};

self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: null,
    logs: [...consoleLogs]
  });
};

self.__pushStack = (funcName, args, line) => {
  callStack.push({ name: funcName, args: args });
  const argsString = args.map(a => JSON.stringify(a)).join(', ');
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `Called ${funcName}(${argsString})`,
    logs: [...consoleLogs]
  });
};

self.__popStack = (returnValue, line) => {
  const popped = callStack.pop() || { name: "global", args: [] };
  const argsString = popped.args.map(a => JSON.stringify(a)).join(', ');
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `${popped.name}(${argsString}) returned ${JSON.stringify(returnValue)}`,
    logs: [...consoleLogs]
  });
};

// NEW: Dedicated hook for console.log to create an immediate step
self.__traceLog = (line, ...args) => {
  const logString = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  consoleLogs.push(logString);
  
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: null,
    logs: [...consoleLogs]
  });
};

self.onmessage = function(e) {
  const { instrumentedCode } = e.data;
  executionFrames = [];
  currentMemory = {};
  callStack = [];
  consoleLogs = [];

  try {
    eval(instrumentedCode);
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    consoleLogs.push(`⚠️ Error: ${error.message}`);
    try {
      // Try to save the state where it crashed
      executionFrames.push({
        memory: structuredClone(currentMemory),
        stack: [...callStack],
        line: 0,
        event: 'Execution Halted',
        logs: [...consoleLogs]
      });
    } catch (cloneError) {
      // If memory is unclonable (like a cyclic object), push empty memory
      executionFrames.push({
        memory: {},
        stack: [...callStack],
        line: 0,
        event: 'Execution Halted (Memory Unclonable)',
        logs: [...consoleLogs]
      });
    }
    self.postMessage({ type: 'finished', frames: executionFrames });
  }
};