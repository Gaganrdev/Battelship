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
  console.log('Client connected. Total clients:', wss.clients.size);

  ws.on('message', (message) => {
    const msgStr = message.toString();
    console.log('Received:', msgStr);
    
    // Relay message to all OTHER clients (not the sender)
    let relayCount = 0;
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
        relayCount++;
      }
    });
    console.log(`Relayed to ${relayCount} other client(s)`);
  });

  ws.on('close', () => {
    console.log('Client disconnected. Remaining clients:', wss.clients.size);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down server');
  wss.close(() => process.exit(0));
});
