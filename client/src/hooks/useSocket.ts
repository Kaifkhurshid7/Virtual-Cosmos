import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import { useCosmosStore } from '../store/cosmosStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const { setUsers, updateUser, removeUser, addMessage, setMessages, connectPeer, setTyping, addToast } = useCosmosStore();

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('users:state', (users) => {
      setUsers(users);
    });

    socket.on('user:moved', ({ id, x, y }) => {
      updateUser(id, x, y);
    });

    socket.on('user:left', (id) => {
      removeUser(id);
      addToast('User left', 'info');
    });

    socket.on('proximity:connect', ({ roomId, peerId, history }) => {
      setMessages(roomId, history);
      connectPeer(peerId);
      const peer = useCosmosStore.getState().users.find(u => u.id === peerId);
      if (peer) addToast(`Connected to ${peer.name}`, 'success');
    });

    socket.on('proximity:disconnect', ({ roomId }) => {
       // Disconnect all peers associated with this roomId if needed
       addToast('Connection closed', 'info');
       console.log('Proximity disconnected for room:', roomId);
    });

    socket.on('chat:message', (data) => {
      addMessage(data.roomId, {
        id: data.id,
        from: data.from,
        name: data.name,
        text: data.text,
        ts: data.ts
      });
    });

    socket.on('chat:typing:ack', ({ from }) => {
      setTyping(from, true);
      setTimeout(() => setTyping(from, false), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
};
