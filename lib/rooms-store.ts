import { kv } from "@vercel/kv"

export interface PlayerState {
    x: number
    y: number
    health: number
    score: number
    lastUpdate: number
    bullets?: { id: string, x: number, y: number }[]
    shipType?: string
}

export interface EnemyState {
    id: string
    x: number
    y: number
    health: number
    type: 'enemy' | 'boss'
    bossType?: string
}

export interface GameState {
    wave: number
    enemies: EnemyState[]
    playerStates: Record<string, PlayerState>
    lastUpdate: number
    isGameOver: boolean
}

export interface Room {
    id: string
    creator: string
    players: string[]
    status: 'WAITING' | 'PLAYING' | 'GAMEOVER'
    createdAt: number
    gameState: GameState
    readyPlayers: string[]
}

/**
 * RoomsStore provides a centralized way to manage multiplayer room state.
 * In production (Vercel), it uses Vercel KV (Redis).
 * In development, it falls back to a global in-memory Map.
 */
class RoomsStore {
    private static instance: RoomsStore;
    private memoryStore: Map<string, Room>;
    private useKV: boolean;

    private constructor() {
        this.useKV = process.env.NODE_ENV === 'production' && !!process.env.KV_REST_API_URL;
        
        const globalRef = global as any;
        if (!globalRef.multiplayerRooms) {
            globalRef.multiplayerRooms = new Map<string, Room>();
        }
        this.memoryStore = globalRef.multiplayerRooms;
    }

    public static getInstance(): RoomsStore {
        if (!RoomsStore.instance) {
            RoomsStore.instance = new RoomsStore();
        }
        return RoomsStore.instance;
    }

    private normalizeId(id: string): string {
        return `room:${id.toUpperCase()}`;
    }

    public async getRoom(id: string): Promise<Room | undefined> {
        const key = this.normalizeId(id);
        if (this.useKV) {
            return await kv.get<Room>(key) || undefined;
        }
        return this.memoryStore.get(id.toUpperCase());
    }

    public async setRoom(id: string, room: Room): Promise<void> {
        const key = this.normalizeId(id);
        if (this.useKV) {
            await kv.set(key, room, { ex: 3600 }); // Expire after 1 hour of inactivity
            return;
        }
        this.memoryStore.set(id.toUpperCase(), room);
    }

    public async deleteRoom(id: string): Promise<void> {
        const key = this.normalizeId(id);
        if (this.useKV) {
            await kv.del(key);
            return;
        }
        this.memoryStore.delete(id.toUpperCase());
    }

    public async listRooms(): Promise<Room[]> {
        if (this.useKV) {
            const keys = await kv.keys('room:*');
            if (keys.length === 0) return [];
            return await kv.mget<Room[]>(...keys);
        }
        return Array.from(this.memoryStore.values());
    }
}

export const roomsStore = RoomsStore.getInstance();
