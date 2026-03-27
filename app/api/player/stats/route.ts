// Get player stats and inventory
import { type NextRequest, NextResponse } from "next/server"

interface PlayerStats {
  address: string
  totalScore: number
  totalGamesPlayed: number
  totalWins: number
  highestWave: number
  octBalance: string
  shardBalance: string
  shipsOwned: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address parameter required" }, { status: 400 })
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 })
  }

  try {
    // In production, fetch from database or smart contracts
    const stats: PlayerStats = {
      address,
      totalScore: Math.floor(Math.random() * 100000),
      totalGamesPlayed: Math.floor(Math.random() * 100),
      totalWins: Math.floor(Math.random() * 30),
      highestWave: Math.floor(Math.random() * 20),
      octBalance: "5000000000000000000", // 5 OCT
      shardBalance: "250000", // 250 SHARD
      shipsOwned: Math.floor(Math.random() * 5),
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch player stats" }, { status: 500 })
  }
}
