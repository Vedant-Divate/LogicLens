import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, FastForward, RotateCcw, Microscope } from 'lucide-react';
import './App.css';

function App() {
  const [code, setCode] = useState(`// Welcome to LogicLens\nlet x = 5;\nlet y = x + 10;\nconsole.log(y);`);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    console.log("Code to simulate:", code);
    setTimeout(() => setIsRunning(false), 500);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Microscope size={24} className="logo-icon" />
          <h1>Logic<span>Lens</span></h1>
        </div>
        <div className="controls">
          <button className="control-btn secondary">
            <RotateCcw size={16} />
          </button>
          <button className="control-btn secondary">
            <FastForward size={16} />
          </button>
          <button onClick={handleRun} disabled={isRunning} className="control-btn primary">
            <Play size={16} fill="currentColor" />
            {isRunning ? 'Simulating...' : 'Simulate'}
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <main className="main-content">
        {/* Left Pane: Code Editor */}
        <div className="editor-pane">
          <div className="pane-header">
            <span>script.js</span>
          </div>
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
              fontFamily: '"Fira Code", monospace',
            }}
          />
        </div>

        {/* Right Pane: Visualizer */}
        <div className="visualizer-pane">
          {/* Visualizer Section 1: Memory */}
          <div className="viz-section memory-section">
            <div className="pane-header">
              <span>Memory & Variables</span>
            </div>
            <div className="viz-content">
              <div className="empty-state">
                <p>Click "Simulate" to begin tracing memory.</p>
              </div>
            </div>
          </div>

          {/* Visualizer Section 2: Call Stack */}
          <div className="viz-section stack-section">
            <div className="pane-header">
              <span>Call Stack</span>
            </div>
            <div className="viz-content">
              <div className="empty-state">
                <p>Function calls will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;