import { NextRequest, NextResponse } from 'next/server'
import { SuiClient } from '@mysten/sui.js/client'

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json()

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }

        // Read package ID from environment
        const packageId = process.env.NEXT_PUBLIC_SPACESHIP_MODULE?.split('::')[0] ||
            '0x514d92711951d421d7a94af7c350597d3d1368ca34eaa1203080634e8f065568'

        console.log('📦 Using package ID:', packageId)

        // Use correct OneChain RPC URL with port
        const rpcUrl = 'https://rpc-testnet.onelabs.cc:443'
        console.log('🔗 Using RPC URL:', rpcUrl)

        // Create Sui client for OneChain
        const client = new SuiClient({ url: rpcUrl })

        const spaceshipType = `${packageId}::spaceship::Spaceship`
        console.log('🚀 Looking for spaceship type:', spaceshipType)

        // Get owned spaceships
        const objects = await client.getOwnedObjects({
            owner: address,
            filter: {
                StructType: spaceshipType
            },
            options: {
                showContent: true,
            }
        })

        console.log('📡 Found', objects.data.length, 'objects')

        const ships = objects.data.map(obj => {
            if (obj.data?.content?.dataType === 'moveObject') {
                const fields = obj.data.content.fields as any
                return {
                    id: obj.data.objectId,
                    shipId: fields.ship_id,
                    shipType: fields.ship_type,
                    level: fields.level,
                    wins: fields.wins,
                    score: fields.score
                }
            }
            return null
        }).filter(ship => ship !== null)

        console.log('✅ Returning', ships.length, 'spaceships')

        return NextResponse.json({
            success: true,
            ships
        })
    } catch (error: any) {
        console.error('❌ Spaceships fetch error:', error)
        console.error('Error details:', error?.message)

        return NextResponse.json({
            error: error.message || 'Failed to fetch spaceships',
            success: false
        }, { status: 500 })
    }
}
