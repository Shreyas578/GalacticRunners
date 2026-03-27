// Ship metadata and abilities
import { type NextRequest, NextResponse } from "next/server"

interface ShipMetadata {
  id: string
  name: string
  description: string
  abilities: string[]
  stats: {
    speed: number
    firepower: number
    armor: number
    agility: number
  }
  rarity: "common" | "uncommon" | "rare" | "epic"
}

const shipMetadata: Record<string, ShipMetadata> = {
  PHOENIX: {
    id: "PHOENIX",
    name: "Phoenix",
    description: "High speed, medium firepower. Perfect for beginners.",
    abilities: ["Rapid Fire", "Speed Boost", "Energy Shield"],
    stats: {
      speed: 9,
      firepower: 6,
      armor: 4,
      agility: 8,
    },
    rarity: "common",
  },
  TITAN: {
    id: "TITAN",
    name: "Titan",
    description: "Slow but heavily armored. Ideal for tanking damage.",
    abilities: ["Heavy Armor", "Cannon Barrage", "Repel"],
    stats: {
      speed: 4,
      firepower: 8,
      armor: 10,
      agility: 3,
    },
    rarity: "uncommon",
  },
  VIPER: {
    id: "VIPER",
    name: "Viper",
    description: "Balanced all-rounder with versatile combat options.",
    abilities: ["Dual Shot", "Energy Drain", "Precision Shot"],
    stats: {
      speed: 7,
      firepower: 7,
      armor: 6,
      agility: 7,
    },
    rarity: "rare",
  },
  FALCON: {
    id: "FALCON",
    name: "Falcon",
    description: "Agile and precise. Master of dodge and counterattack.",
    abilities: ["Evasion", "Sniper Shot", "Temporal Shift"],
    stats: {
      speed: 10,
      firepower: 7,
      armor: 3,
      agility: 10,
    },
    rarity: "epic",
  },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shipId = searchParams.get("shipId")

  try {
    if (shipId) {
      const metadata = shipMetadata[shipId]
      if (!metadata) {
        return NextResponse.json({ error: "Ship not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: metadata })
    }

    return NextResponse.json({
      success: true,
      data: Object.values(shipMetadata),
    })
  } catch (error) {
    console.error("Metadata fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
