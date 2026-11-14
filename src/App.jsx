import React from 'react';
import Lab17Page from './pages/Lab17Page';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">✱</span>
          CRAFTMARKET
          <span className="app__brand-tag">LAB 17</span>
        </div>
      </header>
      <main className="app__main">
        <Lab17Page />
      </main>
      <footer className="app__footer">
        <p>© 2026 CRAFTMARKET · Лабораторна робота 17 · WebSockets</p>
      </footer>
    </div>
  );
}
export default App;
