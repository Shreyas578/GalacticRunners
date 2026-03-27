"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function StarWarsIntro({ onComplete }: { onComplete: () => void }) {
  const [started, setStarted] = useState(false)
  const crawlRef = useRef<HTMLDivElement>(null)

  // Auto-complete after crawl finishes
  useEffect(() => {
    if (!started) return
    const t = setTimeout(onComplete, 42000)
    return () => clearTimeout(t)
  }, [started, onComplete])

  // ESC to skip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onComplete() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onComplete])

  if (!started) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 gap-10">
        <div className="text-center space-y-4 animate-in fade-in duration-1000">
          <p className="text-cyan-400 font-mono tracking-[0.4em] uppercase text-sm">
            A Long Time Ago in a Galaxy Far, Far Away...
          </p>
          <h1
            className="text-6xl font-black tracking-tighter"
            style={{ fontFamily: "Orbitron, sans-serif", color: "#facc15", textShadow: "0 0 30px rgba(250,204,21,0.6)" }}
          >
            GALACTIC RUNNERS
          </h1>
        </div>
        <Button
          onClick={() => setStarted(true)}
          size="lg"
          className="bg-yellow-400 text-black hover:bg-yellow-300 font-black px-14 py-7 text-xl rounded-none border-4 border-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all hover:scale-105"
        >
          ▶ INITIATE HYPERSPACE
        </Button>
        <p className="text-white/20 font-mono text-xs">Press ESC to skip</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden" style={{ perspective: "350px" }}>
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-[60]">
        <Button variant="ghost" className="text-yellow-400/60 hover:text-yellow-400 font-mono text-xs" onClick={onComplete}>
          SKIP [ESC]
        </Button>
      </div>

      {/* Crawl wrapper — perspective tilt */}
      <div
        className="absolute inset-x-0 bottom-0 top-0 flex justify-center"
        style={{ transformOrigin: "50% 100%", transform: "rotateX(20deg)" }}
      >
        {/* The crawl text — starts below viewport, scrolls up */}
        <div
          ref={crawlRef}
          className="absolute w-full max-w-2xl px-8 text-center"
          style={{
            top: "100%",
            animation: "swCrawl 40s linear forwards",
            color: "#facc15",
            fontFamily: "Orbitron, sans-serif",
          }}
        >
          <div className="space-y-10 text-2xl font-bold uppercase leading-relaxed">
            <div className="space-y-2">
              <p className="text-lg tracking-widest opacity-80">Episode IV</p>
              <h2 className="text-4xl border-b-4 border-yellow-400 pb-4">A NEW HOPE FOR OCT</h2>
            </div>

            <p>
              The galaxy is in turmoil. Imperial forces have seized control of the OneChain Testnet,
              hoarding all precious OCT minerals.
            </p>

            <p>
              Brave pilots from the Rebel Alliance have emerged, wielding advanced starfighters
              minted on the immutable ledger. Every victory brings us closer to freedom.
            </p>

            <p>
              The Empire has deployed its deadliest bosses. Only the most skilled hunters
              can defeat them and claim legendary OCT rewards hidden in the void.
            </p>

            <p>
              Prepare your wallet. Sync your maneuvers. The fate of the decentralized
              future rests in your hands...
            </p>

            <div className="pt-16 pb-32 flex justify-center">
              <Button
                onClick={onComplete}
                className="bg-yellow-400 text-black hover:bg-yellow-300 font-black px-12 py-6 text-xl rounded-none border-4 border-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.8)] hover:scale-110 transition-all"
              >
                ENTER THE GALAXY
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes swCrawl {
          0%   { top: 100%; }
          100% { top: -300%; }
        }
      `}</style>
    </div>
  )
}
