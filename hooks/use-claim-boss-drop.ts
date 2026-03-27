'use client'

import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { PACKAGE_ID, MODULES } from '@/lib/onechain-config'

export function useClaimBossDrop() {
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
    const currentAccount = useCurrentAccount()

    const claimDrop = async (
        bossType: number,
        rarity: number
    ): Promise<{ success: boolean; digest?: string; error?: string }> => {
        if (!currentAccount) {
            return { success: false, error: 'Wallet not connected' }
        }

        const counterId = process.env.NEXT_PUBLIC_BOSS_DROP_COUNTER_ID
        if (!counterId) {
            return { success: false, error: 'Boss Drop counter not configured' }
        }

        return new Promise((resolve) => {
            try {
                const tx = new TransactionBlock()

                tx.moveCall({
                    target: `${MODULES.bossdrop}::claim_boss_drop`,
                    arguments: [
                        tx.object(counterId),
                        tx.pure(bossType, 'u8'),
                        tx.pure(rarity, 'u8'),
                    ],
                })

                tx.setGasBudget(10000000)

                signAndExecuteTransaction(
                    {
                        transaction: tx as any,
                    },
                    {
                        onSuccess: (result) => {
                            resolve({ success: true, digest: result.digest })
                        },
                        onError: (error) => {
                            console.error('❌ Claim failed:', error)
                            resolve({ success: false, error: error.message })
                        },
                    }
                )
            } catch (err: any) {
                console.error('❌ Claim execution error:', err)
                resolve({ success: false, error: err.message })
            }
        })
    }

    return { claimDrop }
}
