"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { onechainClient } from "@/lib/onechain"

interface MarketplaceGridProps {
  filter: "all" | "ships" | "drops"
  account: string
}

interface Listing {
  id: string
  type: "ship" | "drop"
  name: string
  rarity: string
  price: string
  seller: string
}

const rarityColors: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
}

export function MarketplaceGrid({ filter, account }: MarketplaceGridProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await onechainClient.getMarketplaceListings().catch(() => [])
        setListings(
          data.map((item: any) => ({
            id: item.id,
            type: item.type ?? "ship",
            name: item.name ?? "OneChain Ship",
            rarity: item.rarity ?? "common",
            price: item.price ?? "0",
            seller: item.seller ?? "0x0000...0000",
          })),
        )
      } catch (error) {
        console.error("Failed to load marketplace listings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  const filtered = listings.filter((item) => filter === "all" || item.type === filter.replace("s", "") )

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">Loading marketplace...</p>
      </Card>
    )
  }

  if (filtered.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">No listings found</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {filtered.map((item) => (
        <Card
          key={item.id}
          className="border-secondary/30 bg-card/50 p-4 glow-border overflow-hidden hover:border-secondary/80 transition-colors"
        >
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded mb-4 flex items-center justify-center">
            <div className="text-5xl">{item.type === "ship" ? "▲" : "◆"}</div>
          </div>
          <h3 className="font-bold text-sm mb-2 truncate">{item.name}</h3>
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rarity</span>
              <span className={rarityColors[item.rarity]}>{item.rarity.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Seller</span>
              <span className="font-mono">{item.seller}</span>
            </div>
          </div>
          <div className="border-t border-border pt-3 mb-3">
            <div className="flex justify-between items-end mb-3">
              <span className="text-muted-foreground text-xs">Price</span>
              <span className="text-lg font-bold text-secondary">{item.price} OCT</span>
            </div>
            <Button
              size="sm"
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              disabled={!account}
            >
              {account ? "Buy Now" : "Connect Wallet"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
