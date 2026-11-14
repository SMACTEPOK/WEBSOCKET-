import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

// Динамічне визначення URL для Codespaces або Localhost
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host.replace('5173', '8080');
const WS_URL = `${protocol}//${host}`;

export function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState(null);
  
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, { reconnect: true });

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage);
      switch (msg.type) {
        case 'message':
        case 'system':
        case 'file':
          setMessages(prev => [...prev, msg]);
          break;
        case 'typing':
          setTypingUsers(prev => new Set(prev).add(msg.username));
          setTimeout(() => {
            setTypingUsers(prev => { const n = new Set(prev); n.delete(msg.username); return n; });
          }, 3000);
          break;
        case 'stop-typing':
          setTypingUsers(prev => { const n = new Set(prev); n.delete(msg.username); return n; });
          break;
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsJoined(true);
      sendMessage({ type: 'join', username });
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isTypingRef.current && e.target.value.length > 0) {
      isTypingRef.current = true;
      sendMessage({ type: 'typing' });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendMessage({ type: 'stop-typing' });
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendMessage({ type: 'stop-typing' });

    if (inputValue.trim() && readyState === WebSocket.OPEN) {
      sendMessage({ type: 'message', content: inputValue });
      setInputValue('');
    }
  };

  // ІНДИВІДУАЛЬНЕ ЗАВДАННЯ 4: Відправка файлів (Base64)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || readyState !== WebSocket.OPEN) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Файл занадто великий (макс 2MB)');
      return;
    }

    setUploadProgress(10);
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    reader.onload = (event) => {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
      sendMessage({
        type: 'file',
        fileName: file.name,
        fileType: file.type,
        fileData: event.target.result // Base64 string
      });
      fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const getStatusColor = () => {
    if (readyState === WebSocket.OPEN) return 'var(--color-success)';
    if (readyState === WebSocket.CONNECTING) return '#ffaa00';
    return 'var(--color-danger)';
  };

  const getStatusText = () => {
    if (readyState === WebSocket.OPEN) return 'ОНЛАЙН';
    if (readyState === WebSocket.CONNECTING) return 'ПІДКЛЮЧЕННЯ...';
    return 'ОФЛАЙН';
  };

  if (!isJoined) {
    return (
      <div className="lab-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="lab-card__title">Вхід у чат</h2>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input className="lab-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Ваше ім'я..." required />
          <button type="submit" className="btn" disabled={readyState !== WebSocket.OPEN}>Увійти</button>
          {readyState !== WebSocket.OPEN && <p style={{ color: 'var(--color-danger)', fontSize: '12px' }}>Очікування сервера...</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="lab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px dashed var(--color-border)', paddingBottom: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-white)' }}>ЧАТ: {username}</h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: getStatusColor() }}>
          ● {getStatusText()}
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isOwn = msg.username === username;
          if (msg.type === 'system') {
            return <div key={idx} className="chat-system">{msg.content}</div>;
          }
          return (
            <div key={idx} className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
              <div className="chat-meta">
                <strong>{msg.username}</strong>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              {msg.type === 'file' ? (
                <div className="chat-file">
                  {msg.fileType.startsWith('image/') ? (
                    <img src={msg.fileData} alt={msg.fileName} style={{ maxWidth: '100%', border: '2px solid var(--color-border)', marginTop: '8px' }} />
                  ) : (
                    <a href={msg.fileData} download={msg.fileName} className="btn btn--small" style={{ marginTop: '8px', display: 'inline-block' }}>
                      ⬇ Завантажити {msg.fileName}
                    </a>
                  )}
                </div>
              ) : (
                <div className="chat-text">{msg.content}</div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ height: '20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px' }}>
        {Array.from(typingUsers).filter(u => u !== username).length > 0 && (
          <span>✎ {Array.from(typingUsers).filter(u => u !== username).join(', ')} друкує...</span>
        )}
      </div>

      {uploadProgress !== null && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ height: '6px', background: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>
            <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--color-success)', transition: 'width 0.2s' }}></div>
          </div>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Завантаження: {uploadProgress}%</span>
        </div>
      )}

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        <button type="button" className="btn" onClick={() => fileInputRef.current.click()} disabled={readyState !== WebSocket.OPEN} title="Прикріпити файл">📎</button>
        <input className="lab-input" style={{ flex: 1 }} value={inputValue} onChange={handleInputChange} placeholder="Повідомлення..." disabled={readyState !== WebSocket.OPEN} />
        <button type="submit" className="btn" disabled={readyState !== WebSocket.OPEN}>Надіслати</button>
      </form>
    </div>
  );
}
