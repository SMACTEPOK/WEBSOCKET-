import React from 'react';
import { ChatRoom } from '../components/ChatRoom';
import './Lab17Page.css';

export default function Lab17Page() {
  return (
    <div className="lab-page">
      <header className="lab-header">
        <h1 className="lab-title">LAB 17<br/>WEBSOCKET</h1>
        <p className="lab-subtitle">Real-time Chat & File Transfer</p>
      </header>
      <main className="lab-main">
        <ChatRoom />
      </main>
    </div>
  );
}
