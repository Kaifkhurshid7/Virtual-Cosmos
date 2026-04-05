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
  const appRef = useRef<PIXI.Application | null>(null);
  const { me } = useCosmosStore();

  useEffect(() => {
    let isDestroyed = false;
    const pixiApp = new PIXI.Application();
    appRef.current = pixiApp;

    const init = async () => {
      try {
        await pixiApp.init({
          width: 1200,
          height: 700,
          backgroundColor: 0x050517,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        // If component unmounted before init finished, destroy immediately
        if (isDestroyed) {
          pixiApp.destroy(true, { children: true, texture: true });
          return;
        }

        if (canvasRef.current) {
          canvasRef.current.appendChild(pixiApp.canvas);
        }

        // Add Starfield
        const starCount = 200;
        const stars = new PIXI.Graphics();
        for (let i = 0; i < starCount; i++) {
          const x = Math.random() * 1200;
          const y = Math.random() * 700;
          const radius = Math.random() * 1.5;
          const alpha = Math.random();
          stars.circle(x, y, radius).fill({ color: 0xffffff, alpha });
        }
        pixiApp.stage.addChild(stars);
        
        pixiApp.ticker.add(() => {
           stars.alpha = 0.5 + Math.sin(Date.now() / 1000) * 0.2;
        });

        setApp(pixiApp);
      } catch (err) {
        console.error('PixiJS init failed:', err);
      }
    };

    init();

    return () => {
      isDestroyed = true;
      setApp(null);
      // Only destroy if it was initialized or we are cleaning up the instance
      if (pixiApp.canvas) {
        pixiApp.destroy(true, { children: true, texture: true });
      }
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
