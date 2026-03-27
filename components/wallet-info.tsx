"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface WalletInfoProps {
  account: string
}

export function WalletInfo({ account }: WalletInfoProps) {
  const [balance, setBalance] = useState<string>("0.00")
  const [shipsOwned, setShipsOwned] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true)
        console.log("Fetching balance for:", account)

        // Use OneChain client to fetch balance
        const { onechainClient } = await import("@/lib/onechain")
        const balance = await onechainClient.getBalance(account)

        setBalance(balance)
        console.log("✅ Balance fetched:", balance, "OCT")

        // TODO: Fetch owned ships from blockchain
        setShipsOwned(0)
      } catch (error) {
        console.error("Error fetching balance:", error)
        setBalance("0.00")
      } finally {
        setLoading(false)
      }
    }

    if (account) {
      fetchBalance()
      // Refresh balance every 10 seconds
      const interval = setInterval(fetchBalance, 10000)
      return () => clearInterval(interval)
    }
  }, [account])

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`
  }

  return (
    <div className="space-y-4">
      <Card className="border-cyan-500/30 bg-card/50 p-4 backdrop-blur">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pilot Address</div>
        <div className="text-sm font-mono break-all text-cyan-400">{truncateAddress(account)}</div>
      </Card>

      <Card className="border-blue-500/30 bg-card/50 p-4 backdrop-blur space-y-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OCT Balance</div>
          <div className="text-2xl font-bold text-cyan-400">{loading ? "..." : `${balance} OCT`}</div>
        </div>
        <div className="h-px bg-border" />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ships Owned</div>
          <div className="text-2xl font-bold text-purple-400">{loading ? "..." : shipsOwned}</div>
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
