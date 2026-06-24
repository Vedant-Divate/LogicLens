let executionFrames = [];
let currentMemory = {};
let callStack = [];
let consoleLogs = []; // NEW: Track console logs

// Intercept console.log!
const originalLog = console.log;
console.log = (...args) => {
  // Convert objects/arrays to strings so they render nicely
  const logString = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  consoleLogs.push(logString);
  originalLog(...args); // Still print to browser dev tools just in case
};

self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: null,
    logs: [...consoleLogs] // Save current logs with the frame
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

self.onmessage = function(e) {
  const { instrumentedCode } = e.data;
  executionFrames = [];
  currentMemory = {};
  callStack = [];
  consoleLogs = []; // Reset logs

  try {
    eval(instrumentedCode);
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    // NEW: Send errors back as a special frame so they show in the console UI
    consoleLogs.push(`⚠️ Error: ${error.message}`);
    executionFrames.push({
      memory: structuredClone(currentMemory),
      stack: [...callStack],
      line: 0, // Unknown line for runtime error
      event: 'Execution Halted',
      logs: [...consoleLogs]
    });
    self.postMessage({ type: 'finished', frames: executionFrames });
  }
};