"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCw, Flame, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  wave: number
  shipType: string
}

const MEDALS = ["🥇", "🥈", "🥉"]
const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"]

export function LeaderboardWidget({ limit = 10 }: { limit?: number }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`)
      const data = await res.json()
      if (data.success) {
        setLeaderboard(data.entries)
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [limit])

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <Card className="border-yellow-500/20 bg-black/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-yellow-400 star-wars-font text-lg">
            <Trophy className="w-5 h-5" /> GALACTIC LEADERBOARD
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchLeaderboard} className="h-7 w-7 p-0 text-muted-foreground hover:text-white">
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-[10px] font-mono text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && leaderboard.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground font-mono text-xs animate-pulse">
            SCANNING GALACTIC RECORDS...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Zap className="w-8 h-8 text-yellow-500/30 mx-auto" />
            <p className="text-muted-foreground font-mono text-xs">NO RECORDS YET. BE THE FIRST!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${entry.rank <= 3 ? "bg-yellow-500/5 border border-yellow-500/10" : "hover:bg-white/5"}`}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : <span className={`font-mono text-xs ${RANK_COLORS[entry.rank - 1] || "text-muted-foreground"}`}>#{entry.rank}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-300 truncate">{truncate(entry.address)}</span>
                    {entry.shipType && (
                      <Badge className="text-[9px] px-1 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                        {entry.shipType}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">Wave {entry.wave}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold font-mono text-sm ${entry.rank === 1 ? "text-yellow-400" : "text-white"}`}>
                    {entry.score.toLocaleString()}
                  </div>
                  {entry.rank === 1 && <Flame className="w-3 h-3 text-orange-400 ml-auto" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
