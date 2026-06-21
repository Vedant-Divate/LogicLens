import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, FastForward, RotateCcw, Microscope } from 'lucide-react';
import { instrumentCode } from './engine/instrument';
import './App.css';

function App() {
  const [code, setCode] = useState(`let x = 5;\nlet y = x + 10;\nlet z = x + y;`);
  const [isRunning, setIsRunning] = useState(false);
  const [frames, setFrames] = useState([]);

  // Set up the Web Worker when the app loads
  // useEffect(() => {
  //   // Vite handles web workers nicely with this syntax
  //   const worker = new Worker(new URL('./simulator.worker.js', import.meta.url), { type: 'module' });
    
  //   worker.onmessage = (e) => {
  //     if (e.data.type === 'finished') {
  //       console.log("🎉 Received Execution Frames from Worker:");
  //       console.log(e.data.frames);
  //       setFrames(e.data.frames);
  //       setIsRunning(false);
  //     } else if (e.data.type === 'error') {
  //       console.error("Worker Execution Error:", e.data.message);
  //       setIsRunning(false);
  //     }
  //   };

  //   // Cleanup worker on unmount
  //   return () => worker.terminate();
  // }, []);

  const handleRun = () => {
    setIsRunning(true);
    try {
      // 1. Instrument the code
      const instrumentedCode = instrumentCode(code);
      
      // 2. Send to worker
      // We need to pass the worker instance from useEffect to handleRun.
      // Let's just create it inside handleRun for simplicity in this step!
      const worker = new Worker(new URL('./simulator.worker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'finished') {
          console.log("🎉 Received Execution Frames from Worker:");
          console.log(e.data.frames);
          setFrames(e.data.frames);
        } else if (e.data.type === 'error') {
          console.error("Worker Execution Error:", e.data.message);
        }
        setIsRunning(false);
        worker.terminate(); // Clean up worker after it finishes
      };

      worker.postMessage({ instrumentedCode });
      
    } catch (error) {
      console.error("Parsing Error:", error);
      setIsRunning(false);
    }
  };

  // ... keep the rest of your JSX exactly the same!

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Microscope size={24} className="logo-icon" />
          <h1>Logic<span>Lens</span></h1>
        </div>
        <div className="controls">
          <button className="control-btn secondary"><RotateCcw size={16} /></button>
          <button className="control-btn secondary"><FastForward size={16} /></button>
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
            <div className="pane-header"><span>Memory & Variables</span></div>
            <div className="viz-content">
              <div className="empty-state">
                Click "Simulate" to begin tracing memory.
              </div>
            </div>
          </div>

          <div className="viz-section stack-section">
            <div className="pane-header"><span>Call Stack</span></div>
            <div className="viz-content">
              <div className="empty-state">
                Function calls will appear here.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;