import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url, options = {}) {
  const {
    reconnect = true, reconnectInterval = 1000, maxReconnectInterval = 30000,
    reconnectDecay = 1.5, maxReconnectAttempts = 10
  } = options;

  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('🟢 [WS] З\'єднання відкрито (OPEN)');
        setReadyState(WebSocket.OPEN);
        reconnectCount.current = 0;
      };

      ws.current.onclose = () => {
        console.log('🔴 [WS] З\'єднання закрито (CLOSED)');
        setReadyState(WebSocket.CLOSED);
        if (reconnect && reconnectCount.current < maxReconnectAttempts) {
          const timeout = Math.min(
            reconnectInterval * Math.pow(reconnectDecay, reconnectCount.current),
            maxReconnectInterval
          );
          console.log(`🔄 [WS] Спроба перепідключення через ${timeout}мс...`);
          reconnectTimeout.current = setTimeout(() => {
            reconnectCount.current += 1;
            connect();
          }, timeout);
        }
      };

      ws.current.onerror = () => {
        console.log('⚠️ [WS] Помилка з\'єднання (ERROR)');
        setReadyState(WebSocket.CLOSING);
      };

      ws.current.onmessage = (event) => setLastMessage(event.data);
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [url, reconnect, reconnectInterval, maxReconnectInterval, reconnectDecay, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { sendMessage, lastMessage, readyState };
}
