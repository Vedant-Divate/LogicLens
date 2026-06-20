import { useState } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

function App() {
  const [code, setCode] = useState(`// Welcome to LogicLens\nlet x = 5;\nlet y = x + 10;\nconsole.log(y);`);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // In Week 2/3, we will send this code to our engine here!
    console.log("Code to simulate:", code);
    setTimeout(() => setIsRunning(false), 500); // Fake loading for now
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>Logic<span>Lens</span></h1>
        <button onClick={handleRun} disabled={isRunning} className="run-btn">
          {isRunning ? 'Simulating...' : '▶ Simulate'}
        </button>
      </header>

      {/* Main Content Split */}
      <main className="main-content">
        {/* Left Pane: Code Editor */}
        <div className="editor-pane">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value)}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'on'
            }}
          />
        </div>

        {/* Right Pane: Visualizer (Empty for now) */}
        <div className="visualizer-pane">
          <div className="placeholder">
            <h2>Memory & Call Stack</h2>
            <p>Click "Simulate" to visualize your code execution.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;