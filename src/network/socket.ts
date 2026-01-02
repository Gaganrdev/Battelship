// React Native WebSocket implementation (browser-compatible)
import { Platform } from 'react-native';

let socket: WebSocket | null = null;

// HOST creates server (Note: In React Native, you'll need a separate Node.js server)
// This is a client-side implementation. For hosting, deploy a separate WebSocket server.
export function hostGame(onMessage: (msg: string) => void, serverUrl: string = 'ws://localhost:8080') {
  // Adjust localhost for Android emulator
  const defaultUrl = Platform.OS === 'android' && serverUrl.includes('localhost')
    ? serverUrl.replace('localhost', '10.0.2.2')
    : serverUrl;

  // In production, this would connect to your hosted WebSocket server
  socket = new WebSocket(defaultUrl);

  socket.onopen = () => {
    console.log('Connected to server as host');
  };

  socket.onmessage = (event) => {
    onMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
}

// JOIN connects to host IP
export function joinGame(ip: string, onMessage: (msg: string) => void) {
  // If running on Android emulator and ip is localhost, map to host machine
  const host = (ip === 'localhost' || ip === '127.0.0.1') && Platform.OS === 'android' ? '10.0.2.2' : ip;
  const url = `ws://${host}:8080`;

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('Connected to game at', host);
  };

  socket.onmessage = (event) => {
    onMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
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
