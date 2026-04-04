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
      // Server validation: Euclidean distance
      const dx = user.x - targetUser.x;
      const dy = user.y - targetUser.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= PROXIMITY_RADIUS + 10) { // small buffer for server validation
        const roomId = getRoomId(socket.id, data.targetId);
        
        // Initial room if it doesn't exist
        if (!roomsMap.has(roomId)) {
          roomsMap.set(roomId, []);
        }

        // Join both users to the room
        socket.join(roomId);
        // We tell the other user too? 
        // Technically Socket.IO rooms are server-side.
        // We inform the client to open chat UI.
        socket.emit('proximity:connect', { 
          roomId, 
          peerId: data.targetId, 
          history: roomsMap.get(roomId) || [] 
        });
        
        // How does the other user know?
        // We also notify the targetId if they are already close
        // In this implementation, each client detects proximity and emits enter
        // But for reliability, the server can notify the target too.
        // Let's make it symmetric.
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
     socket.emit('proximity:disconnect', { roomId });

     const targetSocket = io.sockets.sockets.get(data.targetId);
     if (targetSocket) {
        targetSocket.leave(roomId);
        targetSocket.emit('proximity:disconnect', { roomId });
     }
  });
};
