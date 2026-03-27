import { NextRequest, NextResponse } from "next/server"
import { roomsStore, Room } from "@/lib/rooms-store"

function defaultGameState() {
    return {
        wave: 1,
        enemies: [],
        playerStates: {},
        lastUpdate: Date.now(),
        isGameOver: false
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (roomId) {
        const room = await roomsStore.getRoom(roomId)
        if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
        return NextResponse.json({ success: true, room })
    }

    const rooms = await roomsStore.listRooms()
    const activeRooms = rooms
        .filter(r => r.status === 'WAITING')
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(({ gameState, ...r }) => r) // strip gameState from list view

    return NextResponse.json({ success: true, rooms: activeRooms })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, roomId, playerAddress } = body

        if (action === 'CREATE') {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
            const newRoom: Room = {
                id: newRoomId,
                creator: playerAddress,
                players: [playerAddress],
                status: 'WAITING',
                createdAt: Date.now(),
                gameState: defaultGameState(),
                readyPlayers: []
            }
            await roomsStore.setRoom(newRoomId, newRoom)
            const { gameState, ...roomData } = newRoom
            return NextResponse.json({ success: true, room: roomData })
        }

        if (action === 'JOIN') {
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
            if (room.status !== 'WAITING') return NextResponse.json({ success: false, error: 'Room already in progress' }, { status: 400 })
            if (room.players.length >= 4) return NextResponse.json({ success: false, error: 'Room full' }, { status: 400 })
            if (!room.players.includes(playerAddress)) room.players.push(playerAddress)
            await roomsStore.setRoom(room.id, room)
            const { gameState, ...roomData } = room
            return NextResponse.json({ success: true, room: roomData })
        }

        if (action === 'START') {
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
            if (room.players.length < 2) return NextResponse.json({ success: false, error: 'Need at least 2 players' }, { status: 400 })
            room.status = 'PLAYING'
            room.gameState = defaultGameState()
            await roomsStore.setRoom(room.id, room)
            const { gameState, ...roomData } = room
            return NextResponse.json({ success: true, room: roomData })
        }

        // Push local player state + enemies (only creator pushes enemies/wave)
        if (action === 'SYNC_PUSH') {
            const { playerState, enemies, wave } = body
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

            // Update this player's position/health/score
            if (playerState && playerAddress) {
                const existing = room.gameState.playerStates[playerAddress]
                room.gameState.playerStates[playerAddress] = {
                    ...playerState,
                    bullets: playerState.bullets || (existing ? existing.bullets : []),
                    shipType: playerState.shipType || (existing ? existing.shipType : undefined),
                    lastUpdate: Date.now()
                }
            }

            // Only the creator is authoritative for enemy state
            if (room.creator === playerAddress) {
                if (enemies !== undefined) room.gameState.enemies = enemies
                if (wave !== undefined) room.gameState.wave = wave
                room.gameState.lastUpdate = Date.now()
            }

            // Any player can trigger common game over if they die
            if (body.isGameOver) {
                room.gameState.isGameOver = true
                room.status = 'GAMEOVER'
            }

            await roomsStore.setRoom(room.id, room)
            return NextResponse.json({ success: true })
        }

        // Pull full game state (enemies + all other players)
        if (action === 'SYNC_PULL') {
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

            // Remove stale players (no update in 5s)
            const now = Date.now()
            for (const [addr, ps] of Object.entries(room.gameState.playerStates)) {
                if (now - ps.lastUpdate > 5000) delete room.gameState.playerStates[addr]
            }

            return NextResponse.json({
                success: true,
                gameState: room.gameState,
                players: room.players,
                readyPlayers: room.readyPlayers || [],
                status: room.status,
                creator: room.creator
            })
        }

        if (action === 'READY') {
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
            if (!room.readyPlayers) room.readyPlayers = []
            
            const isReady = body.ready
            if (isReady && !room.readyPlayers.includes(playerAddress)) {
                room.readyPlayers.push(playerAddress)
            } else if (!isReady) {
                room.readyPlayers = room.readyPlayers.filter(p => p !== playerAddress)
            }
            await roomsStore.setRoom(room.id, room)
            return NextResponse.json({ success: true, readyPlayers: room.readyPlayers })
        }

        if (action === 'RESTART') {
            const room = await roomsStore.getRoom(roomId)
            if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
            if (room.creator !== playerAddress) return NextResponse.json({ success: false, error: 'Only creator can restart' }, { status: 403 })
            
            room.status = 'PLAYING'
            room.gameState = defaultGameState()
            room.readyPlayers = []
            await roomsStore.setRoom(room.id, room)
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
}
