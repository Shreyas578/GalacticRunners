// Global leaderboard for game scores
import { type NextRequest, NextResponse } from "next/server"

interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  wave: number
  timestamp: number
  shipType: string
}

// Mock leaderboard data starting empty to show real player data
const leaderboardData: LeaderboardEntry[] = []

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  try {
    const paginatedData = leaderboardData.slice(offset, offset + limit)
    const total = leaderboardData.length

    return NextResponse.json({
      success: true,
      entries: paginatedData,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<LeaderboardEntry, "rank" | "timestamp">

    if (!body.address || body.score === undefined || body.wave === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Keep only best score per address
    const existingIdx = leaderboardData.findIndex(e => e.address === body.address)
    if (existingIdx >= 0) {
      if (body.score <= leaderboardData[existingIdx].score) {
        return NextResponse.json({ success: true, message: "Score not a new personal best" })
      }
      leaderboardData.splice(existingIdx, 1)
    }

    const newEntry: LeaderboardEntry = {
      ...body,
      rank: 0,
      timestamp: Date.now(),
    }

    leaderboardData.push(newEntry)
    leaderboardData.sort((a, b) => b.score - a.score)
    leaderboardData.forEach((entry, index) => { entry.rank = index + 1 })

    return NextResponse.json({ success: true, entry: newEntry })
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 })
  }
}
