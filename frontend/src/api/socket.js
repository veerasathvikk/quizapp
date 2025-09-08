import { io } from 'socket.io-client';

// Adjust the URL if your backend runs elsewhere
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

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

