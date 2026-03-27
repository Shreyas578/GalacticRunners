'use client'

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

export function WalletInfo() {
    const currentAccount = useCurrentAccount()
    const suiClient = useSuiClient()
    const [balance, setBalance] = useState<string>('0.00')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalance = async () => {
            if (!currentAccount) {
                setBalance('0.00')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                console.log('🔍 Fetching balance for:', currentAccount.address)

                // Call API route (server-side) to avoid CORS
                const response = await fetch('/api/onechain/balance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        address: currentAccount.address
                    }),
                })

                const data = await response.json()
                console.log('📦 API Response:', data)

                if (data.success && data.balance) {
                    console.log('✅ Balance fetched:', data.balance, 'OCT')
                    setBalance(data.balance)
                } else {
                    console.error('❌ API Error:', data.error)
                    setBalance('0.00')
                }
            } catch (error: any) {
                console.error('❌ Error fetching balance:', error)
                setBalance('0.00')
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()
        // Refresh balance every 10 seconds
        const interval = setInterval(fetchBalance, 10000)
        return () => clearInterval(interval)
    }, [currentAccount])

    if (!currentAccount) {
        return (
            <Card className="border-cyan-500/30 bg-card/50 p-4 backdrop-blur">
                <div className="text-sm text-muted-foreground">Connect wallet to view balance</div>
            </Card>
        )
    }

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 10)}...${addr.slice(-8)}`
    }

    return (
        <div className="space-y-4">
            <Card className="border-cyan-500/30 bg-card/50 p-4 backdrop-blur">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pilot Address</div>
                <div className="text-sm font-mono break-all text-cyan-400">{truncateAddress(currentAccount.address)}</div>
            </Card>

            <Card className="border-blue-500/30 bg-card/50 p-4 backdrop-blur space-y-3">
                <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OCT Balance</div>
                    <div className="text-2xl font-bold text-cyan-400">{loading ? '...' : `${balance} OCT`}</div>
                </div>
                <div className="h-px bg-border" />
                <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ships Owned</div>
                    <div className="text-2xl font-bold text-purple-400">{loading ? '...' : 0}</div>
                </div>
            </Card>

            <Card className="border-emerald-500/30 bg-card/50 p-4 backdrop-blur">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Connection Status</div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="text-sm text-emerald-400 font-semibold">Online & Ready</div>
                </div>
            </Card>
        </div>
    )
}
