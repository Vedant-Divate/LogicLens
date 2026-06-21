let executionFrames = [];
let currentMemory = {};

// Updated to accept the 'line' parameter
self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  
  executionFrames.push({
    memory: { ...currentMemory },
    line: line // Save the line number!
  });
};

self.onmessage = function(e) {
  const { instrumentedCode } = e.data;
  executionFrames = [];
  currentMemory = {};

  try {
    eval(instrumentedCode);
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};