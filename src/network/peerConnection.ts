// Room-based networking using Socket.io - Works anywhere!
import { io, Socket } from 'socket.io-client';

// Use your local relay server (replace with your computer's IP)
const SERVER_URL = 'http://192.168.1.185:3001'; // Change this to your IP shown in server

let socket: Socket | null = null;
let currentRoom: string | null = null;

// Generate a unique room ID
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// HOST creates a room and waits for someone to join
export function hostGame(
  roomId: string,
  onMessage: (msg: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
): string {
  currentRoom = roomId;
  
  socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server, hosting room:', roomId);
    socket?.emit('create_room', roomId);
  });

  socket.on('room_created', () => {
    console.log('Room created successfully');
  });

  socket.on('player_joined', () => {
    console.log('Player joined the room!');
    if (onConnect) onConnect();
  });

  socket.on('game_message', (data: any) => {
    onMessage(data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    if (onDisconnect) onDisconnect();
  });

  socket.on('error', (error: any) => {
    console.error('Socket error:', error);
    if (onDisconnect) onDisconnect();
  });

  return roomId;
}

// JOIN connects to a room using room ID
export function joinGame(
  roomId: string,
  onMessage: (msg: any) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
) {
  currentRoom = roomId;
  
  socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server, joining room:', roomId);
    socket?.emit('join_room', roomId);
  });

  socket.on('room_joined', () => {
    console.log('Successfully joined room!');
    if (onConnect) onConnect();
  });

  socket.on('room_not_found', () => {
    console.error('Room not found!');
    if (onDisconnect) onDisconnect();
  });

  socket.on('game_message', (data: any) => {
    onMessage(data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    if (onDisconnect) onDisconnect();
  });

  socket.on('error', (error: any) => {
    console.error('Socket error:', error);
    if (onDisconnect) onDisconnect();
  });
}

// SEND message
export function sendMessage(data: any) {
  if (socket && socket.connected && currentRoom) {
    socket.emit('game_message', {
      room: currentRoom,
      data: data,
    });
  } else {
    console.warn('Socket is not connected');
  }
}

// CLOSE connection
export function closeConnection() {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  currentRoom = null;
}
