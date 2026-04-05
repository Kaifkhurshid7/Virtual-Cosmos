import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';
import { registerUserHandlers } from './handlers/userHandlers';
import { registerProximityHandlers } from './handlers/proximityHandlers';
import { registerChatHandlers } from './handlers/chatHandlers';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // good practice

app.get("/", (req, res) => {
  res.send("Socket server is running ");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 🔌 Register all handlers
  registerUserHandlers(io, socket);
  registerProximityHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
