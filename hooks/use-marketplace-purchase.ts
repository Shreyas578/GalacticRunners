'use client'

import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

const TREASURY_ADDRESS = "0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2"

/**
 * Hook to handle ship purchases — transfers OCT directly to treasury
 */
export function useMarketplacePurchase() {
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
    const currentAccount = useCurrentAccount()

    const purchaseShip = async (
        shipId: string,
        priceOCT: number
    ): Promise<{ success: boolean; digest?: string; error?: string }> => {
        if (!currentAccount) {
            return { success: false, error: 'Wallet not connected' }
        }

        return new Promise((resolve) => {
            try {
                const tx = new Transaction()
                const priceMist = Math.floor(priceOCT * 1_000_000_000)

                // Split exact amount and transfer to treasury
                const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)])
                tx.transferObjects([paymentCoin], tx.pure.address(TREASURY_ADDRESS))

                tx.setGasBudget(10_000_000)

                signAndExecuteTransaction(
                    { transaction: tx },
                    {
                        onSuccess: (result) => {
                            resolve({ success: true, digest: result.digest })
                        },
                        onError: (error: any) => {
                            const msg = error?.message || error?.toString() || 'Transaction failed'
                            resolve({ success: false, error: msg })
                        },
                    }
                )
            } catch (error: any) {
                resolve({ success: false, error: error.message || 'Failed to prepare transaction' })
            }
        })
    }

    return {
        purchaseShip,
        isConnected: !!currentAccount,
    }
}
