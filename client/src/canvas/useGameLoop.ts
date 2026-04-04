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
  
  // Refs for ticker sync to avoid frequent re-binding
  const stateRef = useRef({ me, users, activeRooms });
  const pendingEmits = useRef(new Set<string>());

  // Sync state to refs immediately when they change in React
  useEffect(() => {
    stateRef.current = { me, users, activeRooms };
  }, [me, users, activeRooms]);

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
    if (!app || !socket) return;

    const tickerHandler = () => {
      const { me: currentMe, users: currentUsers, activeRooms: currentRooms } = stateRef.current;
      if (!currentMe) return;

      // 1. Move Me
      let dx = 0;
      let dy = 0;
      if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= SPEED;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += SPEED;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= SPEED;
      if (keysRef.current['d'] || keysRef.current['arrowright']) dx += SPEED;

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.max(30, Math.min(1170, currentMe.x + dx));
        const nextY = Math.max(30, Math.min(670, currentMe.y + dy));
        
        if (nextX !== currentMe.x || nextY !== currentMe.y) {
           setMe({ ...currentMe, x: nextX, y: nextY });
           socket.emit('user:move', { x: nextX, y: nextY });
        }
      }

      // 2. Update My Sprite
      if (!avatarsRef.current[currentMe.id]) {
        const sprite = new AvatarSprite(currentMe.name, currentMe.color);
        app.stage.addChild(sprite);
        avatarsRef.current[currentMe.id] = sprite;
      }
      avatarsRef.current[currentMe.id].updatePosition(currentMe.x, currentMe.y);

      // 3. Update Other User Sprites
      currentUsers.forEach(user => {
        if (!avatarsRef.current[user.id]) {
          const sprite = new AvatarSprite(user.name, user.color);
          app.stage.addChild(sprite);
          avatarsRef.current[user.id] = sprite;
        }
        const sprite = avatarsRef.current[user.id];
        sprite.updatePosition(user.x, user.y);

        // 4. Proximity Check
        const distDx = currentMe.x - user.x;
        const distDy = currentMe.y - user.y;
        const dist = Math.sqrt(distDx * distDx + distDy * distDy);
        
        const isConnected = currentRooms.has(user.id);
        const isPending = pendingEmits.current.has(user.id);

        if (!isConnected && !isPending && dist < RADIUS) {
          pendingEmits.current.add(user.id);
          socket.emit('proximity:enter', { targetId: user.id });
          // Clear pending after a short timeout if no ack received
          setTimeout(() => pendingEmits.current.delete(user.id), 5000);
        } else if (isConnected && dist > RADIUS + HYSTERESIS) {
          socket.emit('proximity:leave', { targetId: user.id });
          // We don't remove from set here, connectPeer/disconnectPeer handles store.
          // But we need to allow re-entering if they move away.
          // The socket handler will call disconnectPeer which clears isConnected.
        }
        
        sprite.setProximity(isConnected);
      });

      // 5. Cleanup disconnected users sprites
      Object.keys(avatarsRef.current).forEach(id => {
        if (id !== currentMe.id && !currentUsers.find(u => u.id === id)) {
           app.stage.removeChild(avatarsRef.current[id]);
           delete avatarsRef.current[id];
           pendingEmits.current.delete(id);
        }
      });
    };

    app.ticker.add(tickerHandler);
    return () => {
      app.ticker.remove(tickerHandler);
    };
  // We only depend on app/socket to bind once. State is tracked via stateRef.
  }, [app, socket, setMe]);
};
