import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import { useCosmosStore } from '../store/cosmosStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const { setUsers, updateUser, removeUser, addMessage, setMessages, connectPeer, disconnectPeer, setTyping, addToast } = useCosmosStore();

  useEffect(() => {
    const s = io(SERVER_URL);
    setSocket(s);

    s.on('users:state', (users) => {
      setUsers(users);
    });

    s.on('user:moved', ({ id, x, y }) => {
      updateUser(id, x, y);
    });

    s.on('user:left', (id) => {
      removeUser(id);
      addToast('User left', 'info');
    });

    s.on('proximity:connect', ({ roomId, peerId, history }) => {
      setMessages(roomId, history);
      connectPeer(peerId);
      const peer = useCosmosStore.getState().users.find(u => u.id === peerId);
      if (peer) addToast(`Connected to ${peer.name}`, 'success');
    });

    s.on('proximity:disconnect', ({ roomId, peerId }) => {
       disconnectPeer(peerId);
       addToast('Connection closed', 'info');
       console.log('Proximity disconnected for room:', roomId);
    });

    s.on('chat:message', (data) => {
      addMessage(data.roomId, {
        id: data.id,
        from: data.from,
        name: data.name,
        text: data.text,
        ts: data.ts
      });
    });

    s.on('chat:typing:ack', ({ from }) => {
      setTyping(from, true);
      setTimeout(() => setTyping(from, false), 3000);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return socket;
};
