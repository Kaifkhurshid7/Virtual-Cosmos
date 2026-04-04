export interface UserState {
  id: string; // socket.id
  name: string; // display name
  x: number; // canvas x position
  y: number; // canvas y position
  color: string; // hex avatar color
  joinedAt: number; // Date.now()
}

export interface Message {
  id: string; // nanoid()
  from: string; // sender socket.id
  name: string; // sender display name
  text: string; // message content
  ts: number; // timestamp ms
}

export interface ServerToClientEvents {
  'users:state': (users: UserState[]) => void;
  'user:moved': (data: { id: string; x: number; y: number }) => void;
  'user:left': (id: string) => void;
  'proximity:connect': (data: { roomId: string; peerId: string; history: Message[] }) => void;
  'proximity:disconnect': (data: { roomId: string; peerId: string }) => void;
  'chat:message': (data: { roomId: string; from: string; text: string; ts: number; name: string; id: string }) => void;
  'chat:typing:ack': (data: { from: string }) => void;
}

export interface ClientToServerEvents {
  'user:join': (data: { name: string; x: number; y: number; color: string }) => void;
  'user:move': (data: { x: number; y: number }) => void;
  'proximity:enter': (data: { targetId: string }) => void;
  'proximity:leave': (data: { targetId: string }) => void;
  'chat:send': (data: { roomId: string; text: string }) => void;
  'chat:typing': (data: { roomId: string }) => void;
}
