// API route for signing game claims (bosses defeated, scores, etc.)
import { type NextRequest, NextResponse } from "next/server"

interface ClaimPayload {
  playerAddress: string
  bossType: string
  score: number
  wave: number
  timestamp: number
}

// Mock signature - in production, use OneChain-compatible signing (Move validator key)
function signClaim(payload: ClaimPayload): string {
  const message = JSON.stringify(payload)
  // This would be signed with a backend private key using ethers.js
  // For now, return a mock signature
  return "0x" + Buffer.from(message).toString("hex")
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClaimPayload

    if (!body.playerAddress || !body.bossType || body.score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const signature = signClaim(body)

    return NextResponse.json({
      success: true,
      signature,
      message: "Claim signed successfully",
    })
  } catch (error) {
    console.error("Claim signing error:", error)
    return NextResponse.json({ error: "Failed to sign claim" }, { status: 500 })
  }
}
