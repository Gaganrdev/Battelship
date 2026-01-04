const WebSocket = require('ws');
const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' }, () => {
  const localIp = getLocalIpAddress();
  console.log('\n=================================');
  console.log('🎮 Battleship Game Server Running');
  console.log('=================================');
  console.log(`Local IP: ${localIp}`);
  console.log(`Port: 8080`);
  console.log('\nHost should use this IP in the app');
  console.log(`Players on the same WiFi should enter: ${localIp}`);
  console.log('=================================\n');
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
