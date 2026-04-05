import { Socket, Server } from 'socket.io';
import { UserState, ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import { usersMap } from '../state/usersMap';

export const registerUserHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  socket.on('user:join', (data, cb) => {
    const newUser: UserState = {
      id: socket.id,
      name: data.name,
      x: data.x,
      y: data.y,
      color: data.color,
      joinedAt: Date.now(),
    };
    usersMap.set(socket.id, newUser);
    // Send current state to everybody
    io.emit('users:state', Array.from(usersMap.values()));
    if (cb) cb(true);
  });

  socket.on('user:move', (data) => {
    const user = usersMap.get(socket.id);
    if (user) {
      user.x = data.x;
      user.y = data.y;
      usersMap.set(socket.id, user);
      // Broadcast movement to others
      socket.broadcast.emit('user:moved', { id: socket.id, x: data.x, y: data.y });
    }
  });

  socket.on('disconnect', () => {
    usersMap.delete(socket.id);
    io.emit('user:left', socket.id);
    io.emit('users:state', Array.from(usersMap.values()));
  });
};
