import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { instrumentCode } from './engine/instrument';
import './App.css';
import { Play, Pause, RotateCcw, Microscope, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { snippets } from './snippets';

function App() {
  const [code, setCode] = useState(`let arr = [10, 20, 30];
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum = sum + arr[i];
}`);
  const [isRunning, setIsRunning] = useState(false);
  const [frames, setFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // NEW: Auto-play state
  const [speed, setSpeed] = useState(800);
  // const currentLogs = frames.length > 0 ? frames[currentStep].logs : [];
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // NEW: Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      // If we reach the end, stop playing
      if (currentStep >= frames.length - 1) {
        setIsPlaying(false);
        return;
      }
      
      // Set a timer to advance to the next step
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed); // Use speed state here
      
      // Cleanup timer if component unmounts or step changes manually
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, frames]);

  // Refs for Monaco Editor to control line highlighting
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // This effect runs whenever the user steps forward/backward
  useEffect(() => {
    if (editorRef.current && frames.length > 0) {
      const currentLine = frames[currentStep].line;
      
      // Clear old highlight, add new one
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: { startLineNumber: currentLine, endLineNumber: currentLine, startColumn: 1, endColumn: 1 },
          options: {
            isWholeLine: true,
            className: 'line-highlight', // We will style this in CSS
            glyphClass: 'line-glyph'     // A little arrow in the margin
          }
        }
      ]);
      
      // Scroll to the line if it's off-screen
      editorRef.current.revealLineInCenter(currentLine);
    }
  }, [currentStep, frames]);

  const handleRun = (codeToRun = code) => {
      setIsPlaying(false);
      setIsRunning(true);
      try {
        const instrumentedCode = instrumentCode(codeToRun);
        const worker = new Worker(new URL('./simulator.worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.type === 'finished') {
            setFrames(e.data.frames);
            setCurrentStep(0);
          } else if (e.data.type === 'error') {
            console.error("Worker Error:", e.data.message);
          }
          setIsRunning(false);
          worker.terminate();
        };
        worker.postMessage({ instrumentedCode });
      } catch (error) {
        console.error("Parsing Error:", error);
        setIsRunning(false);
      }
  };

  const handleSnippetChange = (e) => {
    const selectedName = e.target.value;
    if (selectedName === "None") {
      setCode(`// Write your JavaScript code here...`);
      setFrames([]); // Clear simulation
      setCurrentStep(0);
      return;
    }
    
    const selectedSnippet = snippets.find(s => s.name === selectedName);
    if (selectedSnippet) {
      setCode(selectedSnippet.code);
      handleRun(selectedSnippet.code);
    }
  };

  const handleStepForward = () => {
    if (currentStep < frames.length - 1) setCurrentStep(prev => prev + 1);
  };

  // NEW: Step Backward function
  const handleStepBackward = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleReset = () => {
    setCurrentStep(0);
    // Clear decorations on reset
    if (editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  };

  const handlePlayPause = () => {
    // If at the end, restart from beginning before playing
    if (currentStep >= frames.length - 1) {
      setCurrentStep(0);
      // Only start playing if we aren't at the end, or if we just reset
      if (!isPlaying) setIsPlaying(true); 
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const currentMemory = frames.length > 0 ? frames[currentStep].memory : {};
  const currentStack = frames.length > 0 ? frames[currentStep].stack : [];
  const currentEvent = frames.length > 0 ? frames[currentStep].event : null;
  const currentLogs = frames.length > 0 ? frames[currentStep].logs : [];
  const prevMemory = currentStep > 0 ? frames[currentStep - 1].memory : {};
  
  // NEW: Find active array pointers (i, j, mid, left, right)
  const pointerVars = ['i', 'j', 'mid', 'left', 'right', 'minIdx'];
  const activeIndices = pointerVars
    .map(v => currentMemory[v])
    .filter(val => typeof val === 'number'); // Array of numbers representing active indices

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-and-snippets">
          <div className="logo">
            <Microscope size={24} className="logo-icon" />
            <h1>Logic<span>Lens</span></h1>
          </div>
    
          {/* NEW: Snippets Dropdown */}
          <select 
            onChange={handleSnippetChange} 
            defaultValue=""
            className="snippets-dropdown"
          >
            <option value="" disabled>Load Example...</option>
            {snippets.map((snippet, index) => (
              <option key={index} value={snippet.name}>
                {snippet.name}
              </option>
            ))}
          </select>
        </div>
  
        <div className="controls">
          {/* 1. Simulate Button */}
          <button onClick={() => handleRun()} disabled={isRunning} className="control-btn primary" title="Run Simulation">
            {isRunning ? 'Simulating...' : 'Simulate'}
          </button>

          <div style={{ width: '1px', height: '24px', background: '#30363d', margin: '0 8px' }}></div>

          {/* 2. Speed Slider with Text (0.5x to 2.0x) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8b949e', minWidth: '40px', textAlign: 'right' }}>
              {(800 / speed).toFixed(2)}x
            </span>
            <input 
              type="range" 
              min="400" 
              max="1600" 
              // Reversed logic: slider value + speed = 2000. 
              // So if slider is 1600 (far right), speed is 400ms (2.0x fast)
              // If slider is 400 (far left), speed is 1600ms (0.50x slow)
              value={2000 - speed} 
              onChange={(e) => setSpeed(2000 - Number(e.target.value))} 
              disabled={frames.length === 0}
            />
          </div>

          <div style={{ width: '1px', height: '24px', background: '#30363d', margin: '0 8px' }}></div>

          {/* 3. Playback Controls */}
          <button onClick={handleReset} disabled={frames.length === 0} className="control-btn secondary" title="Reset">
            <RotateCcw size={16} />
          </button>
          <button onClick={handleStepBackward} disabled={currentStep === 0 || isPlaying} className="control-btn secondary" title="Step Backward">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handlePlayPause} disabled={frames.length === 0} className="control-btn secondary" title="Play/Pause">
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button onClick={handleStepForward} disabled={currentStep >= frames.length - 1 || isPlaying} className="control-btn secondary" title="Step Forward">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-pane">
          <div className="pane-header"><span>script.js</span></div>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            // UPDATED: Clear frames when code changes so old simulations don't play!
            onChange={(value) => {
              setCode(value);
              setFrames([]);
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          />
        </div>

        <div className="visualizer-pane">
          {/* Top Right: Memory & Variables (45% height) */}
          <div className="viz-section memory-section">
            <div className="pane-header">
              <span>Memory & Variables</span>
              {frames.length > 0 && (
                <span className="step-indicator">Step {currentStep + 1} / {frames.length}</span>
              )}
            </div>
            <div className="viz-content">
              {frames.length === 0 ? (
                <div className="empty-state">Click "Simulate" to begin tracing memory.</div>
              ) : (
                <div className="memory-grid">
                  {Object.entries(currentMemory).map(([name, value]) => {
                    // Check if value changed from previous frame
                    const hasChanged = JSON.stringify(prevMemory[name]) !== JSON.stringify(value);
                    const flashClass = hasChanged ? 'flash-highlight' : '';

                    // Force React to remount the element if the value changes so the CSS animation restarts!
                    const dynamicKey = `${name}-${JSON.stringify(value)}`;

                    if (Array.isArray(value)) {
                      return (
                        <div key={dynamicKey} className={`memory-item array-container ${flashClass}`}>
                          <div className="var-label">{name}</div>
                          <div className="array-box">
                            {value.map((item, index) => (
                              <div 
                                key={index} 
                                // NEW: Add active-index class if this index is being tracked
                                className={`array-item ${activeIndices.includes(index) ? 'active-index' : ''}`}
                              >
                                <span className="array-index">{index}</span>
                                <span className="array-value">{JSON.stringify(item)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div key={dynamicKey} className={`memory-item object-container ${flashClass}`}>
                          <div className="var-label">{name}</div>
                          <div className="object-box">
                            {Object.entries(value).map(([key, val]) => (
                              <div key={key} className="object-property">
                                <span className="prop-key">{key}:</span>
                                <span className="prop-value">{JSON.stringify(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={dynamicKey} className={`memory-item var-box ${flashClass}`}>
                        <span className="var-name">{name}</span>
                        <span className="var-value">{JSON.stringify(value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Middle Right: Call Stack (25% height) */}
          <div className="viz-section stack-section">
            <div className="pane-header"><span>Call Stack</span></div>
            <div className="viz-content">
              {currentStack.length === 0 ? (
                <div className="empty-state">No active functions.</div>
              ) : (
                <div className="stack-container">
                  {currentStack.map((func, index) => (
                    <div key={index} className="stack-frame">
                      {func.name}({func.args.map(a => JSON.stringify(a)).join(', ')})
                    </div>
                  ))}
                </div>
              )}
              {currentEvent && (
                <div className="event-log">
                  {currentEvent}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Right: Console Output (30% height) */}
          {/* Bottom Right: Console Output (Collapsible) */}
          <div className={`viz-section console-section ${isConsoleOpen ? '' : 'minimized'}`}>
            <div className="pane-header">
              <span>Console</span>
              <button 
                onClick={() => setIsConsoleOpen(!isConsoleOpen)} 
                className="pane-toggle-btn"
                title={isConsoleOpen ? "Minimize Console" : "Maximize Console"}
              >
                {isConsoleOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
  
            {/* Only render the content if the console is open */}
            {isConsoleOpen && (
              <div className="viz-content console-content">
                {currentLogs.length === 0 ? (
                  <div className="empty-state">No output.</div>
                ) : (
                  currentLogs.map((log, index) => (
                    <div key={index} className={`console-line ${log.includes('⚠️') ? 'error-log' : ''}`}>
                      <span className="console-arrow">›</span> {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;