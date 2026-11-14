import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocketServer({ server });

const clients = new Map(); // username -> ws

wss.on('connection', (ws) => {
  let currentUsername = null;
  console.log('New client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join':
          currentUsername = message.username;
          clients.set(currentUsername, ws);
          broadcast({ type: 'system', content: `${currentUsername} приєднався до чату`, timestamp: new Date().toISOString() });
          break;

        case 'message':
        case 'file':
          broadcast({
            ...message,
            username: currentUsername,
            timestamp: new Date().toISOString(),
            id: Math.random().toString(36).substr(2, 9)
          });
          break;

        case 'typing':
        case 'stop-typing':
          broadcast({ ...message, username: currentUsername });
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentUsername) {
      clients.delete(currentUsername);
      broadcast({ type: 'system', content: `${currentUsername} вийшов з чату`, timestamp: new Date().toISOString() });
    }
    console.log('Client disconnected');
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
