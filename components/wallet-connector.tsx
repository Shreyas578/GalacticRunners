"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Rocket, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WalletConnectorProps {
  isConnected: boolean
  account: string | null
  onConnect: (address: string) => void
  onDisconnect: () => void
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function WalletConnector({ isConnected, account, onConnect, onDisconnect }: WalletConnectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [walletType, setWalletType] = useState<string>("")
  const [availableWallets, setAvailableWallets] = useState<string[]>([])
  const [selectedWalletIndex, setSelectedWalletIndex] = useState<number>(0)

  useEffect(() => {
    const checkWallet = () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        setWalletAvailable(false)
        return
      }

      // Check if multiple wallets are injected
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        console.log("Multiple wallets detected:", window.ethereum.providers.length)
        const walletNames: string[] = []

        window.ethereum.providers.forEach((provider: any, index: number) => {
          const name = provider.isOneWallet ? "OneWallet"
            : provider.isMetaMask ? "MetaMask"
              : provider.isTrust ? "Trust Wallet"
                : `Wallet ${index + 1}`
          walletNames.push(name)
          console.log(`Provider ${index}:`, name, provider)
        })

        setAvailableWallets(walletNames)

        // Try to find OneWallet
        const oneWalletIndex = window.ethereum.providers.findIndex((p: any) => p.isOneWallet)
        if (oneWalletIndex >= 0) {
          console.log("✅ OneWallet found at index:", oneWalletIndex)
          setWalletType("OneWallet")
          setSelectedWalletIndex(oneWalletIndex)
        } else {
          console.log("⚠️ OneWallet not auto-detected - showing selector")
          setWalletType(walletNames[0])
        }
        setWalletAvailable(true)
      } else {
        // Single wallet
        console.log("Single wallet detected:", {
          isOneWallet: window.ethereum.isOneWallet,
          isMetaMask: window.ethereum.isMetaMask,
          isTrust: window.ethereum.isTrust,
        })

        if (window.ethereum.isOneWallet) {
          setWalletType("OneWallet")
        } else if (window.ethereum.isMetaMask) {
          setWalletType("MetaMask")
        } else {
          setWalletType("Ethereum Wallet")
        }
        setWalletAvailable(true)
      }
    }

    checkWallet()
    const interval = setInterval(checkWallet, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      if (!window.ethereum) {
        alert(
          "No wallet detected!\n\n" +
          "Please install OneWallet and refresh the page."
        )
        setIsLoading(false)
        return
      }

      let provider = window.ethereum

      // If multiple wallets, use the selected one
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        if (selectedWalletIndex < window.ethereum.providers.length) {
          provider = window.ethereum.providers[selectedWalletIndex]
          console.log(`Using provider at index ${selectedWalletIndex}:`, availableWallets[selectedWalletIndex])
        }
      }

      console.log("Connecting with provider:", {
        isOneWallet: provider.isOneWallet,
        isMetaMask: provider.isMetaMask,
        selectedIndex: selectedWalletIndex
      })

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      })

      console.log("✅ Accounts received:", accounts)

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        console.log("✅ Connected to address:", address)
        onConnect(address)

        // Set up event listeners
        provider.on("accountsChanged", (newAccounts: string[]) => {
          console.log("Accounts changed:", newAccounts)
          if (newAccounts && newAccounts.length > 0) {
            onConnect(newAccounts[0])
          } else {
            onDisconnect()
          }
        })

        provider.on("chainChanged", (chainId: string) => {
          console.log("Chain changed to:", chainId)
          window.location.reload()
        })

        provider.on("disconnect", () => {
          console.log("Wallet disconnected")
          onDisconnect()
        })
      } else {
        alert("No accounts found!\n\nPlease unlock your wallet and try again.")
      }
    } catch (error: any) {
      console.error("❌ Wallet connection error:", error)

      if (error.code === 4001) {
        alert("Connection rejected.\n\nPlease approve the connection in your wallet.")
      } else if (error.code === -32002) {
        alert("Connection request pending.\n\nCheck your wallet extension - you may have a pending request.")
      } else {
        alert(
          `Connection failed: ${error.message || "Unknown error"}\n\n` +
          "Troubleshooting:\n" +
          "1. Make sure your wallet is unlocked\n" +
          "2. Switch to OneChain Testnet\n" +
          "3. If you have multiple wallets, select the right one from dropdown\n" +
          "4. Check console (F12) for details"
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-mono text-cyan-300">{truncateAddress(account)}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Wallet selector if multiple wallets detected */}
      {availableWallets.length > 1 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Select Wallet:</label>
          <Select value={selectedWalletIndex.toString()} onValueChange={(val) => setSelectedWalletIndex(parseInt(val))}>
            <SelectTrigger className="w-[200px] border-cyan-500/30 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableWallets.map((wallet, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {wallet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Show warning if MetaMask detected but no dropdown (single wallet) */}
      {walletType === "MetaMask" && availableWallets.length <= 1 && (
        <div className="flex items-center gap-1 text-xs text-orange-400 max-w-[200px]">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>MetaMask detected. Make sure OneWallet is installed!</span>
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 shadow-lg shadow-cyan-500/50 transition-all duration-300 hover:shadow-cyan-500/70 hover:scale-105"
      >
        <Rocket className="w-4 h-4 mr-2" />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </Button>

      <span className="text-xs text-muted-foreground font-mono">
        {availableWallets.length > 1
          ? `Using: ${availableWallets[selectedWalletIndex]}`
          : `Detected: ${walletType}`}
      </span>
    </div>
  )
}
