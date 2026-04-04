import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGameLoop } from '../canvas/useGameLoop';
import { useCosmosStore } from '../store/cosmosStore';
import { Socket } from 'socket.io-client';

interface CanvasLayerProps {
  socket: Socket | null;
}

export const CanvasLayer = ({ socket }: CanvasLayerProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);
  const { me } = useCosmosStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const pixiApp = new PIXI.Application();
    pixiApp.init({
        width: 1200,
        height: 700,
        backgroundColor: 0x050517,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    }).then(() => {
        if (canvasRef.current) {
            canvasRef.current.appendChild(pixiApp.canvas);
        }
        setApp(pixiApp);
    });

    return () => {
      pixiApp.destroy(true, { children: true, texture: true });
    };
  }, []);

  useGameLoop(app, socket);

  if (!me) return null;

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#050517]">
      <div 
        ref={canvasRef} 
        className="relative border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/20"
        style={{ width: 1200, height: 700 }}
      >
        {/* Background Starfield can be added here or in Pixi */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#050517_100%)] opacity-30" />
      </div>
    </div>
  );
};
