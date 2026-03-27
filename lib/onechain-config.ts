/**
 * OneChain Network Configuration for dApp-Kit
 */

import { getFullnodeUrl } from '@mysten/sui.js/client'
import type { SuiClientOptions } from '@mysten/sui.js/client'

export const ONECHAIN_TESTNET_CONFIG = {
    id: 'onechain-testnet',
    name: 'OneChain Testnet',
    network: 'testnet',
    rpcUrl: process.env.NEXT_PUBLIC_ONECHAIN_NODE_URL || 'https://testnet-rpc.onechain.xyz',
} as const

export const suiClientOptions: SuiClientOptions = {
    url: ONECHAIN_TESTNET_CONFIG.rpcUrl,
}

// Package and module addresses
export const PACKAGE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_MODULE?.split('::')[0] ||
    '0x9cdb5f2eb8f06cef120207cd73ed99ae1e4cc2c2a214320b920627204cbe90ee'

export const MODULES = {
    marketplace: `${PACKAGE_ID}::marketplace`,
    spaceship: `${PACKAGE_ID}::spaceship`,
    bossdrop: `${PACKAGE_ID}::bossdrop`,
    player: `${PACKAGE_ID}::player`,
} as const
