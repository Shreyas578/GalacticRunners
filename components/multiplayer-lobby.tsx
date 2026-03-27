"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Play, Loader2, Signal } from "lucide-react"
import { toast } from "sonner"
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"

const ENTRY_FEE_OCT = 0.01
const TREASURY_ADDRESS = "0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2"

export function MultiplayerLobby({
    account,
    onJoinRoom
}: {
    account: string,
    onJoinRoom: (roomId: string, isCreator: boolean, playerCount: number) => void
}) {
    const [rooms, setRooms] = useState<any[]>([])
    const [roomCode, setRoomCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [activeRoom, setActiveRoom] = useState<any>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const { mutate: signAndExecute } = useSignAndExecuteTransaction()
    const currentAccount = useCurrentAccount()

    // Poll the specific active room every 2s to sync players + detect game start
    useEffect(() => {
        if (!activeRoom) {
            if (pollRef.current) clearInterval(pollRef.current)
            return
        }

        const poll = async () => {
            try {
                const res = await fetch(`/api/multiplayer/rooms?roomId=${activeRoom.id}`, { cache: "no-store" })
                const data = await res.json()
                if (!data.success) return

                const updated = data.room
                setActiveRoom(updated)

                // Non-creator: auto-launch when creator starts
                if (updated.status === 'PLAYING' && updated.creator !== account) {
                    if (pollRef.current) clearInterval(pollRef.current)
                    toast.success("Commander initiated the mission. Launching...")
                    onJoinRoom(updated.id, false, updated.players.length)
                }
            } catch (e) {
                console.error("Room poll failed", e)
            }
        }

        pollRef.current = setInterval(poll, 500)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [activeRoom?.id, account, onJoinRoom])

    // Poll available rooms list
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch('/api/multiplayer/rooms')
                const data = await res.json()
                if (data.success) setRooms(data.rooms)
            } catch (e) { }
        }
        fetchRooms()
        const interval = setInterval(fetchRooms, 5000)
        return () => clearInterval(interval)
    }, [])

    const signEntryFee = async (): Promise<boolean> => {
        if (!currentAccount) {
            toast.error("Connect your wallet first.")
            return false
        }
        return new Promise((resolve) => {
            const tx = new Transaction()
            const mistAmount = Math.floor(ENTRY_FEE_OCT * 1_000_000_000)
            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(mistAmount)])
            tx.transferObjects([coin], tx.pure.address(TREASURY_ADDRESS))
            toast.loading(`Paying entry fee (${ENTRY_FEE_OCT} OCT)...`, { id: "entry" })
            signAndExecute({ transaction: tx }, {
                onSuccess: () => { toast.success("Entry fee paid.", { id: "entry" }); resolve(true) },
                onError: () => { toast.error("Entry fee rejected.", { id: "entry" }); resolve(false) }
            })
        })
    }

    const handleCreateRoom = async () => {
        const feePaid = await signEntryFee()
        if (!feePaid) return
        setLoading(true)
        try {
            const res = await fetch('/api/multiplayer/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE', playerAddress: account })
            })
            const data = await res.json()
            if (data.success) {
                setActiveRoom(data.room)
                toast.success(`Room ${data.room.id} created! Share the code.`)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleJoinByCode = async (code?: string) => {
        const id = (code || roomCode).toUpperCase()
        if (!id) return
        const feePaid = await signEntryFee()
        if (!feePaid) return
        setLoading(true)
        try {
            const res = await fetch('/api/multiplayer/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'JOIN', roomId: id, playerAddress: account })
            })
            const data = await res.json()
            if (data.success) {
                setActiveRoom(data.room)
                toast.success("Joined room! Waiting for commander...")
            } else {
                toast.error(data.error || "Room not found")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleStartGame = async () => {
        if (!activeRoom) return
        if (activeRoom.players.length < 2) {
            toast.warning("Need at least 2 pilots to launch.")
            return
        }
        try {
            const res = await fetch('/api/multiplayer/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'START', roomId: activeRoom.id })
            })
            const data = await res.json()
            if (data.success) {
                onJoinRoom(activeRoom.id, true, data.room.players.length)
            }
        } catch (e) {
            toast.error("Launch sequence failed!")
        }
    }

    if (activeRoom) {
        const isCreator = activeRoom.creator === account
        return (
            <Card className="max-w-md mx-auto border-cyan-500/50 bg-card/50 backdrop-blur animate-in zoom-in duration-300">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <Signal className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-mono">MISSION LOBBY: {activeRoom.id}</CardTitle>
                    <CardDescription>
                        {isCreator ? "Waiting for pilots — start when ready" : "Waiting for commander to launch..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-black/40 p-4 rounded-lg border border-border/50">
                        <h4 className="text-xs font-mono uppercase text-muted-foreground mb-3 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Squadron Pilots ({activeRoom.players.length}/4)
                        </h4>
                        <div className="space-y-2">
                            {activeRoom.players.map((p: string, i: number) => (
                                <div key={p} className="flex items-center justify-between text-sm font-mono p-2 bg-muted/30 rounded">
                                    <span className="truncate max-w-[200px] text-cyan-300">{p.slice(0, 8)}...{p.slice(-4)}</span>
                                    <div className="flex items-center gap-2">
                                        {p === account && <Badge className="text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">YOU</Badge>}
                                        {i === 0 && <Badge variant="outline" className="text-[9px] border-yellow-500/50 text-yellow-500">CREATOR</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Room code to share */}
                    <div className="text-center p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/20">
                        <p className="text-[10px] text-muted-foreground font-mono mb-1">SHARE ROOM CODE</p>
                        <p className="text-2xl font-black font-mono text-cyan-400 tracking-widest">{activeRoom.id}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    {isCreator ? (
                        <Button
                            onClick={handleStartGame}
                            disabled={activeRoom.players.length < 2}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 disabled:opacity-40"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            LAUNCH MISSION ({activeRoom.players.length} pilots)
                        </Button>
                    ) : (
                        <div className="text-center w-full py-4 text-sm text-cyan-400 font-mono animate-pulse">
                            ⏳ WAITING FOR COMMANDER TO LAUNCH...
                        </div>
                    )}
                    <Button variant="ghost" className="w-full text-xs text-red-400 hover:text-red-300" onClick={() => setActiveRoom(null)}>
                        ABANDON LOBBY
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="border-cyan-500/30 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-cyan-400" /> Squadron Command
                    </CardTitle>
                    <CardDescription>Create a new room or join via mission code</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button onClick={handleCreateRoom} disabled={loading} className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 font-bold">
                        {loading ? <Loader2 className="animate-spin" /> : "CREATE SQUADRON ROOM"}
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Use Code</span></div>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE (e.g. AB12XY)"
                            className="font-mono text-center uppercase tracking-widest"
                            maxLength={6}
                        />
                        <Button onClick={() => handleJoinByCode()} disabled={loading || !roomCode} variant="secondary">
                            JOIN
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Signal className="w-5 h-5 text-purple-400" /> Galactic Transmissions
                    </CardTitle>
                    <CardDescription>Active squadrons seeking reinforcements</CardDescription>
                </CardHeader>
                <CardContent>
                    {rooms.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground font-mono">
                            NO ACTIVE TRANSMISSIONS FOUND.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map(room => (
                                <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-purple-500/50 transition-colors bg-muted/20">
                                    <div>
                                        <div className="font-mono font-bold text-purple-400 tracking-wider">ROOM: {room.id}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase">
                                            {room.players.length}/4 Pilots Connected
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleJoinByCode(room.id)}>
                                        JOIN
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
