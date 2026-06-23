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

self.__pushStack = (funcName, line) => {
  callStack.push(funcName);
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `Called ${funcName}()` // Log the call
  });
};

// Updated to accept returnValue
self.__popStack = (returnValue, line) => {
  const poppedName = callStack.pop() || "global";
  executionFrames.push({
    memory: structuredClone(currentMemory),
    stack: [...callStack],
    line: line,
    event: `${poppedName}() returned ${JSON.stringify(returnValue)}` // Log the return!
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