import { NextRequest, NextResponse } from 'next/server'
import { SuiClient } from '@mysten/sui.js/client'

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json()

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }

        console.log('🔍 API: Fetching balance for:', address)

        // Use correct OneChain RPC URL with port
        const rpcUrl = 'https://rpc-testnet.onelabs.cc:443'
        console.log('🔗 API: Using RPC URL:', rpcUrl)

        // Create Sui client for OneChain
        const client = new SuiClient({ url: rpcUrl })

        console.log('📡 API: Calling Sui SDK getBalance...')

        // Get balance using Sui SDK
        const balanceData = await client.getBalance({
            owner: address,
        })

        console.log('✅ API: Balance data received:', balanceData)

        // Convert from MIST to OCT (1 OCT = 10^9 MIST in Sui/Move)
        const octBalance = Number(balanceData.totalBalance) / 1_000_000_000

        console.log('💰 API: Converted balance:', octBalance, 'OCT')

        return NextResponse.json({
            success: true,
            balance: octBalance.toFixed(2),
            raw: balanceData.totalBalance
        })
    } catch (error: any) {
        console.error('❌ API: Balance fetch error:', error)
        console.error('API Error name:', error?.name)
        console.error('API Error message:', error?.message)

        return NextResponse.json({
            error: error.message || 'Failed to fetch balance',
            details: error.toString(),
            success: false
        }, { status: 500 })
    }
}
