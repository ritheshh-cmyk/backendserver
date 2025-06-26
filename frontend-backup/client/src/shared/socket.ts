import { io, type Socket } from 'socket.io-client';
import { config } from './config';

const SOCKET_URL = config.SOCKET_URL;
let socket: Socket | undefined;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
  }
  return socket;
} 