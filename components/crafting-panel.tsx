"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CraftingPanelProps {
  account: string
}

const craftingRecipes = [
  {
    id: 1,
    name: "Legendary Falcon",
    description: "Craft a legendary Falcon by combining 3 rare ships + 5 boss drops",
    requires: {
      ships: 3,
      drops: 5,
    },
    reward: "Legendary Falcon NFT",
    cost: "100 SHARD",
  },
  {
    id: 2,
    name: "Champion Bundle",
    description: "Combine boss drops to unlock special cosmetics and rewards",
    requires: {
      ships: 0,
      drops: 10,
    },
    reward: "Exclusive Cosmetics + 500 OCT",
    cost: "50 SHARD",
  },
]

export function CraftingPanel({ account }: CraftingPanelProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {craftingRecipes.map((recipe) => (
        <Card
          key={recipe.id}
          className={`border-2 p-6 cursor-pointer transition-all ${
            selectedRecipe === recipe.id
              ? "border-secondary bg-secondary/10 glow-border"
              : "border-muted bg-card/50 hover:border-muted-foreground"
          }`}
          onClick={() => setSelectedRecipe(selectedRecipe === recipe.id ? null : recipe.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold mb-1">{recipe.name}</h3>
              <p className="text-sm text-muted-foreground">{recipe.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Cost</div>
              <div className="font-bold text-secondary">{recipe.cost}</div>
            </div>
          </div>

          {selectedRecipe === recipe.id && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Requires</div>
                  <ul className="space-y-1 text-sm">
                    {recipe.requires.ships > 0 && (
                      <li className="text-primary">✓ {recipe.requires.ships} Rare Ships</li>
                    )}
                    {recipe.requires.drops > 0 && <li className="text-accent">✓ {recipe.requires.drops} Boss Drops</li>}
                  </ul>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Reward</div>
                  <div className="text-secondary font-bold">{recipe.reward}</div>
                </div>
              </div>

              <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                Start Crafting
              </Button>
            </div>
          )}
        </Card>
      ))}

      {/* Redemption Info */}
      <Card className="border-primary/30 bg-card/50 p-6 glow-border-primary">
        <h3 className="text-lg font-bold mb-3 text-primary">Redemption Program</h3>
        <p className="text-muted-foreground mb-4">
          Redeem your achievements and rare items for exclusive NFTs, cosmetics, and real-world rewards.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="text-primary">✓ Top 100 players: Monthly OCT rewards</li>
          <li className="text-primary">✓ Boss drops: Unlock special cosmetics</li>
          <li className="text-primary">✓ Legendary ships: Exclusive governance tokens</li>
        </ul>
      </Card>
    </div>
  )
}
