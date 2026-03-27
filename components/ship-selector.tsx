"use client"

import { Card } from "@/components/ui/card"

const DEFAULT_SHIPS = [
  { id: "phoenix", name: "Phoenix", description: "High speed, medium firepower" },
  { id: "titan", name: "Titan", description: "Slow but heavily armored" },
  { id: "viper", name: "Viper", description: "Balanced all-rounder" },
  { id: "falcon", name: "Falcon", description: "Agile and precise" },
]

interface Ship {
  id: string
  name: string
  description: string
  type?: number
}

interface ShipSelectorProps {
  selectedShip: string | null
  onSelectShip: (shipId: string) => void
  ownedShips?: any[]
}

export function ShipSelector({ selectedShip, onSelectShip, ownedShips = [] }: ShipSelectorProps) {
  const displayShips = ownedShips.length > 0
    ? ownedShips.map(ship => ({
      id: ship.shipType.toString(), // Using shipType as ID for game logic mapping
      name: DEFAULT_SHIPS[ship.shipType]?.name || "Unknown Ship",
      description: `Level ${ship.level} | Wins: ${ship.wins}`,
      type: ship.shipType
    }))
    : DEFAULT_SHIPS

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {displayShips.map((ship, index) => (
        <Card
          key={`${ship.id}-${index}`}
          onClick={() => onSelectShip(ship.id)}
          className={`p-4 cursor-pointer transition-all border-2 ${selectedShip === ship.id
              ? "border-secondary bg-secondary/10 glow-border"
              : "border-muted bg-card/50 hover:border-muted-foreground"
            }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">▲</div>
            <h3 className="font-bold text-sm mb-1">{ship.name}</h3>
            <p className="text-xs text-muted-foreground">{ship.description}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
