'use client'

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { suiClientOptions } from '@/lib/onechain-config'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient()

export function OneChainProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={{ testnet: suiClientOptions }} defaultNetwork="testnet">
                <WalletProvider autoConnect>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    )
}
