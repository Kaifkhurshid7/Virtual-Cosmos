import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, Message } from '../../../shared/types';
import { usersMap } from '../state/usersMap';
import { roomsMap } from '../state/roomsMap';
import crypto from 'crypto';

export const registerChatHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  socket.on('chat:send', (data) => {
    const user = usersMap.get(socket.id);
    if (user) {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        from: socket.id,
        name: user.name,
        text: data.text,
        ts: Date.now(),
      };

      // Add to room history
      let history = roomsMap.get(data.roomId) || [];
      history.push(newMessage);
      
      // Cap history (limit 100)
      if (history.length > 100) {
        history.shift();
      }
      roomsMap.set(data.roomId, history);

      // Broadcast to room
      io.to(data.roomId).emit('chat:message', {
        roomId: data.roomId,
        from: socket.id,
        name: user.name,
        text: data.text,
        ts: newMessage.ts,
        id: newMessage.id,
      });
    }
  });

  socket.on('chat:typing', (data) => {
    socket.to(data.roomId).emit('chat:typing:ack', { from: socket.id });
  });
};
