"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { InventoryGrid } from "@/components/inventory-grid"
import { apiClient } from "@/app/api-client"
import { onechainClient } from "@/lib/onechain"

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const account = searchParams.get("account") || ""
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!account) return
      try {
        const [balance, ships] = await Promise.all([
          onechainClient.getBalance(account),
          onechainClient.getPlayerSpaceships(account)
        ])

        setStats({
          shipsOwned: ships.length,
          octBalance: (Number(balance) * 10 ** 18).toString(), // Convert back to wei for display logic
          shardBalance: 0 // Mock for now
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [account])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-background to-background opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold neon-glow">
            ◆ GALACTIC RUNNERS ◆
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-secondary text-secondary bg-transparent">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Player Stats Overview */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-muted-foreground">Loading inventory...</div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 neon-glow">Your Collection</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-secondary/30 bg-card/50 p-4 glow-border">
                  <div className="text-sm text-muted-foreground">Ships Owned</div>
                  <div className="text-3xl font-bold text-secondary">{stats?.shipsOwned || 0}</div>
                </Card>
                <Card className="border-primary/30 bg-card/50 p-4 glow-border-primary">
                  <div className="text-sm text-muted-foreground">Boss Drops</div>
                  <div className="text-3xl font-bold text-primary">0</div>
                </Card>
                <Card className="border-accent/30 bg-card/50 p-4">
                  <div className="text-sm text-muted-foreground">OCT Balance</div>
                  <div className="text-3xl font-bold text-accent">
                    {(BigInt(stats?.octBalance || 0) / BigInt(10 ** 18)).toString()}
                  </div>
                </Card>
                <Card className="border-yellow-500/30 bg-card/50 p-4">
                  <div className="text-sm text-muted-foreground">Shards</div>
                  <div className="text-3xl font-bold text-yellow-500">{stats?.shardBalance || 0}</div>
                </Card>
              </div>
            </div>

            {/* Inventory Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Ships</h2>
              <InventoryGrid account={account} />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <Link href={`/marketplace?account=${account}`} className="flex-1">
                <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-6 text-lg">
                  Browse Marketplace
                </Button>
              </Link>
              <Link href={`/craft?account=${account}`} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/10 py-6 text-lg bg-transparent"
                >
                  Craft & Redeem
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
