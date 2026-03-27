import type { Metadata } from "next"
import "./globals.css"
import { ReactNode } from "react"
import { OneChainProvider } from "@/components/onechain-provider"

export const metadata: Metadata = {
  title: "Starfighter Command | OneChain Space Combat",
  description:
    "Pilot legendary starfighters, defeat Imperial threats, and earn NFT rewards in this Star Wars-inspired blockchain game on OneChain.",
  keywords: [
    "OneChain",
    "Move",
    "Web3 game",
    "Space shooter",
    "Phaser",
    "GameFi",
    "NFT",
    "Starfighter",
    "Blockchain game",
  ],
  authors: [{ name: "Starfighter Command" }],
  metadataBase: new URL("https://starfighter-command.example.com"),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <OneChainProvider>
          {children}
        </OneChainProvider>
      </body>
    </html>
  )
}