import { create } from 'zustand';
import { UserState, Message } from '../../../shared/types';

interface CosmosStore {
  me: UserState | null;
  users: UserState[];
  messages: Record<string, Message[]>; // roomId -> messages
  activeRooms: Set<string>; // Connected peer IDs
  typingPeers: Record<string, boolean>; // peerId -> isTyping

  setMe: (user: UserState | null) => void;
  setUsers: (users: UserState[]) => void;
  updateUser: (id: string, x: number, y: number) => void;
  removeUser: (id: string) => void;
  
  addMessage: (roomId: string, message: Message) => void;
  setMessages: (roomId: string, history: Message[]) => void;
  
  connectPeer: (peerId: string) => void;
  disconnectPeer: (peerId: string) => void;
  
  setTyping: (peerId: string, isTyping: boolean) => void;
}

export const useCosmosStore = create<CosmosStore>((set) => ({
  me: null,
  users: [],
  messages: {},
  activeRooms: new Set(),
  typingPeers: {},

  setMe: (me) => set({ me }),
  setUsers: (users) => set({ users: users.filter(u => u.id !== useCosmosStore.getState().me?.id) }),
  
  updateUser: (id, x, y) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, x, y } : u)
  })),

  removeUser: (id) => set((state) => ({
    users: state.users.filter(u => u.id !== id),
    activeRooms: new Set([...state.activeRooms].filter(pid => pid !== id))
  })),

  addMessage: (roomId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: [...(state.messages[roomId] || []), message].slice(-100)
    }
  })),

  setMessages: (roomId, history) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: history
    }
  })),

  connectPeer: (peerId) => set((state) => {
    const next = new Set(state.activeRooms);
    next.add(peerId);
    return { activeRooms: next };
  }),

  disconnectPeer: (peerId) => set((state) => {
    const next = new Set(state.activeRooms);
    next.delete(peerId);
    return { activeRooms: next };
  }),

  setTyping: (peerId, isTyping) => set((state) => ({
    typingPeers: { ...state.typingPeers, [peerId]: isTyping }
  }))
}));
