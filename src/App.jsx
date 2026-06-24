import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, FastForward, RotateCcw, Microscope, ChevronRight } from 'lucide-react';
import { instrumentCode } from './engine/instrument';
import './App.css';
import { Play, FastForward, RotateCcw, Microscope, ChevronRight, ChevronLeft } from 'lucide-react';

function App() {
  const [code, setCode] = useState(`let arr = [10, 20, 30];
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum = sum + arr[i];
}`);
  const [isRunning, setIsRunning] = useState(false);
  const [frames, setFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

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

  const handleRun = () => {
    setIsRunning(true);
    try {
      const instrumentedCode = instrumentCode(code);
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

  const currentMemory = frames.length > 0 ? frames[currentStep].memory : {};
  const currentStack = frames.length > 0 ? frames[currentStep].stack : [];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Microscope size={24} className="logo-icon" />
          <h1>Logic<span>Lens</span></h1>
        </div>
        <div className="controls">
          <button onClick={handleReset} disabled={frames.length === 0} className="control-btn secondary">
            <RotateCcw size={16} />
          </button>
          {/* NEW: Step Backward Button */}
          <button onClick={handleStepBackward} disabled={currentStep === 0} className="control-btn secondary">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleStepForward} disabled={currentStep >= frames.length - 1} className="control-btn secondary">
            <ChevronRight size={16} />
          </button>
          <button onClick={handleRun} disabled={isRunning} className="control-btn primary">
            <Play size={16} fill="currentColor" />
            {isRunning ? 'Simulating...' : 'Simulate'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-pane">
          <div className="pane-header"><span>script.js</span></div>
          <Editor
            height="calc(100% - 35px)"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value)}
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
                  // If it's an Array, render it as an indexed list
                    if (Array.isArray(value)) {
                      return (
                        <div key={name} className="memory-item array-container">
                          <div className="var-label">{name}</div>
                          <div className="array-box">
                            {value.map((item, index) => (
                              <div key={index} className="array-item">
                                <span className="array-index">{index}</span>
                                <span className="array-value">{JSON.stringify(item)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
    
                    // If it's an Object, render it as key-value pairs
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div key={name} className="memory-item object-container">
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

                    // If it's a primitive (number, string, boolean)
                    return (
                      <div key={name} className="memory-item var-box">
                        <span className="var-name">{name}</span>
                        <span className="var-value">{JSON.stringify(value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

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
    
              {/* NEW: Event Log */}
              {frames.length > 0 && frames[currentStep].event && (
                <div className="event-log">
                  {frames[currentStep].event}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;