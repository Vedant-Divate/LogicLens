import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, FastForward, RotateCcw, Microscope, ChevronRight } from 'lucide-react';
import { instrumentCode } from './engine/instrument';
import './App.css';

function App() {
  // Updated default code to be simple and clear
  const [code, setCode] = useState(`let x = 5;\nlet y = x + 10;\nlet z = x + y;`);
  const [isRunning, setIsRunning] = useState(false);
  
  // State for our "movie" frames and which step we are on
  const [frames, setFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleRun = () => {
    setIsRunning(true);
    try {
      const instrumentedCode = instrumentCode(code);
      const worker = new Worker(new URL('./simulator.worker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'finished') {
          setFrames(e.data.frames);
          setCurrentStep(0); // Reset to first step when starting a new simulation
        } else if (e.data.type === 'error') {
          console.error("Worker Execution Error:", e.data.message);
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

  // Playback controls
  const handleStepForward = () => {
    if (currentStep < frames.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  // Get the memory for the current step, or empty object if no frames
  const currentMemory = frames.length > 0 ? frames[currentStep].memory : {};

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
        {/* Left Pane: Code Editor */}
        <div className="editor-pane">
          <div className="pane-header"><span>script.js</span></div>
          <Editor
            height="calc(100% - 35px)"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value)}
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

        {/* Right Pane: Visualizer */}
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
                  {Object.entries(currentMemory).map(([name, value]) => (
                    <div key={name} className="var-box">
                      <span className="var-name">{name}</span>
                      <span className="var-value">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="viz-section stack-section">
            <div className="pane-header"><span>Call Stack</span></div>
            <div className="viz-content">
              <div className="empty-state">Function calls will appear here.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;