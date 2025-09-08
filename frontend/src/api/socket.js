import { io } from 'socket.io-client';

// Adjust the URL if your backend runs elsewhere
const SOCKET_URL = 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

export default socket;

