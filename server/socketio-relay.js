// Simple Socket.io relay server for Battleship
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); // roomId -> { host: socketId, guest: socketId }

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', (roomId) => {
    console.log(`Creating room: ${roomId} by ${socket.id}`);
    
    if (rooms.has(roomId)) {
      socket.emit('room_exists');
      return;
    }

    rooms.set(roomId, { host: socket.id, guest: null });
    socket.join(roomId);
    socket.emit('room_created');
    console.log(`Room ${roomId} created. Active rooms: ${rooms.size}`);
  });

  socket.on('join_room', (roomId) => {
    console.log(`${socket.id} attempting to join room: ${roomId}`);
    
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('room_not_found');
      console.log(`Room ${roomId} not found`);
      return;
    }

    if (room.guest) {
      socket.emit('room_full');
      console.log(`Room ${roomId} is full`);
      return;
    }

    room.guest = socket.id;
    socket.join(roomId);
    socket.emit('room_joined');
    
    // Notify host that player joined
    io.to(room.host).emit('player_joined');
    
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on('game_message', ({ room, data }) => {
    // Relay message to other player in the room
    socket.to(room).emit('game_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.host === socket.id || room.guest === socket.id) {
        // Notify other player
        socket.to(roomId).emit('opponent_disconnected');
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted. Active rooms: ${rooms.size}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log('\n=================================');
  console.log('🎮 Battleship Relay Server');
  console.log('=================================');
  console.log(`Local IP: ${localIp}`);
  console.log(`Port: ${PORT}`);
  console.log('\nServer running at:');
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Network: http://${localIp}:${PORT}`);
  console.log('=================================\n');
});
