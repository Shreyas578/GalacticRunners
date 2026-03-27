"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { useClaimBossDrop } from "@/hooks/use-claim-boss-drop"
import { toast } from "sonner"

const PhaserGame = dynamic(
  () => import("@/components/phaser-game").then((mod) => mod.PhaserGame),
  { ssr: false }
)
import { Trophy, ArrowLeft, RotateCcw, Maximize } from "lucide-react"
import { apiClient } from "@/app/api-client"

interface GameContainerProps {
  selectedShip: string
  account: string
  mode?: "SOLO" | "MULTIPLAYER"
  playerCount?: number
  roomId?: string
  isCreator?: boolean
  onReturnToDashboard: () => void
}

export function GameContainer({ selectedShip, account, mode = "SOLO", playerCount = 1, roomId, isCreator, onReturnToDashboard }: GameContainerProps) {
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [health, setHealth] = useState({ current: 100, max: 100 })
  const [gameOver, setGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [finalWave, setFinalWave] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pendingReward, setPendingReward] = useState<any>(null)
  const [readyPlayers, setReadyPlayers] = useState<string[]>([])
  const [roomPlayers, setRoomPlayers] = useState<string[]>([])
  const [roomStatus, setRoomStatus] = useState<string>("PLAYING")
  const [roomCreator, setRoomCreator] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const prevRoomStatusRef = useRef<string>("PLAYING")
  
  const { claimDrop } = useClaimBossDrop()

  const handleBossDefeated = (data: any) => {
    setPendingReward(data)
    toast.success(`BOSS DEFEATED! OCT reward incoming...`, {
      description: "Treasury is sending your OCT reward automatically."
    })
  }

  // Listen for OCT reward events from Phaser
  useEffect(() => {
    const handler = (e: Event) => {
      const { amount, eventType } = (e as CustomEvent).detail
      const label = eventType === "boss_kill" ? "Boss Kill" : `Wave ${eventType.replace("wave_", "")} Clear`
      toast.success(`💰 +${amount} OCT REWARD!`, {
        description: `${label} reward sent from treasury to your wallet.`
      })
    }
    window.addEventListener("gameReward", handler)
    return () => window.removeEventListener("gameReward", handler)
  }, [])

  const handleClaimReward = async () => {
    if (!pendingReward) return
    
    toast.info("Signing ritual initiated...", { description: "Please approve the transaction to claim your drop." })
    const result = await claimDrop(pendingReward.index, pendingReward.rarity)
    
    if (result.success) {
        toast.success("REWARD CLAIMED!", { description: `NFT minted: ${result.digest}` })
        setPendingReward(null)
    } else {
        toast.error("MISSION FAILED", { description: result.error || "Claim failed. Try again later." })
    }
  }
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-enter fullscreen when game starts
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenEnabled) {
          await containerRef.current.requestFullscreen()
          setIsFullscreen(true)
          console.log("✅ Entered fullscreen mode")
        }
      } catch (error) {
        console.log("Fullscreen not available or denied:", error)
      }
    }

    enterFullscreen()

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { })
      }
    }
  }, [])

  const handleGameEnd = async (score: number, wave: number) => {
    setFinalScore(score)
    setFinalWave(wave)
    setGameOver(true)
    setRoomStatus("GAMEOVER")
    try {
      await apiClient.submitScore(score, wave, account, selectedShip)
      // Trigger top-score reward
      await fetch("/api/rewards/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: account, eventType: "top_score", wave, score }),
      })
    } catch { }
  }

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { })
    }
    onReturnToDashboard()
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error)
    }
  }

  // Multiplayer polling for ready status and restart
  useEffect(() => {
    if (mode !== "MULTIPLAYER" || !roomId || !gameOver) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/multiplayer/rooms?roomId=${roomId}`, { cache: "no-store" })
        const data = await res.json()
        if (data.success) {
          const nextStatus = data.room.status
          const prevStatus = prevRoomStatusRef.current
          setReadyPlayers(data.room.readyPlayers || [])
          setRoomPlayers(data.room.players || [])
          setRoomStatus(nextStatus)
          setRoomCreator(data.room.creator)

          // Automatic restart when creator triggers it
          if (nextStatus === "PLAYING" && prevStatus === "GAMEOVER") {
            setGameOver(false)
            setIsReady(false)
            setFinalScore(0)
            setFinalWave(0)
          }
          prevRoomStatusRef.current = nextStatus
        }
      } catch (e) {}
    }

    const interval = setInterval(poll, 300)
    poll()
    return () => clearInterval(interval)
  }, [mode, roomId, gameOver])

  const handleReady = async () => {
    try {
      await fetch("/api/multiplayer/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "READY", roomId, playerAddress: account, ready: !isReady }),
      })
      setIsReady(!isReady)
    } catch (e) {}
  }

  const handleRestart = async () => {
    try {
      await fetch("/api/multiplayer/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTART", roomId, playerAddress: account }),
      })
      // Immediate transition for leader
      setGameOver(false)
      setIsReady(false)
      setFinalScore(0)
      setFinalWave(0)
      prevRoomStatusRef.current = "PLAYING"
    } catch (e) {}
  }

  if (gameOver) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-lg flex items-center justify-center z-50">
        <Card className="border-cyan-500/50 bg-card/90 backdrop-blur max-w-md overflow-hidden">
          <div className="absolute inset-0 scanner-effect opacity-20" />
          <CardHeader className="relative z-10 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold neon-glow">Mission Complete</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">Returning to hangar bay...</p>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Final Score</div>
                <div className="text-4xl font-bold text-cyan-400">{finalScore.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-purple-500/30 bg-purple-950/20">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Waves</div>
                <div className="text-4xl font-bold text-purple-400">{finalWave}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {mode === "MULTIPLAYER" ? (
                <>
                  <div className="text-center p-3 rounded-lg border border-cyan-500/20 bg-black/40 mb-2">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      SQUADRON STATUS
                    </div>
                    <div className="space-y-1">
                      {roomPlayers.map(p => (
                        <div key={p} className="flex items-center justify-between text-[10px] font-mono">
                          <span className={p === account ? "text-cyan-400" : "text-muted-foreground"}>
                            {p.slice(0, 6)}...{p.slice(-4)}{p === account ? " (YOU)" : ""}
                          </span>
                          <span className={p === roomCreator ? "text-cyan-500 font-bold" : (readyPlayers.includes(p) ? "text-emerald-400" : "text-red-400")}>
                            {p === roomCreator ? "LEADER" : (readyPlayers.includes(p) ? "READY" : "WAITING")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isCreator && (
                    <Button
                      onClick={handleReady}
                      className={`${isReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-700"} text-white shadow-lg`}
                    >
                      <RotateCcw className={`w-4 h-4 mr-2 ${isReady ? "animate-spin" : ""}`} />
                      {isReady ? "READY FOR DEPLOYMENT" : "GET READY"}
                    </Button>
                  )}

                  {isCreator && (
                    <Button
                      onClick={handleRestart}
                      disabled={roomPlayers.length > 1 && roomPlayers.filter(p => p !== roomCreator).some(p => !readyPlayers.includes(p))}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Redeploy Squadron
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => {
                    setGameOver(false)
                    setFinalScore(0)
                    setFinalWave(0)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Deploy Again
                </Button>
              )}
              
              <Button
                onClick={handleExit}
                variant="outline"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Command
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-screen bg-black z-40">
      <PhaserGame 
        selectedShip={selectedShip} 
        account={account} 
        mode={mode}
        playerCount={playerCount}
        roomId={roomId}
        isCreator={isCreator}
        onGameEnd={handleGameEnd} 
        onBossDefeated={handleBossDefeated}
      />

      {/* Game Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {pendingReward && (
          <Button
            onClick={handleClaimReward}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 animate-bounce"
            size="sm"
          >
            <Trophy className="w-4 h-4 mr-2" />
            CLAIM {pendingReward.type} REWARD
          </Button>
        )}
        {!isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50"
            size="sm"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        )}
        <Button
          onClick={handleExit}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg shadow-red-500/50"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Abort Mission
        </Button>
      </div>
    </div>
  )
}
