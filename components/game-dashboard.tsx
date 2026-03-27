"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShipSelector } from "@/components/ship-selector"
import { WalletInfo } from "@/components/wallet-info-sdk"
import { GameContainer } from "@/components/game-container"
import { LeaderboardWidget } from "@/components/leaderboard-widget"
import { Badge } from "@/components/ui/badge"
import { Rocket, Zap, Target, BarChart3 } from "lucide-react"
import { onechainClient } from "@/lib/onechain"
import { AnalysisDashboard } from "./analysis-dashboard"

const PLATFORM_OWNER = "0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2"

interface GameDashboardProps {
  account: string
}

export function GameDashboard({ account }: GameDashboardProps) {
  const isOwner = account.toLowerCase() === PLATFORM_OWNER.toLowerCase()
  const [selectedShip, setSelectedShip] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [ownedShips, setOwnedShips] = useState<any[]>([])

  useEffect(() => {
    const fetchShips = async () => {
      if (account) {
        try {
          const ships = await onechainClient.getPlayerSpaceships(account)
          setOwnedShips(ships)
        } catch (error) {
          console.error("Failed to fetch ships:", error)
        }
      }
    }
    fetchShips()
  }, [account])

  const handleStartGame = () => {
    if (selectedShip) {
      setGameStarted(true)
    }
  }

  if (gameStarted && selectedShip) {
    return (
      <GameContainer
        selectedShip={selectedShip}
        account={account}
        onReturnToDashboard={() => {
          setGameStarted(false)
          setSelectedShip(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <Card className="border-emerald-500/50 bg-emerald-950/20 backdrop-blur mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-emerald-400 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Analysis Terminal
              </CardTitle>
              <CardDescription className="text-emerald-500/70">
                Authorized Access: {account}
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-400">
              ADMIN-LEVEL-4
            </Badge>
          </CardHeader>
          <CardContent>
            <AnalysisDashboard />
          </CardContent>
        </Card>
      )}

      {/* Mission Briefing Header */}
      <div className="text-center space-y-2">
        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/50 px-4 py-1">
          <Zap className="w-3 h-3 mr-1 inline" />
          MISSION BRIEFING
        </Badge>
        <h2 className="text-3xl font-bold neon-glow">Select Your Starfighter</h2>
        <p className="text-muted-foreground">Choose your vessel and deploy to the battlefield</p>
      </div>

      {/* Ship Selector */}
      <ShipSelector selectedShip={selectedShip} onSelectShip={setSelectedShip} ownedShips={ownedShips} />

      {/* Mission Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-500/30 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Waves Survived</div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">Max: 5+</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-400" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider">High Score</div>
            </div>
            <div className="text-2xl font-bold text-purple-400">25,000+</div>
          </CardContent>
        </Card>
      </div>

      {/* Deploy Button */}
      <Button
        onClick={handleStartGame}
        disabled={!selectedShip}
        size="lg"
        className={`w-full text-lg py-8 font-bold transition-all duration-300 ${selectedShip
          ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 animate-pulse"
          : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
          }`}
      >
        <Rocket className="w-6 h-6 mr-2" />
        {selectedShip ? "🚀 DEPLOY TO BATTLE!" : "⚠️ SELECT A STARFIGHTER FIRST"}
      </Button>

      {/* Mission Objectives */}
      <Card className="border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-red-950/20 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Target className="w-5 h-5" />
            Mission Objectives
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Defeat Imperial forces and survive the onslaught
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Each starfighter has unique stats and abilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Survive waves of increasingly difficult enemies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">★</span>
              <span className="font-semibold">Boss encounter every 5 waves - destroy for NFT rewards!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">◆</span>
              <span>Your score is recorded on the global leaderboard</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Wallet & Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WalletInfo />
        <LeaderboardWidget />
      </div>
    </div>
  )
}
