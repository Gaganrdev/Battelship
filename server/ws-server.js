const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' }, () => {
  console.log('WebSocket server is listening on ws://0.0.0.0:8080');
});

wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Echo message to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});

process.on('SIGINT', () => {
  console.log('Shutting down server');
  wss.close(() => process.exit(0));
});
