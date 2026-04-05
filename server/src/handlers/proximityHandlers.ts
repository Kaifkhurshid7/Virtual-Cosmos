import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import { usersMap } from '../state/usersMap';
import { roomsMap } from '../state/roomsMap';
import { getRoomId } from '../utils/roomId';

const PROXIMITY_RADIUS = Number(process.env.PROXIMITY_RADIUS) || 150;

export const registerProximityHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  socket.on('proximity:enter', (data) => {
    const user = usersMap.get(socket.id);
    const targetUser = usersMap.get(data.targetId);
    if (user && targetUser) {
      const dx = user.x - targetUser.x;
      const dy = user.y - targetUser.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= PROXIMITY_RADIUS + 10) {
        const roomId = getRoomId(socket.id, data.targetId);
        if (!roomsMap.has(roomId)) {
          roomsMap.set(roomId, []);
        }
        socket.join(roomId);
        socket.emit('proximity:connect', {
          roomId,
          peerId: data.targetId,
          history: roomsMap.get(roomId) || []
        });
        const targetSocket = io.sockets.sockets.get(data.targetId);
        if (targetSocket) {
          targetSocket.join(roomId);
          targetSocket.emit('proximity:connect', {
            roomId,
            peerId: socket.id,
            history: roomsMap.get(roomId) || []
          });
        }
      }
    }
  });

  socket.on('proximity:leave', (data) => {
    const roomId = getRoomId(socket.id, data.targetId);
    socket.leave(roomId);
    const targetSocket = io.sockets.sockets.get(data.targetId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit('proximity:disconnect', { roomId, peerId: socket.id });
    }
    socket.emit('proximity:disconnect', { roomId, peerId: data.targetId });
  });
};
