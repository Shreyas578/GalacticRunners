/**
 * OneChain Transaction Utilities
 * Handle real blockchain transactions for marketplace
 */

export interface TransactionParams {
    packageId: string
    module: string
    function: string
    arguments: any[]
    gasBudget?: number
}

export interface TransactionResult {
    success: boolean
    transactionHash?: string
    error?: string
}

/**
 * Execute a Move function call on OneChain
 */
export async function executeTransaction(
    provider: any,
    params: TransactionParams
): Promise<TransactionResult> {
    try {
        console.log('🔄 Executing transaction:', params)

        // Request transaction from OneWallet
        const result = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
                from: await provider.request({ method: 'eth_requestAccounts' }).then((accounts: string[]) => accounts[0]),
                to: params.packageId,
                data: encodeMoveFunctionCall(params),
                gas: `0x${(params.gasBudget || 1000000).toString(16)}`,
            }],
        })

        console.log('✅ Transaction submitted:', result)

        return {
            success: true,
            transactionHash: result,
        }
    } catch (error: any) {
        console.error('❌ Transaction failed:', error)
        return {
            success: false,
            error: error.message || 'Transaction failed',
        }
    }
}

/**
 * Encode Move function call parameters
 */
function encodeMoveFunctionCall(params: TransactionParams): string {
    // This is a simplified version - OneChain uses same ABI encoding as Ethereum
    // For Move calls: module::function format
    const functionSignature = `${params.module}::${params.function}`

    // TODO: Implement proper Move ABI encoding
    // For now, return function signature as hex
    return '0x' + Buffer.from(functionSignature).toString('hex')
}

/**
 * Buy a spaceship from the marketplace
 */
export async function buySpaceship(
    provider: any,
    shipId: number,
    priceOCT: number
): Promise<TransactionResult> {
    const packageId = process.env.NEXT_PUBLIC_MARKETPLACE_MODULE?.split('::')[0] || ''

    // Convert OCT to wei (10^18)
    const priceWei = BigInt(Math.floor(priceOCT * 1e18))

    return executeTransaction(provider, {
        packageId,
        module: 'marketplace',
        function: 'buy_spaceship',
        arguments: [
            shipId,
            priceWei.toString(),
        ],
        gasBudget: 1000000, // 0.001 OCT
    })
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
    provider: any,
    transactionHash: string,
    maxAttempts: number = 30
): Promise<{ confirmed: boolean; receipt?: any }> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const receipt = await provider.request({
                method: 'eth_getTransactionReceipt',
                params: [transactionHash],
            })

            if (receipt) {
                console.log('✅ Transaction confirmed:', receipt)
                return { confirmed: true, receipt }
            }

            // Wait 2 seconds before next attempt
            await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
            console.warn('⏳ Waiting for confirmation...', i + 1, '/', maxAttempts)
        }
    }

    return { confirmed: false }
}

/**
 * Get user's OneWallet provider
 */
export function getOneWalletProvider(): any | null {
    if (typeof window === 'undefined') return null

    // Check for multiple providers
    if (window.ethereum?.providers) {
        const oneWallet = window.ethereum.providers.find((p: any) => p.isOneWallet)
        if (oneWallet) {
            console.log('✅ Found OneWallet provider')
            return oneWallet
        }
    }

    // Check single provider
    if (window.ethereum?.isOneWallet) {
        console.log('✅ Using OneWallet provider')
        return window.ethereum
    }

    console.warn('⚠️ OneWallet not found')
    return null
}
