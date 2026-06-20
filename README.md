🔬 LogicLens
An interactive, step-by-step code execution visualizer.LogicLens takes written JavaScript code, parses it, and simulates its execution, allowing users to watch how variables, memory, and the call stack change in real-time.

🎯 The Problem
Beginners often struggle to understand what happens inside the computer when code runs. Concepts like variable mutation, scope, references, and the call stack are invisible.

💡 The Solution
LogicLens acts as a "DVR for your code." It breaks execution down into discrete frames, visualizing exactly what the computer's memory looks like at every single step.

🛠️ Tech Stack
Frontend: React, Vite
Code Editor: Monaco Editor (VS Code's engine)
Parsing Engine: Babel (AST parsing and code instrumentation)
Execution Sandbox: Web Workers (for safe, non-blocking execution)