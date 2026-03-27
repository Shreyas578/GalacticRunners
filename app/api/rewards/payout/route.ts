import { NextRequest, NextResponse } from "next/server"
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client"
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519"
import { TransactionBlock } from "@mysten/sui.js/transactions"

// Treasury Configuration
const TREASURY_ADDRESS = "0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2"
const RPC_URL = process.env.NEXT_PUBLIC_ONECHAIN_NODE_URL || "https://rpc-testnet.onelabs.cc:443"

// In-memory transaction history for the session
export const TX_HISTORY: any[] = []

export async function POST(req: NextRequest) {
    try {
        const { playerAddress, eventType, wave, score } = await req.json()

        if (!playerAddress) {
            return NextResponse.json({ success: false, error: "Missing player address" }, { status: 400 })
        }

        // 1. Calculate Reward Amount based on event type
        let rewardOCT = 0
        const type = eventType?.toLowerCase()
        if (type === "boss_kill") {
            rewardOCT = 0.05 // 0.05 OCT for boss kill
        } else if (type === "wave_clear") {
            rewardOCT = 0.01 * (wave / 5) // Milestone rewards
        } else if (type === "top_score") {
            rewardOCT = 0.1 // 0.1 OCT for high score
        }

        if (rewardOCT <= 0) {
            return NextResponse.json({ success: true, message: "No reward for this event" })
        }

        // 2. Prepare Transaction using Treasury Key
        const secretKey = process.env.ONECHAIN_TREASURY_SECRET_KEY
        if (!secretKey) {
            console.warn("⚠️ ONECHAIN_TREASURY_SECRET_KEY not found in environment. Simulated payout.")
            // Record simulated transaction
            const simTx = {
                id: Math.random().toString(36).substring(7),
                player: playerAddress,
                amount: rewardOCT,
                type: eventType,
                status: "SIMULATED",
                timestamp: Date.now()
            }
            TX_HISTORY.unshift(simTx)
            return NextResponse.json({ success: true, rewardOCT, status: "SIMULATED" })
        }

        // Real transaction logic
        let keyBuffer: Buffer
        try {
            // Check if it's base64 (common for shared keys)
            if (secretKey.includes('+') || secretKey.includes('/') || secretKey.endsWith('=')) {
                keyBuffer = Buffer.from(secretKey, 'base64')
            } else {
                // Remove 0x prefix and parse hex
                const cleanHex = secretKey.replace(/^0x/, '')
                keyBuffer = Buffer.from(cleanHex, 'hex')
            }

            // Sui/Onechain Ed25519 keys are 32 bytes.
            // Some exports include the public key (total 64 bytes) or other flags.
            // We ensure we only pass the 32-byte seed.
            if (keyBuffer.length > 32) {
                // If it's a 33-byte flagged key (flag at 0), skip flag
                if (keyBuffer.length === 33 && (keyBuffer[0] === 0 || keyBuffer[0] === 1)) {
                    keyBuffer = keyBuffer.slice(1)
                } else {
                    keyBuffer = keyBuffer.slice(0, 32)
                }
            } else if (keyBuffer.length < 32) {
                // Pad if too short (highly unusual)
                const padded = Buffer.alloc(32)
                keyBuffer.copy(padded, 32 - keyBuffer.length)
                keyBuffer = padded
            }
        } catch (e) {
            return NextResponse.json({ success: false, error: "Invalid secret key format" }, { status: 400 })
        }

        const keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(keyBuffer))
        const client = new SuiClient({ url: RPC_URL })
        const txb = new TransactionBlock()

        const mistAmount = Math.floor(rewardOCT * 1_000_000_000)
        const [coin] = txb.splitCoins(txb.gas, [txb.pure(mistAmount)])
        txb.transferObjects([coin], txb.pure(playerAddress))

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: txb,
        })

        // 3. Record in History
        const txRecord = {
            id: result.digest,
            player: playerAddress,
            amount: rewardOCT,
            type: eventType,
            status: "CONFIRMED",
            timestamp: Date.now()
        }
        TX_HISTORY.unshift(txRecord)
        if (TX_HISTORY.length > 100) TX_HISTORY.pop()

        return NextResponse.json({ success: true, rewardOCT, digest: result.digest })

    } catch (error: any) {
        console.error("Payout error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ success: true, history: TX_HISTORY })
}
