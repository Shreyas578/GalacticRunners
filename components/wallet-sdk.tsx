'use client'

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export function WalletConnection() {
    const currentAccount = useCurrentAccount()

    return (
        <div className="flex items-center gap-3">
            <ConnectButton
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 shadow-lg shadow-cyan-500/50"
            />
            {currentAccount && (
                <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <div>
                            <div className="text-xs text-muted-foreground">Connected</div>
                            <div className="text-sm font-mono text-cyan-300">
                                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
