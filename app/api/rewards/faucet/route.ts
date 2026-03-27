// Faucet for testnet OCT token distribution
import { type NextRequest, NextResponse } from "next/server"

interface FaucetRequest {
  address: string
}

// Track faucet claims per address (in-memory for demo, use database in production)
const claimHistory = new Map<string, number>()
const FAUCET_AMOUNT = "1000000000000000000" // 1 OCT (18 decimals)
const FAUCET_COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FaucetRequest

    if (!body.address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 })
    }

    const lastClaim = claimHistory.get(body.address) || 0
    const now = Date.now()

    if (now - lastClaim < FAUCET_COOLDOWN) {
      const timeRemaining = Math.ceil((FAUCET_COOLDOWN - (now - lastClaim)) / 1000 / 60)
      return NextResponse.json({ error: `Faucet on cooldown. Try again in ${timeRemaining} minutes` }, { status: 429 })
    }

    claimHistory.set(body.address, now)

    // In production, this would call the actual faucet contract
    return NextResponse.json({
      success: true,
      amount: FAUCET_AMOUNT,
      address: body.address,
      message: "OCT tokens sent to your wallet",
      transactionHash: "0x" + Math.random().toString(16).slice(2),
    })
  } catch (error) {
    console.error("Faucet error:", error)
    return NextResponse.json({ error: "Faucet transfer failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    faucetAmount: FAUCET_AMOUNT,
    cooldownHours: FAUCET_COOLDOWN / (1000 * 60 * 60),
  })
}
