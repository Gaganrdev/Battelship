// React Native WebSocket implementation (browser-compatible)
import { Platform } from 'react-native';

let socket: WebSocket | null = null;

// HOST creates server (Note: In React Native, you'll need a separate Node.js server)
// This is a client-side implementation. For hosting, deploy a separate WebSocket server.
export function hostGame(
  onMessage: (msg: string) => void, 
  serverUrl: string = 'ws://localhost:8080',
  onConnect?: () => void,
  onDisconnect?: () => void
) {
  // Don't adjust localhost for host - they should connect to their local server
  socket = new WebSocket(serverUrl);

  socket.onopen = () => {
    console.log('Connected to server as host');
    if (onConnect) onConnect();
  };

  socket.onmessage = (event) => {
    onMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onDisconnect) onDisconnect();
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (onDisconnect) onDisconnect();
  };
}

// JOIN connects to host IP
export function joinGame(
  ip: string, 
  onMessage: (msg: string) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
) {
  const url = `ws://${ip}:8080`;

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('Connected to game at', ip);
    if (onConnect) onConnect();
  };

  socket.onmessage = (event) => {
    onMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onDisconnect) onDisconnect();
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
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
