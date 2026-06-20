import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, FastForward, RotateCcw, Microscope } from 'lucide-react';
import './App.css';

function App() {
  const [code, setCode] = useState(`let arr = [10, 20, 30];
for (let i = 0; i < arr.length; i++) {
  let sum = arr[i] + 5;
}`);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    console.log("Code to simulate:", code);
    setTimeout(() => setIsRunning(false), 500);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Microscope size={24} className="logo-icon" />
          <h1>logic<span>lens</span></h1>
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