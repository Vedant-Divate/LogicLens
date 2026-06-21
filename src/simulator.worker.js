// This array will hold our "movie" of the code execution
let executionFrames = [];
let currentMemory = {};

// The function Babel injected will call this
self.__traceVariable = (name, value) => {
  // Save the current state of this variable
  currentMemory[name] = value;
  
  // Take a snapshot of the memory at this exact moment
  executionFrames.push({
    memory: { ...currentMemory } // Clone the memory so it doesn't mutate later
  });
};

// Listen for messages from our React app
self.onmessage = function(e) {
  const { instrumentedCode } = e.data;

  // Reset state for a new run
  executionFrames = [];
  currentMemory = {};

  try {
    // Execute the modified code!
    // 'eval' runs the string as real JavaScript
    eval(instrumentedCode);
    
    // Tell the UI it finished successfully and pass back the frames
    self.postMessage({ type: 'finished', frames: executionFrames });
  } catch (error) {
    // If user code has a syntax error or crashes, catch it safely
    self.postMessage({ type: 'error', message: error.message });
  }
};