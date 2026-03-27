"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Lock, CheckCircle2, ShoppingCart, Zap, Shield, Target, Swords, Skull, Info, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

const STARFIGHTERS = [
  { id: "viper", name: "Viper Interceptor", type: "VIPER", price: 0, image: "⚡", color: "purple", description: "Standard issue stealth fighter. Reliable and fast." },
  { id: "phoenix", name: "X-Wing Phoenix", type: "PHOENIX", price: 0.8, image: "🔥", color: "orange", description: "Agile rebels favorite. High maneuverability." },
  { id: "titan", name: "Imperial Titan", type: "TITAN", price: 1.2, image: "🛡️", color: "blue", description: "Heavy armored dreadnought. Massive hull plating." },
  { id: "falcon", name: "Sky Runner", type: "FALCON", price: 1.5, image: "🚀", color: "emerald", description: "Fastest ship in the fleet. Hyperspace ready." },
  { id: "nova", name: "Supernova Strike", type: "NOVA", price: 2.5, image: "✨", color: "yellow", description: "Experimental energy weapon platform." },
  { id: "glacier", name: "Glacier Fortress", type: "GLACIER", price: 3.5, image: "❄️", color: "cyan", description: "Ultimate defense. Can withstand direct boss hits." },
  { id: "venom", name: "Venom Stinger", type: "VENOM", price: 4.2, image: "🦂", color: "lime", description: "Aggressive hunter with rapid-fire capability." },
  { id: "obsidian", name: "Obsidian Wraith", type: "OBSIDIAN", price: 5.5, image: "🖤", color: "slate", description: "Ghost tech hull. Difficult for enemies to target." },
  { id: "solar", name: "Solar Flare", type: "SOLAR", price: 6.8, image: "☀️", color: "amber", description: "Charged by sun energy. Devastating firepower." },
  { id: "nebula", name: "Nebula Ghost", type: "NEBULA", price: 8.5, image: "🌫️", color: "indigo", description: "Vanishes in space dust. Mastery of stealth." },
  { id: "reaper", name: "Void Reaper", type: "REAPER", price: 12.0, image: "👻", color: "red", description: "End-game hunter. Feared by the Empire." },
  { id: "omega", name: "Omega Primus", type: "OMEGA", price: 25.0, image: "🔱", color: "rose", description: "The ultimate starfighter. Artifact level power." },
]

const BOSS_DATABASE = [
  { name: "Void Leviathan", power: "Circular Pulse Blast", weakness: "Agile Maneuvering", bounty: "High" },
  { name: "Nebula Tyrant", power: "Homing Missile Swarm", weakness: "Direct Speed", bounty: "Epic" },
  { name: "Cosmic Serpent", power: "Rapid Ion Stream", weakness: "Burst Fire", bounty: "Rare" },
  { name: "Star Destroyer", power: "Heavy Gravity Well", weakness: "Side Strafe", bounty: "Legendary" },
  { name: "Harbinger of Doom", power: "Spiral Chaos", weakness: "Steady Nerves", bounty: "Mythic" },
  { name: "Galaxy Eater", power: "Black Hole Singularity", weakness: "Escape Velocity", bounty: "Exotic" },
]

export function SpaceshipsPortal({ 
    ownedShips, 
    onSelect, 
    onPurchase 
}: { 
    ownedShips: string[], 
    onSelect: (id: string) => void,
    onPurchase: (id: string, price: number) => void
}) {
  const [hoveredShip, setHoveredShip] = useState<string | null>(null)

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black neon-glow star-wars-font">SPACESHIP HANGAR</h2>
        <p className="text-muted-foreground font-mono tracking-widest text-sm">SELECT YOUR VESSEL FOR THE UPCOMING MISSION // REBEL FLEET REGISTRY</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {STARFIGHTERS.map((ship) => {
          const isOwned = ship.price === 0 || ownedShips.includes(ship.id)
          
          return (
            <Card 
                key={ship.id}
                onMouseEnter={() => setHoveredShip(ship.id)}
                onMouseLeave={() => setHoveredShip(null)}
                className={`group relative overflow-hidden border transition-all duration-500 bg-black/40 backdrop-blur-sm ${isOwned ? 'border-cyan-500/20 hover:border-cyan-400' : 'border-gray-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'} ${hoveredShip === ship.id && isOwned ? 'scale-[1.02] shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b from-${ship.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-500">{ship.image}</div>
                    {isOwned ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono tracking-tighter">FLEET READY</Badge>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 font-bold">{ship.price} OCT</Badge>
                            <Lock className="w-3 h-3 text-gray-500" />
                        </div>
                    )}
                  </div>
                  <CardTitle className="text-xl star-wars-font tracking-tight">{ship.name}</CardTitle>
                  <CardDescription className="font-mono text-[10px] leading-relaxed uppercase opacity-60 leading-tight">
                    {ship.description}
                  </CardDescription>
              </CardHeader>

              <CardFooter className="relative z-10 pt-4 border-t border-white/5 bg-white/5">
                  {isOwned ? (
                      <Button 
                        onClick={() => onSelect(ship.id)}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black star-wars-font text-xs tracking-wider"
                      >
                        CHOOSE WING
                      </Button>
                  ) : (
                      <Button 
                        onClick={() => onPurchase(ship.id, ship.price)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold flex gap-2 border border-white/10"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        RECRUIT
                      </Button>
                  )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="pt-20 border-t border-white/10 mt-20">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-lg bg-red-500/20 text-red-400">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-black star-wars-font text-red-500 tracking-tighter">IMPERIAL THREAT DATABASE</h3>
                <p className="text-xs text-muted-foreground font-mono">INTELLIGENCE BRIEFING: CLASSIFIED RANK S</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOSS_DATABASE.map((boss) => (
                <Card key={boss.name} className="bg-red-950/10 border-red-900/30 overflow-hidden group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center mb-1">
                            <CardTitle className="text-red-400 text-lg star-wars-font tracking-tighter uppercase">{boss.name}</CardTitle>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px]">{boss.bounty} BOUNTY</Badge>
                        </div>
                        <CardDescription className="text-red-400/60 font-mono text-[10px] flex items-center gap-1">
                            <Zap className="w-3 h-3" /> ULTIMATE: {boss.power}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] font-mono text-muted-foreground border-t border-red-900/20 pt-2 group-hover:text-red-300/60 transition-colors">
                            <span className="text-red-500/80 mr-1">INTEL:</span> {boss.weakness}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
