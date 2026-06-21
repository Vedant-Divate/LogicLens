let executionFrames = [];
let currentMemory = {};

self.__traceVariable = (name, value, line) => {
  currentMemory[name] = value;
  
  // DEEP CLONE the memory so arrays/objects don't mutate past frames!
  executionFrames.push({
    memory: structuredClone(currentMemory),
    line: line
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