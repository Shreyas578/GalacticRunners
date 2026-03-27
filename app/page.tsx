"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useMarketplacePurchase } from "@/hooks/use-marketplace-purchase"
import { StarWarsIntro } from "@/components/star-wars-intro"
import { SpaceshipsPortal } from "@/components/spaceships-portal"
import { MultiplayerLobby } from "@/components/multiplayer-lobby"
import dynamicImport from "next/dynamic"
const GameContainer = dynamicImport(() => import("@/components/game-container").then(mod => mod.GameContainer), { ssr: false })
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AnalysisDashboard } from "@/components/analysis-dashboard"
import { Rocket, Trophy, Users, Swords, Settings, Shield, Zap, Target, ArrowLeft, Home as HomeIcon, BarChart3, ShieldAlert } from "lucide-react"
import { ConnectButton } from "@mysten/dapp-kit"
import { LeaderboardWidget } from "@/components/leaderboard-widget"
import { toast } from "sonner"

import Image from "next/image"

type AppStep = "INTRO" | "PORTAL" | "MODE_SELECT" | "MULTIPLAYER_LOBBY" | "GAME"

export default function Home() {
    const account = useCurrentAccount()
    const isConnected = !!account
    const [step, setStep] = useState<AppStep>("INTRO")
    const [selectedShip, setSelectedShip] = useState<string | null>(null)
    const [multiplayerInfo, setMultiplayerInfo] = useState<{ roomId: string, isCreator: boolean, playerCount: number } | null>(null)
    const [missionMode, setMissionMode] = useState<"SOLO" | "MULTIPLAYER">("SOLO")

    // Owned ships — persisted to localStorage per wallet address
    const [ownedShips, setOwnedShips] = useState<string[]>(["viper"])

    // Load owned ships from localStorage when wallet connects
    useEffect(() => {
        if (!account?.address) {
            setOwnedShips(["viper"])
            return
        }
        const key = `ownedShips_${account.address}`
        try {
            const saved = localStorage.getItem(key)
            const parsed: string[] = saved ? JSON.parse(saved) : []
            const ships = Array.from(new Set(["viper", ...parsed]))
            setOwnedShips(ships)
        } catch {
            setOwnedShips(["viper"])
        }
    }, [account?.address])

    const { mutate: signAndExecute } = useSignAndExecuteTransaction()

    const signMissionEntry = async (): Promise<boolean> => {
        if (!account) {
            toast.error("Telemetry link offline. Connect wallet.")
            return false
        }

        return new Promise((resolve) => {
            const tx = new Transaction()
            const mistAmount = Math.floor(ENTRY_FEE_OCT * 1_000_000_000)
            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(mistAmount)])
            tx.transferObjects([coin], tx.pure.address(TREASURY_ADDRESS))

            toast.loading(`Signing Mission Entry Contract (${ENTRY_FEE_OCT} OCT)...`, { id: "mission" })

            signAndExecute({ transaction: tx }, {
                onSuccess: () => {
                    toast.success("Entry fee confirmed. Pilot cleared for departure.", { id: "mission" })
                    resolve(true)
                },
                onError: (err) => {
                    toast.error("Mission deployment aborted by pilot signature.", { id: "mission" })
                    resolve(false)
                }
            })
        })
    }

    const { purchaseShip } = useMarketplacePurchase()

    const handleSelectShip = (shipId: string) => {
        setSelectedShip(shipId)
        setStep("MODE_SELECT")
    }

    const handlePurchase = async (shipId: string, price: number) => {
        if (!account) {
            toast.error("Please connect your wallet to recruit new starfighters.")
            return
        }

        toast.loading(`Drafting recruitment contracts for ${shipId}...`, { id: "recruit" })

        try {
            const result = await purchaseShip(shipId, price)

            if (result.success) {
                toast.success(`${shipId} has joined the fleet!`, { id: "recruit" })
                setOwnedShips(prev => {
                    const updated = Array.from(new Set([...prev, shipId]))
                    if (account?.address) {
                        localStorage.setItem(`ownedShips_${account.address}`, JSON.stringify(updated.filter(s => s !== "viper")))
                    }
                    return updated
                })
            } else {
                toast.error(result.error || "Recruitment mission failed.", { id: "recruit" })
            }
        } catch (e) {
            toast.error("The Imperial budget office denied the transaction.", { id: "recruit" })
        }
    }

    const handleJoinMultiplayer = (roomId: string, isCreator: boolean, playerCount: number) => {
        setMultiplayerInfo({ roomId, isCreator, playerCount })
        setStep("GAME")
    }

    const TREASURY_ADDRESS = "0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2" // Command Center Treasury
    const ENTRY_FEE_OCT = 0.0001
    // Dashboard Owner Check
    const isOwner = account?.address === TREASURY_ADDRESS

    if (!isConnected && step !== "INTRO" && step !== "PORTAL") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <StarfieldCanvas />
                <Card className="max-w-md w-full border-red-500/50 bg-red-950/10 relative z-10">
                    <CardHeader className="text-center">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl font-bold text-red-400">Restricted Airspace</CardTitle>
                        <CardDescription>Biometric authentication required. Connect your OneWallet to access the hangar.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-foreground selection:bg-cyan-500/30">
            {/* Animated Starfield */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <canvas id="starfield" className="absolute inset-0 w-full h-full" />
            </div>

            {/* Star Wars Theme Music */}
            <audio id="theme-audio" loop preload="auto">
                <source src="/Star Wars- The Imperial March (Darth Vaders Theme).mp3" type="audio/mpeg" />
            </audio>

            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Galactic Runners" width={44} height={44} className="rounded-xl shadow-lg shadow-cyan-500/20" />
                    <div>
                        <h1 className="text-xl font-black star-wars-font tracking-tighter leading-none">GALACTIC RUNNERS</h1>
                        <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase opacity-70">On-Chain Combat Systems</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isOwner && step !== "INTRO" && step !== "PORTAL" && (
                        <Button variant="ghost" size="sm" onClick={() => setStep("PORTAL")} className="text-xs font-mono">
                            <HomeIcon className="w-4 h-4 mr-2" /> HANGAR
                        </Button>
                    )}
                    {isOwner && (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/5 px-3 py-1 font-mono text-[10px] flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" /> COMMANDER
                        </Badge>
                    )}
                    <ConnectButton />
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
                {/* ── OWNER: analytics only ── */}
                {isOwner && (
                    <div className="mt-4 animate-in fade-in duration-500">
                        <AnalysisDashboard />
                    </div>
                )}

                {/* ── REGULAR USERS ── */}
                {!isOwner && (
                    <>
                        {step === "INTRO" && <StarWarsIntro onComplete={() => setStep("PORTAL")} />}

                        {step === "PORTAL" && (
                            <div className="space-y-12">
                                <Tabs defaultValue="hangar" className="w-full">
                                    <TabsList className="flex w-fit mx-auto bg-black/60 border border-white/10 rounded-full px-1 py-1 gap-1 mb-10">
                                        <TabsTrigger value="hangar" className="rounded-full px-5 py-2 text-xs font-mono uppercase data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:font-bold transition-all">
                                            <Rocket className="w-3 h-3 mr-2 inline" /> Hangar
                                        </TabsTrigger>
                                        <TabsTrigger value="leaderboard" className="rounded-full px-5 py-2 text-xs font-mono uppercase data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">
                                            <Trophy className="w-3 h-3 mr-2 inline" /> Rankings
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="hangar" className="animate-in fade-in duration-300">
                                        <SpaceshipsPortal ownedShips={ownedShips} onSelect={handleSelectShip} onPurchase={handlePurchase} />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
                                            {[
                                                { icon: "🔥", label: "Kill Streak", desc: "5+ kills = score multiplier" },
                                                { icon: "📅", label: "Daily Streak", desc: "Play daily for up to 2x bonus" },
                                                { icon: "⭐", label: "Wave Bonus", desc: "Clear waves for extra points" },
                                                { icon: "💰", label: "OCT Rewards", desc: "Beat bosses & waves for OCT" },
                                            ].map(f => (
                                                <div key={f.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center space-y-1">
                                                    <div className="text-2xl">{f.icon}</div>
                                                    <div className="text-xs font-black font-mono text-cyan-400 uppercase">{f.label}</div>
                                                    <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="leaderboard" className="animate-in fade-in duration-300">
                                        <div className="max-w-2xl mx-auto">
                                            <LeaderboardWidget limit={50} />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}

                        {step === "MODE_SELECT" && (
                            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="text-center space-y-4">
                                    <h2 className="text-5xl font-black star-wars-font neon-glow tracking-tighter">SELECT MISSION TYPE</h2>
                                    <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">Deployment Authorization Required</p>
                                </div>
                                <div className="grid gap-8 md:grid-cols-2">
                                    <Card className="group hover:border-cyan-400 transition-all cursor-pointer bg-card/50 backdrop-blur"
                                        onClick={async () => {
                                            const feePaid = await signMissionEntry()
                                            if (feePaid) { setMissionMode("SOLO"); setStep("GAME") }
                                        }}>
                                        <CardHeader className="text-center space-y-4 group-hover:scale-105 transition-transform">
                                            <div className="mx-auto w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                                <Swords className="w-10 h-10 text-cyan-400" />
                                            </div>
                                            <CardTitle className="star-wars-font text-2xl">SOLO STRIKE</CardTitle>
                                            <CardDescription className="font-mono text-xs opacity-70">Deploy alone. Maximum difficulty.</CardDescription>
                                        </CardHeader>
                                    </Card>
                                    <Card className="group hover:border-purple-400 transition-all cursor-pointer bg-card/50 backdrop-blur"
                                        onClick={() => { setMissionMode("MULTIPLAYER"); setStep("MULTIPLAYER_LOBBY") }}>
                                        <CardHeader className="text-center space-y-4 group-hover:scale-105 transition-transform">
                                            <div className="mx-auto w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                                <Users className="w-10 h-10 text-purple-400" />
                                            </div>
                                            <CardTitle className="star-wars-font text-2xl">SQUADRON COMBAT</CardTitle>
                                            <CardDescription className="font-mono text-xs opacity-70">Up to 4 pilots. Shared rewards.</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>
                                <div className="text-center">
                                    <Button variant="ghost" onClick={() => setStep("PORTAL")} className="text-muted-foreground hover:text-white flex items-center gap-2 mx-auto">
                                        <ArrowLeft className="w-4 h-4" /> BACK TO HANGAR
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "MULTIPLAYER_LOBBY" && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="text-center space-y-2">
                                    <h2 className="text-4xl font-black star-wars-font tracking-tighter">SQUADRON LOBBY</h2>
                                    <p className="font-mono text-xs text-muted-foreground uppercase opacity-60">Real-time sub-space transmission active</p>
                                </div>
                                <MultiplayerLobby account={account?.address || ""} onJoinRoom={handleJoinMultiplayer} />
                            </div>
                        )}

                        {step === "GAME" && selectedShip && (
                            <div className="fixed inset-0 z-[100] bg-black overflow-hidden animate-in fade-in duration-1000">
                                <GameContainer
                                    selectedShip={selectedShip}
                                    account={account?.address || ""}
                                    mode={missionMode}
                                    playerCount={missionMode === "MULTIPLAYER" ? (multiplayerInfo?.playerCount ?? 1) : 1}
                                    roomId={missionMode === "MULTIPLAYER" ? multiplayerInfo?.roomId : undefined}
                                    isCreator={missionMode === "MULTIPLAYER" ? multiplayerInfo?.isCreator : undefined}
                                    onReturnToDashboard={() => setStep("PORTAL")}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="fixed bottom-0 w-full z-40 border-t border-white/5 bg-black/80 backdrop-blur-xl py-4">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
                        Galactic Runners // Powered by OneChain // Command & Control Systems Online
                    </div>
                    {isConnected && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase">Pilot Authenticated: {account?.address.slice(0, 6)}...</span>
                        </div>
                    )}
                </div>
            </footer>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        body {
            background: #000;
            cursor: crosshair;
        }

        .star-wars-font {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: -0.05em;
        }
        
        .neon-glow {
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3);
        }

        .star-wars-crawl {
            perspective: 400px;
            overflow: hidden;
        }

        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.2);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 211, 238, 0.4);
        }
      `}</style>

            <StarfieldCanvas />
            <ThemeMusic step={step} isOwner={isOwner} />
        </div>
    )
}

// Animated starfield canvas
function StarfieldCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener("resize", resize)

        const STAR_COUNT = 300
        const stars = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.2,
            speed: Math.random() * 0.4 + 0.05,
            opacity: Math.random() * 0.8 + 0.2,
        }))

        let animId: number
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            for (const s of stars) {
                ctx.beginPath()
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
                ctx.fill()
                s.y += s.speed
                if (s.y > canvas.height) {
                    s.y = 0
                    s.x = Math.random() * canvas.width
                }
            }
            animId = requestAnimationFrame(draw)
        }
        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", resize)
        }
    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full" />
}

// Auto-play Star Wars theme music
function ThemeMusic({ step, isOwner }: { step: string; isOwner: boolean }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        // Start music when intro ends or owner connects
        if (step !== "INTRO" || isOwner) {
            audio.volume = 0.35
            audio.play().then(() => setPlaying(true)).catch(() => { })
        }
    }, [step, isOwner])

    const toggle = () => {
        const audio = audioRef.current
        if (!audio) return
        if (playing) { audio.pause(); setPlaying(false) }
        else { audio.play(); setPlaying(true) }
    }

    return (
        <>
            <audio ref={audioRef} loop src="/Star Wars- The Imperial March (Darth Vaders Theme).mp3" />
            <button
                onClick={toggle}
                className="fixed bottom-16 right-4 z-50 w-10 h-10 rounded-full bg-black/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title={playing ? "Mute music" : "Play music"}
            >
                {playing ? "🔊" : "🔇"}
            </button>
        </>
    )
}
