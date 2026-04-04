import { useCosmosStore } from '../store/cosmosStore';
import { Users, Zap } from 'lucide-react';

export const Header = () => {
  const { users, me } = useCosmosStore();
  const count = users.length + (me ? 1 : 0);

  return (
    <header className="fixed top-0 inset-x-0 h-16 glass z-50 flex items-center justify-between px-6 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/30">
          <Zap className="text-white fill-white" size={20} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white/90">Virtual Cosmos</h2>
      </div>

      <div className="flex items-center gap-4">
        {me && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-gray-300">Online: {me.name}</span>
            </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <Users size={16} className="text-gray-400" />
          <span className="text-xs font-bold text-white">{count} Explorers</span>
        </div>
      </div>
    </header>
  );
};
