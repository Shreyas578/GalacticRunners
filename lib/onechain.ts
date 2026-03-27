/**
 * OneChain SDK Integration
 * OneChain uses Move language with Object-Centric Architecture
 * Similar to Aptos/Sui but with OneChain-specific implementations
 */

// OneChain Network Configuration
export const ONECHAIN_TESTNET = {
  nodeUrl: "https://testnet-rpc.onechain.xyz",
  chainId: 1002,
  networkName: "OneChain Testnet",
  nativeCurrency: {
    name: "tOCT",
    symbol: "tOCT",
    decimals: 18,
  },
}

// OneChain Module Addresses (will be set after deployment)
export const MODULE_ADDRESSES = {
  spaceship: process.env.NEXT_PUBLIC_SPACESHIP_MODULE || "",
  bossdrop: process.env.NEXT_PUBLIC_BOSSDROP_MODULE || "",
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_MODULE || "",
  player: process.env.NEXT_PUBLIC_PLAYER_MODULE || "",
}

/**
 * OneChain Client - Interface for interacting with OneChain
 * This will use the OneChain SDK when available
 */
export class OneChainClient {
  private nodeUrl: string
  private chainId: number

  constructor(nodeUrl: string = ONECHAIN_TESTNET.nodeUrl, chainId: number = ONECHAIN_TESTNET.chainId) {
    this.nodeUrl = nodeUrl
    this.chainId = chainId
  }

  /**
   * Get account balance (OCT/tOCT)
   */
  async getBalance(address: string): Promise<string> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_ONECHAIN_NODE_URL || "https://rpc-testnet.onelabs.cc"
      console.log("🔍 Fetching balance for address:", address)
      console.log("🔍 Using RPC URL:", rpcUrl)

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      })

      const data = await response.json()
      console.log("📦 RPC Response:", data)

      if (data.result) {
        // Convert from hex wei to OCT
        const weiBalance = BigInt(data.result)
        const octBalance = Number(weiBalance) / 1e18
        console.log("✅ Balance fetched successfully:", {
          hex: data.result,
          wei: weiBalance.toString(),
          oct: octBalance.toFixed(2)
        })
        return octBalance.toFixed(2)
      }

      console.warn("⚠️ No result in RPC response, returning 0.00")
      return "0.00"
    } catch (error) {
      console.error("❌ Error fetching balance:", error)
      return "0.00"
    }
  }

  /**
   * Get account resources (objects owned by the account)
   */
  async getAccountResources(address: string): Promise<any[]> {
    // TODO: Implement with OneChain SDK
    // Returns all objects (spaceships, boss drops) owned by the account
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * Mint a spaceship object
   */
  async mintSpaceship(
    signer: any,
    owner: string,
    shipType: number,
  ): Promise<string> {
    // TODO: Implement with OneChain SDK
    // Calls the mint_spaceship function in Spaceship.move
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * Mint a boss drop object
   */
  async mintBossDrop(
    signer: any,
    owner: string,
    bossType: number,
    rarity: number,
  ): Promise<string> {
    // TODO: Implement with OneChain SDK
    // Calls the mint_boss_drop function in BossDrop.move
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * List spaceship for sale
   */
  async listSpaceship(
    signer: any,
    spaceshipId: string,
    price: string,
  ): Promise<string> {
    // TODO: Implement with OneChain SDK
    // Calls the list_spaceship function in Marketplace.move
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * Buy spaceship from marketplace
   */
  async buySpaceship(
    signer: any,
    spaceshipId: string,
    price: string,
  ): Promise<string> {
    // TODO: Implement with OneChain SDK
    // Calls the buy_spaceship function in Marketplace.move
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * Update player stats after game
   */
  async updatePlayerStats(
    signer: any,
    score: number,
    wave: number,
    won: boolean,
  ): Promise<string> {
    // TODO: Implement with OneChain SDK
    // Calls the update_game_stats function in Player.move
    throw new Error("OneChain SDK integration needed")
  }

  /**
   * Get player stats
   */
  async getPlayerStats(address: string): Promise<{
    totalGames: number
    totalWins: number
    totalScore: number
    highestWave: number
  }> {
    // TODO: Implement with OneChain SDK
    // Calls the get_stats function in Player.move
    // For now returning mock data to prevent errors
    return {
      totalGames: 0,
      totalWins: 0,
      totalScore: 0,
      highestWave: 0
    }
  }

  /**
   * Get player's spaceships with details
   */
  async getPlayerSpaceships(address: string): Promise<any[]> {
    try {
      const { SuiClient } = await import('@mysten/sui.js/client')
      const client = new SuiClient({ url: process.env.NEXT_PUBLIC_ONECHAIN_NODE_URL || "https://rpc-testnet.onelabs.cc" })

      const packageId = process.env.NEXT_PUBLIC_SPACESHIP_MODULE?.split('::')[0]
      if (!packageId) return []

      const spaceshipType = `${packageId}::spaceship::Spaceship`

      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: spaceshipType
        },
        options: {
          showContent: true,
        }
      })

      return objects.data.map(obj => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as any
          return {
            id: obj.data.objectId,
            shipId: fields.ship_id,
            shipType: fields.ship_type,
            level: fields.level,
            wins: fields.wins,
            score: fields.score
          }
        }
        return null
      }).filter(ship => ship !== null)
    } catch (error) {
      console.error("Error fetching player spaceships:", error)
      return []
    }
  }

  /**
   * Get player's boss drops
   */
  async getPlayerBossDrops(address: string): Promise<string[]> {
    // TODO: Implement with OneChain SDK
    // Returns array of boss drop object IDs
    return []
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(): Promise<
    Array<{
      id: string
      type: "ship" | "drop"
      name: string
      rarity: string
      price: string
      seller: string
    }>
  > {
    // TODO: Implement with OneChain SDK
    return []
  }
}

// Export singleton instance
export const onechainClient = new OneChainClient()
