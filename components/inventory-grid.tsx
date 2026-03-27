"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { onechainClient } from "@/lib/onechain"

interface InventoryGridProps {
  account: string
}

interface ShipObject {
  id: string
  shipId: string
  shipType: number
  level: string
  wins: string
  score: string
}

const SHIP_NAMES = ["Phoenix", "Titan", "Viper", "Falcon"]
const SHIP_RARITIES = ["Common", "Rare", "Epic", "Legendary"]

export function InventoryGrid({ account }: InventoryGridProps) {
  const [ships, setShips] = useState<ShipObject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShips = async () => {
      if (!account) return
      try {
        const shipObjects = await onechainClient.getPlayerSpaceships(account)
        setShips(shipObjects)
      } catch (error) {
        console.error("Failed to load ships:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchShips()
  }, [account])

  if (!account) {
    return (
      <Card className="border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">Connect wallet to view inventory</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">Loading inventory...</p>
      </Card>
    )
  }

  if (ships.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">No ships yet. Defeat bosses or craft ships to populate your hangar.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ships.map((ship) => (
        <Card key={ship.id} className="border-secondary/30 bg-card/50 p-4 glow-border overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded mb-4 flex items-center justify-center">
            <div className="text-6xl">▲</div>
          </div>
          <h3 className="font-bold text-lg mb-2">{SHIP_NAMES[ship.shipType] || "Unknown Ship"}</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rarity</span>
              <span className="text-secondary">{(SHIP_RARITIES[ship.shipType] || "Common").toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="text-primary">{ship.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wins</span>
              <span className="text-accent">{ship.wins}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              List for Sale
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/10 bg-transparent"
            >
              Equip
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
