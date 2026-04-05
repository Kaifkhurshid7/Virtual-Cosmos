import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import { useCosmosStore } from '../store/cosmosStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const { setUsers, updateUser, removeUser, addMessage, setMessages, connectPeer, disconnectPeer, setTyping, addToast } = useCosmosStore();

  useEffect(() => {
    const s: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('Connected:', s.id);
      setConnected(true);
    });

    s.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setConnected(false);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('users:state', (users) => {
      // Find self by socket.id
      const self = users.find(u => u.id === s.id);
      if (self) useCosmosStore.getState().setMe(self);
      setUsers(users);
    });
    s.on('user:moved', (data) => updateUser(data.id, data.x, data.y));
    s.on('user:left', (id) => {
       removeUser(id);
       addToast('Explorer left', 'info');
    });

    s.on('proximity:connect', ({ peerId, history }) => {
      setMessages(peerId, history); // Using peerId as room ID for 1:1 chat
      connectPeer(peerId);
      const peer = useCosmosStore.getState().users.find(u => u.id === peerId);
      if (peer) addToast(`Connected to ${peer.name}`, 'success');
    });

    s.on('proximity:disconnect', ({ peerId }) => {
       disconnectPeer(peerId);
       addToast('Connection closed', 'info');
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

  const joinSpace = (name: string, color: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);

      const onConnect = () => {
        socket.off('connect', onConnect);
        const x = 100 + Math.random() * 1000;
        const y = 100 + Math.random() * 500;
        
        socket.emit('user:join', { name, x, y, color }, (success) => {
          resolve(success);
        });
      };

      if (socket.connected) {
        onConnect();
      } else {
        socket.connect();
        socket.on('connect', onConnect);
      }
    });
  };

  return { socket, connected, joinSpace };
};
