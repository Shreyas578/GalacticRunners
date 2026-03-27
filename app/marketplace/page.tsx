"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, ArrowLeft, Shield, Zap, Target, TrendingUp, Loader2 } from "lucide-react"
import { useMarketplacePurchase } from "@/hooks/use-marketplace-purchase"

const MOCK_SHIPS = [
  {
    id: 1,
    name: "X-Wing Phoenix",
    type: "PHOENIX",
    description: "Agile Strike Fighter - Rebel Alliance Classic",
    stats: { speed: 350, firepower: 15, armor: 80, agility: 95 },
    price: "0.8 OCT",
    seller: "0x1234...5678",
    rarity: "Rare",
    level: 3,
    wins: 5,
    image: "🔥",
    color: "orange"
  },
  {
    id: 2,
    name: "Imperial Titan",
    type: "TITAN",
    description: "Heavy Dreadnought - Maximum Shields",
    stats: { speed: 200, firepower: 25, armor: 150, agility: 40 },
    price: "1.2 OCT",
    seller: "0xabcd...efgh",
    rarity: "Epic",
    level: 5,
    wins: 12,
    image: "🛡️",
    color: "blue"
  },
  {
    id: 3,
    name: "Shadow Viper",
    type: "VIPER",
    description: "Stealth Interceptor - Phase Assassin",
    stats: { speed: 320, firepower: 18, armor: 90, agility: 88 },
    price: "0.9 OCT",
    seller: "0x9876...4321",
    rarity: "Rare",
    level: 4,
    wins: 8,
    image: "⚡",
    color: "purple"
  },
  {
    id: 4,
    name: "Millennium Falcon MK-II",
    type: "FALCON",
    description: "Legendary Freighter - Fastest Ship Alive",
    stats: { speed: 420, firepower: 14, armor: 70, agility: 100 },
    price: "1.5 OCT",
    seller: "0xdead...beef",
    rarity: "Legendary",
    level: 8,
    wins: 35,
    image: "🚀",
    color: "emerald"
  },
  {
    id: 5,
    name: "Nova Defender",
    type: "PHOENIX",
    description: "Burst Fire Specialist",
    stats: { speed: 340, firepower: 22, armor: 85, agility: 85 },
    price: "0.7 OCT",
    seller: "0x7777...8888",
    rarity: "Common",
    level: 2,
    wins: 3,
    image: "💥",
    color: "orange"
  },
  {
    id: 6,
    name: "Glacier Bastion",
    type: "TITAN",
    description: "Slow, Unstoppable Mobile Fortress",
    stats: { speed: 150, firepower: 30, armor: 200, agility: 30 },
    price: "1.4 OCT",
    seller: "0x1111...2222",
    rarity: "Legendary",
    level: 7,
    wins: 18,
    image: "🧊",
    color: "blue"
  },
  {
    id: 7,
    name: "Venom Strike",
    type: "VIPER",
    description: "Rapid-fire DOT Specialist",
    stats: { speed: 310, firepower: 20, armor: 95, agility: 92 },
    price: "1.0 OCT",
    seller: "0x2222...3333",
    rarity: "Epic",
    level: 6,
    wins: 15,
    image: "🦂",
    color: "purple"
  },
  {
    id: 8,
    name: "Sky Runner",
    type: "FALCON",
    description: "Ultra-Light Racer",
    stats: { speed: 450, firepower: 10, armor: 50, agility: 110 },
    price: "0.6 OCT",
    seller: "0x3333...4444",
    rarity: "Common",
    level: 1,
    wins: 1,
    image: "☁️",
    color: "emerald"
  },
  {
    id: 9,
    name: "Obsidian Core",
    type: "TITAN",
    description: "Void Metal Armor",
    stats: { speed: 180, firepower: 28, armor: 180, agility: 35 },
    price: "1.3 OCT",
    seller: "0x4444...5555",
    rarity: "Epic",
    level: 6,
    wins: 20,
    image: "🌑",
    color: "blue"
  },
  {
    id: 10,
    name: "Solar Flare",
    type: "PHOENIX",
    description: "High Energy Pulse Cannon",
    stats: { speed: 360, firepower: 19, armor: 75, agility: 98 },
    price: "1.1 OCT",
    seller: "0x5555...6666",
    rarity: "Epic",
    level: 5,
    wins: 10,
    image: "☀️",
    color: "orange"
  }
]

const rarityColors = {
  "Common": "text-gray-400 border-gray-400/30",
  "Rare": "text-blue-400 border-blue-400/30",
  "Epic": "text-purple-400 border-purple-400/30",
  "Legendary": "text-orange-400 border-orange-400/30"
}

const shipTypeColors = {
  "PHOENIX": { gradient: "from-orange-600/30 to-orange-400/10", border: "border-orange-500/40", text: "text-orange-400" },
  "TITAN": { gradient: "from-blue-600/30 to-blue-400/10", border: "border-blue-500/40", text: "text-blue-400" },
  "VIPER": { gradient: "from-purple-600/30 to-purple-400/10", border: "border-purple-500/40", text: "text-purple-400" },
  "FALCON": { gradient: "from-emerald-600/30 to-emerald-400/10", border: "border-emerald-500/40", text: "text-emerald-400" },
}

export default function MarketplacePage() {
  const [filter, setFilter] = useState<"all" | "PHOENIX" | "TITAN" | "VIPER" | "FALCON">("all")
  const [purchasingShipId, setPurchasingShipId] = useState<number | null>(null)
  const currentAccount = useCurrentAccount()
  const { purchaseShip } = useMarketplacePurchase()

  useEffect(() => {
    console.log("✅ Marketplace loaded, wallet:", currentAccount?.address || 'not connected')
  }, [currentAccount])

  const filteredShips = filter === "all"
    ? MOCK_SHIPS
    : MOCK_SHIPS.filter(ship => ship.type === filter)

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated Starfield Background */}
      <div className="fixed inset-0 -z-10 starfield opacity-30" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-950/40 via-background to-background" />
      <div className="fixed inset-0 -z-10 scanner-effect opacity-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Hangar Bay</p>
              <h1 className="text-2xl font-bold neon-glow">MARKETPLACE</h1>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Command
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-8">
        {/* Stats Overview */}
        <Card className="border-blue-500/30 bg-card/60 backdrop-blur scanner-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Trading Floor Status
            </CardTitle>
            <CardDescription className="font-mono text-xs text-cyan-400/70">
              Real-time marketplace statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Volume</div>
                <div className="text-2xl font-bold text-cyan-400">18.5 OCT</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Listings</div>
                <div className="text-2xl font-bold">{MOCK_SHIPS.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Ships Sold (24h)</div>
                <div className="text-2xl font-bold text-emerald-400">8</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Platform Fee</div>
                <div className="text-2xl font-bold text-orange-400">5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            className={filter === "all"
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              : "border-border/50 text-muted-foreground hover:border-cyan-500/50"}
          >
            All Starfighters ({MOCK_SHIPS.length})
          </Button>
          {(["PHOENIX", "TITAN", "VIPER", "FALCON"] as const).map((type) => {
            const count = MOCK_SHIPS.filter(s => s.type === type).length
            const colors = shipTypeColors[type]
            return (
              <Button
                key={type}
                onClick={() => setFilter(type)}
                variant="outline"
                className={`${filter === type ? colors.border + " " + colors.text : "border-border/50 text-muted-foreground hover:" + colors.border}`}
              >
                {type} ({count})
              </Button>
            )
          })}
        </div>

        {/* Ships Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredShips.map((ship) => {
            const colors = shipTypeColors[ship.type as keyof typeof shipTypeColors]
            const rarityColor = rarityColors[ship.rarity as keyof typeof rarityColors]

            return (
              <Card
                key={ship.id}
                className={`group ${colors.border} bg-card/70 backdrop-blur hover:bg-card/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden relative`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="text-6xl">{ship.image}</div>
                    <div className="space-y-2">
                      <Badge className={rarityColor}>
                        {ship.rarity}
                      </Badge>
                      <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
                        {ship.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{ship.name}</CardTitle>
                    <CardDescription className="text-xs">{ship.description}</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 relative z-10">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-cyan-400" />
                      <span className="text-muted-foreground">Speed:</span>
                      <span className="font-bold">{ship.stats.speed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-orange-400" />
                      <span className="text-muted-foreground">Power:</span>
                      <span className="font-bold">{ship.stats.firepower}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="text-muted-foreground">Armor:</span>
                      <span className="font-bold">{ship.stats.armor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Rocket className="h-3 w-3 text-purple-400" />
                      <span className="text-muted-foreground">Agility:</span>
                      <span className="font-bold">{ship.stats.agility}</span>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-center justify-between text-xs border-t border-border/30 pt-3">
                    <div>
                      <span className="text-muted-foreground">Level:</span>
                      <span className="ml-2 font-bold text-cyan-400">{ship.level}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Victories:</span>
                      <span className="ml-2 font-bold text-emerald-400">{ship.wins}</span>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                    <span>Pilot: </span>
                    <span className="font-mono text-cyan-400/70">{ship.seller}</span>
                  </div>

                  {/* Price & Actions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Price</div>
                        <div className="text-2xl font-bold text-cyan-400">{ship.price}</div>
                      </div>
                      <Button
                        onClick={async () => {
                          const price = parseFloat(ship.price.split(' ')[0])
                          const platformFee = price * 0.05
                          const estimatedGas = 0.001
                          const totalCost = price + platformFee + estimatedGas

                          // Check if wallet is connected via SDK
                          if (!currentAccount) {
                            alert('⚠️ Wallet Not Connected\n\nPlease connect your OneWallet using the Connect button in the header.')
                            return
                          }

                          setPurchasingShipId(ship.id)

                          try {
                            console.log(`🚀 Purchasing ${ship.name} for ${totalCost.toFixed(3)} OCT`)
                            console.log(`📍 Connected wallet: ${currentAccount.address}`)

                            // Execute real blockchain transaction
                            const result = await purchaseShip(
                              ship.id.toString(), // Listing ID (mocked as ship ID for now)
                              totalCost
                            )

                            if (result.success) {
                              alert(
                                `🎉 PURCHASE SUCCESSFUL!\n\n` +
                                `Ship: ${ship.name}\n` +
                                `Total Cost: ${totalCost.toFixed(3)} OCT\n` +
                                `Transaction Digest: ${result.digest}\n\n` +
                                `✅ The NFT has been transferred to your wallet!\n` +
                                `Check your inventory to see your new ship.`
                              )
                            } else {
                              throw new Error(result.error || 'Transaction failed')
                            }
                          } catch (error: any) {
                            console.error('❌ Purchase failed:', error)
                            alert(
                              `❌ PURCHASE FAILED\n\n` +
                              `Error: ${error.message || 'Unknown error'}\n\n` +
                              `Please check:\n` +
                              `• Wallet is connected\n` +
                              `• OCT balance (need ${totalCost.toFixed(3)} OCT)\n` +
                              `• Network is OneChain Testnet`
                            )
                          } finally {
                            setPurchasingShipId(null)
                          }
                        }}
                        disabled={purchasingShipId === ship.id || !currentAccount}
                        className={`bg-gradient-to-r ${colors.gradient.replace('/30', '/60').replace('/10', '/40')} hover:opacity-90 ${colors.text} border ${colors.border} w-full`}
                      >
                        {purchasingShipId === ship.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Rocket className="mr-2 h-4 w-4" />
                            {currentAccount ? 'Purchase' : 'Connect Wallet'}
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 rounded bg-black/20 p-2">
                      <div className="flex justify-between">
                        <span>Platform Fee (5%):</span>
                        <span className="text-orange-400 font-mono">{(parseFloat(ship.price.split(' ')[0]) * 0.05).toFixed(3)} OCT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Gas:</span>
                        <span className="text-cyan-400 font-mono">~0.001 OCT</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredShips.length === 0 && (
          <Card className="border-border/50 bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">No starfighters found matching this filter.</p>
          </Card>
        )}
      </main>
    </div>
  )
}
