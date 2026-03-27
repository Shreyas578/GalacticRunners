"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import PhaserGame to avoid SSR issues with Phaser
const PhaserGameComponent = dynamic(() => import("./phaser-game").then((mod) => mod.PhaserGame), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-background flex items-center justify-center">Loading game...</div>,
})

interface PhaserGameProps {
  selectedShip: string
  account: string
  onGameEnd?: (score: number, wave: number) => void
}

export function PhaserGame({ selectedShip, account, onGameEnd }: PhaserGameProps) {
  return <PhaserGameComponent selectedShip={selectedShip} account={account} onGameEnd={onGameEnd} />
}

