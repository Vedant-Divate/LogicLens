let executionFrames = [];
let currentMemory = {};
let callStack = []; // NEW: Track active function calls

self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack], // Save a copy of the stack with every variable update!
    line: line
  });
};

// NEW: When a function starts
self.__pushStack = (funcName, line) => {
  callStack.push(funcName);
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line
  });
};

// NEW: When a function ends
self.__popStack = (line) => {
  callStack.pop();
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line
  });
};

self.onmessage = function(e) {
  const { instrumentedCode } = e.data;
  executionFrames = [];
  currentMemory = {};
  callStack = []; // Reset stack

  try {
    eval(instrumentedCode);
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};