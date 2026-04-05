import { useSocket } from './hooks/useSocket';
import { useCosmosStore } from './store/cosmosStore';
import { EntryModal } from './components/EntryModal';
import { Header } from './components/Header';
import { CanvasLayer } from './components/CanvasLayer';
import { ChatPanel } from './components/ChatPanel';
import { Toast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  const { socket, connected, joinSpace } = useSocket();
  const { me } = useCosmosStore();

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050517] overflow-hidden cosmic-gradient">
      {!me && <EntryModal socket={socket} connected={connected} joinSpace={joinSpace} />}
      
      {me && (
        <>
          <Header />
          <main className="w-full h-full pt-16 flex items-center justify-center p-8">
            <ErrorBoundary>
              <CanvasLayer socket={socket} />
            </ErrorBoundary>
          </main>
          <ChatPanel socket={socket} />
          <Toast />
          
          {/* HUD info */}
          <div className="fixed bottom-6 left-6 z-50 glass px-4 py-3 rounded-2xl border border-white/10 space-y-2 max-w-xs shadow-2xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navigation</h4>
            <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1 justify-center">
                        <kbd className="px-2 py-1 bg-white/10 rounded min-w-[24px] text-center text-[10px]">W</kbd>
                    </div>
                    <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-white/10 rounded min-w-[24px] text-center text-[10px]">A</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded min-w-[24px] text-center text-[10px]">S</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded min-w-[24px] text-center text-[10px]">D</kbd>
                    </div>
                </div>
                <span className="text-xs text-gray-400 ml-2">Move explorer</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
