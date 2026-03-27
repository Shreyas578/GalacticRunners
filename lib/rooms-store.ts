
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
 * It defaults to a global in-memory Map for local development.
 * In production (Vercel), you should replace the Map with a calls to Vercel KV or Redis.
 */
class RoomsStore {
    private static instance: RoomsStore;
    private memoryStore: Map<string, Room>;

    private constructor() {
        // Use global to persist across hot reloads in Next.js development
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

    public async getRoom(id: string): Promise<Room | undefined> {
        return this.memoryStore.get(id.toUpperCase());
    }

    public async setRoom(id: string, room: Room): Promise<void> {
        this.memoryStore.set(id.toUpperCase(), room);
    }

    public async deleteRoom(id: string): Promise<void> {
        this.memoryStore.delete(id.toUpperCase());
    }

    public async listRooms(): Promise<Room[]> {
        return Array.from(this.memoryStore.values());
    }
}

export const roomsStore = RoomsStore.getInstance();
