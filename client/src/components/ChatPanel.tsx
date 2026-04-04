import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '../store/cosmosStore';
import { Socket } from 'socket.io-client';
import { Send, X, User } from 'lucide-react';
import { getRoomId } from '../utils/roomId';

interface ChatPanelProps {
  socket: Socket | null;
}

export const ChatPanel = ({ socket }: ChatPanelProps) => {
  const { me, users, messages, activeRooms, typingPeers } = useCosmosStore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // For MVP, we only show one active chat (the first one)
  const peerId = Array.from(activeRooms)[0];
  const peer = users.find(u => u.id === peerId);
  const roomId = me && peer ? getRoomId(me.id, peer.id) : null;
  const roomMessages = roomId ? messages[roomId] || [] : [];
  const isTyping = peerId ? typingPeers[peerId] : false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomMessages]);

  const handleSend = () => {
    if (!text.trim() || !roomId || !socket) return;
    socket.emit('chat:send', { roomId, text });
    setText('');
  };

  const handleTyping = () => {
    if (roomId && socket) {
      socket.emit('chat:typing', { roomId });
    }
  };

  return (
    <AnimatePresence>
      {peer && (
        <motion.div
           initial={{ x: 400, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: 400, opacity: 0 }}
           className="fixed top-20 right-6 bottom-6 w-96 glass rounded-2xl flex flex-col overflow-hidden z-40 border border-white/20 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20"
                style={{ backgroundColor: peer.color }}
              >
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">{peer.name}</h3>
                <span className="text-xs text-green-400 capitalize">Active Connection</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {roomMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.from === me?.id ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.from === me?.id 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                   {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isTyping && (
                <div className="text-[10px] text-gray-400 italic bg-white/5 rounded-lg px-2 py-1 inline-block">
                    {peer.name} is typing...
                </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white/5 border-t border-white/10">
            <div className="relative group">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm group-hover:border-white/20"
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    handleTyping();
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
