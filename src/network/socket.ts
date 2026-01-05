// React Native WebSocket implementation
let socket: WebSocket | null = null;

// Both players connect to the same server IP
export function connectToServer(
  serverIp: string,
  onMessage: (msg: string) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
) {
  const url = `ws://${serverIp}:8080`;
  console.log('🔌 Connecting to:', url);

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('✅ Connected to server');
    if (onConnect) onConnect();
  };

  socket.onmessage = (event) => {
    console.log('📨 Received message:', event.data);
    onMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    // Don't call onDisconnect here - wait for onclose
  };

  socket.onclose = (event) => {
    console.log('🔌 WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
    if (onDisconnect) onDisconnect();
  };
}

// SEND message
export function sendMessage(data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    console.warn('WebSocket is not connected');
  }
}

// CLOSE connection
export function closeConnection() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
