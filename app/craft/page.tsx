"use client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CraftingPanel } from "@/components/crafting-panel"

export default function CraftPage() {
  const searchParams = useSearchParams()
  const account = searchParams.get("account") || ""

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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 neon-glow">Crafting & Redemption</h1>
          <p className="text-muted-foreground mb-8">
            Combine your ships and boss drops to craft legendary vessels and unlock special rewards.
          </p>

          <CraftingPanel account={account} />
        </div>
      </main>
    </div>
  )
}
