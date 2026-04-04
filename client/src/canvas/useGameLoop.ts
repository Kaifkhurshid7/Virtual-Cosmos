import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useCosmosStore } from '../store/cosmosStore';
import { AvatarSprite } from './AvatarSprite';
import { Socket } from 'socket.io-client';

const RADIUS = 150;
const HYSTERESIS = 20;
const SPEED = 4;

export const useGameLoop = (app: PIXI.Application | null, socket: Socket | null) => {
  const { me, users, activeRooms, setMe } = useCosmosStore();
  const avatarsRef = useRef<Record<string, AvatarSprite>>({});
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!app || !me) return;

    const tickerHandler = () => {
      // 1. Move Me
      let dx = 0;
      let dy = 0;
      if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= SPEED;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += SPEED;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= SPEED;
      if (keysRef.current['d'] || keysRef.current['arrowright']) dx += SPEED;

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.max(30, Math.min(1170, me.x + dx));
        const nextY = Math.max(30, Math.min(670, me.y + dy));
        
        if (nextX !== me.x || nextY !== me.y) {
           setMe({ ...me, x: nextX, y: nextY });
           socket?.emit('user:move', { x: nextX, y: nextY });
        }
      }

      // 2. Update My Sprite
      if (!avatarsRef.current[me.id]) {
        const sprite = new AvatarSprite(me.name, me.color);
        app.stage.addChild(sprite);
        avatarsRef.current[me.id] = sprite;
      }
      avatarsRef.current[me.id].updatePosition(me.x, me.y);

      // 3. Update Other User Sprites
      users.forEach(user => {
        if (!avatarsRef.current[user.id]) {
          const sprite = new AvatarSprite(user.name, user.color);
          app.stage.addChild(sprite);
          avatarsRef.current[user.id] = sprite;
        }
        const sprite = avatarsRef.current[user.id];
        // Simple interpolation or direct update
        sprite.updatePosition(user.x, user.y);

        // 4. Proximity Check
        const distDx = me.x - user.x;
        const distDy = me.y - user.y;
        const dist = Math.sqrt(distDx * distDx + distDy * distDy);
        
        const isConnected = activeRooms.has(user.id);
        if (!isConnected && dist < RADIUS) {
          socket?.emit('proximity:enter', { targetId: user.id });
        } else if (isConnected && dist > RADIUS + HYSTERESIS) {
          socket?.emit('proximity:leave', { targetId: user.id });
        }
        
        sprite.setProximity(isConnected);
      });

      // 5. Cleanup disconnected users
      Object.keys(avatarsRef.current).forEach(id => {
        if (id !== me.id && !users.find(u => u.id === id)) {
           app.stage.removeChild(avatarsRef.current[id]);
           delete avatarsRef.current[id];
        }
      });
    };

    app.ticker.add(tickerHandler);
    return () => {
      app.ticker.remove(tickerHandler);
    };
  }, [app, me, users, activeRooms, socket]);
};
