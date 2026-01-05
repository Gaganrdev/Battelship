// Peer-to-peer networking using PeerJS - NO EXTERNAL SERVER NEEDED!
import Peer from 'peerjs';

let peer: Peer | null = null;
let connection: any = null;

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
  // Create peer with room ID
  peer = new Peer(roomId);

  peer.on('open', () => {
    console.log('Hosting game with room ID:', roomId);
  });

  peer.on('connection', (conn) => {
    console.log('Someone joined the game!');
    connection = conn;

    conn.on('open', () => {
      if (onConnect) onConnect();
    });

    conn.on('data', (data) => {
      onMessage(data);
    });

    conn.on('close', () => {
      if (onDisconnect) onDisconnect();
    });
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
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
  // Create peer with random ID
  const myId = 'player-' + Math.random().toString(36).substring(2, 9);
  peer = new Peer(myId);

  peer.on('open', () => {
    console.log('Connecting to room:', roomId);
    
    // Connect to host
    if (peer) {
      connection = peer.connect(roomId);

      connection.on('open', () => {
        console.log('Connected to host!');
        if (onConnect) onConnect();
      });

      connection.on('data', (data: any) => {
        onMessage(data);
      });

      connection.on('close', () => {
        if (onDisconnect) onDisconnect();
      });
    }
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
    if (onDisconnect) onDisconnect();
  });
}

// SEND message
export function sendMessage(data: any) {
  if (connection && connection.open) {
    connection.send(data);
  } else {
    console.warn('Connection is not open');
  }
}

// CLOSE connection
export function closeConnection() {
  if (connection) {
    connection.close();
  }
  if (peer) {
    peer.destroy();
  }
  peer = null;
  connection = null;
}
