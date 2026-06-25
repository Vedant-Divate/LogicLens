🔬 LogicLens
An interactive, step-by-step code execution visualizer built for algorithm developers and learners.LogicLens takes written JavaScript code, parses it into an Abstract Syntax Tree (AST), and simulates its execution line-by-line, allowing users to watch how variables, memory, arrays, and the call stack change in real-time.

🚀 [Live Demo](https://logic-lens-sigma.vercel.app/)

ReactViteBabelWeb Workers

📑 Table of Contents
The Problem
Features
System Architecture
Tech Stack
Getting Started
Roadmap

🎯 The Problem
Beginners and algorithm developers often struggle to understand what happens inside the computer when code runs. Concepts like variable mutation, scope, references, and the call stack are invisible. LogicLens acts as a "DVR for your code," breaking execution down into discrete frames and visualizing exactly what the computer's memory looks like at every single step.

✨ Features
Code Instrumentation: Parses JS code via Babel, injecting tracking hooks into variables, arrays, and function calls.
Safe Execution: Runs the modified code in a Web Worker to prevent infinite loops from crashing the browser UI.
Dynamic Memory Visualizer: Renders primitives, Arrays, and Objects dynamically as they are created and mutated.
Intelligent Pointer Tracking: Automatically detects loop variables (i, j, mid, left, right) and highlights the exact array index being accessed in blue.
Call Stack Visualization: Tracks function calls, arguments, and return values (perfect for understanding recursion trees).
In-App Console: Intercepts console.log statements and displays them in sync with the execution timeline.
Full Playback Controls: Play, Pause, Step Forward, Step Backward, Reset, and a 0.5x - 2.0x Speed Slider.
Algorithm Snippets Library: Built-in library of algorithms (Bubble Sort, Quick Sort, Merge Sort, Binary Search, Linked Lists) for instant visualization.

🏗️ System Architecture


🛠️ Tech Stack
Category	Technology
Frontend	React 18, Vite
Code Editor	Monaco Editor (VS Code's engine)
Compiler	Babel (@babel/parser, traverse, generator)
Execution	Web Workers (for non-blocking evaluation)
Styling	Pure CSS with Flexbox layouts

🚀 Getting Started
To run LogicLens locally, follow these steps:

Clone the repository
git clone (https://github.com/Vedant-Divate/LogicLens)
Install dependencies
bash

npm install
Start the development server
bash

npm run dev
Open http://localhost:5173 in your browser.

🗺️ Roadmap
 Add SVG arrows to visually connect Linked List nodes and Object references.
 Add Python support using Pyodide (WebAssembly).
 Visualize block scope (variables inside {} greying out when out of scope).
<p align="center">
Built with ❤️ and a lot of ☕ by [Vedant Divate]
</p>