import { NextRequest, NextResponse } from 'next/server'
import { SuiClient } from '@mysten/sui.js/client'

export async function POST(request: NextRequest) {
    try {
        const { objectId } = await request.json()

        if (!objectId) {
            return NextResponse.json({ error: 'Object ID is required' }, { status: 400 })
        }

        console.log('🔍 Fetching object details for:', objectId)

        // Use correct OneChain RPC URL with port
        const rpcUrl = 'https://rpc-testnet.onelabs.cc:443'

        // Create Sui client for OneChain
        const client = new SuiClient({ url: rpcUrl })

        // Get object details
        const object = await client.getObject({
            id: objectId,
            options: {
                showType: true,
                showOwner: true,
                showPreviousTransaction: true,
                showContent: true,
            }
        })

        console.log('✅ Object details:', object)

        if (!object.data) {
            return NextResponse.json({
                error: 'Object not found',
                success: false
            }, { status: 404 })
        }

        // Extract initial shared version if it's a shared object
        let initialSharedVersion = null
        if (object.data.owner && typeof object.data.owner === 'object') {
            console.log('📋 Owner structure:', JSON.stringify(object.data.owner, null, 2))

            if ('Shared' in object.data.owner) {
                const sharedData = object.data.owner.Shared
                console.log('🔍 Shared data:', sharedData)

                // Could be object or array
                if (typeof sharedData === 'object') {
                    if (Array.isArray(sharedData) && sharedData.length > 0) {
                        // Array format: Shared: [version_number]
                        initialSharedVersion = parseInt(sharedData[0])
                    } else if (sharedData.initial_shared_version) {
                        // Object format: Shared: { initial_shared_version: number }
                        initialSharedVersion = parseInt(sharedData.initial_shared_version)
                    } else if (sharedData.initialSharedVersion) {
                        // Camel case variant
                        initialSharedVersion = parseInt(sharedData.initialSharedVersion)
                    }
                }

                console.log('✅ Extracted initialSharedVersion:', initialSharedVersion)
            }
        }

        return NextResponse.json({
            success: true,
            objectId: object.data.objectId,
            version: object.data.version,
            digest: object.data.digest,
            type: object.data.type,
            owner: object.data.owner,
            initialSharedVersion,
        })
    } catch (error: any) {
        console.error('❌ Object fetch error:', error)

        return NextResponse.json({
            error: error.message || 'Failed to fetch object',
            success: false
        }, { status: 500 })
    }
}
