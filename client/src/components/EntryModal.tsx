import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCosmosStore } from '../store/cosmosStore';
import { Socket } from 'socket.io-client';

const COLORS = [
  '#ff007f', '#7f00ff', '#00ffff', '#00ff7f', '#ffff00', '#ff7f00'
];

interface EntryModalProps {
  socket: Socket | null;
}

export const EntryModal = ({ socket }: EntryModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const { setMe } = useCosmosStore();

  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useState(() => {
    if (!socket) return;
    const update = () => setIsConnected(socket.connected);
    socket.on('connect', update);
    socket.on('disconnect', update);
    return () => {
      socket.off('connect', update);
      socket.off('disconnect', update);
    };
  });

  const handleJoin = () => {
    if (!name.trim() || !socket || !socket.connected) return;
    
    // Random position
    const x = 100 + Math.random() * 1000;
    const y = 100 + Math.random() * 500;

    const userData = { name, x, y, color };
    socket.emit('user:join', userData);
    setMe({ id: socket.id || 'me', ...userData, joinedAt: Date.now() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass p-8 rounded-3xl w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Virtual Cosmos
          </h1>
          <p className="text-gray-400">Enter your name to join the space</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Username"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />

          <div className="flex justify-between items-center px-1">
             <span className="text-sm text-gray-400">Choose Avatar Color</span>
             <div className="flex gap-2">
                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
             </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!name.trim() || !isConnected}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            {!isConnected ? 'Connecting...' : 'Launch into Cosmos'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
