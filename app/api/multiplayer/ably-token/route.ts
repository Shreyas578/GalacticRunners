import { NextResponse } from "next/server"
import Ably from "ably"

export async function GET() {
  const apiKey = process.env.ABLY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ABLY_API_KEY" },
      { status: 500 },
    )
  }

  const clientId = "pilot"
  const ably = new Ably.Rest(apiKey)
  const tokenRequest = await ably.auth.createTokenRequest({ clientId })
  return NextResponse.json(tokenRequest)
}

