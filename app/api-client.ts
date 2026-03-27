// Client utility for API calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const apiClient = {
  async claimSignature(payload: {
    playerAddress: string
    bossType: string
    score: number
    wave: number
  }) {
    const response = await fetch(`${API_BASE}/auth/claim-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return response.json()
  },

  async requestFaucet(address: string) {
    const response = await fetch(`${API_BASE}/rewards/faucet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
    return response.json()
  },

  async getLeaderboard(limit = 10, offset = 0) {
    const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}&offset=${offset}`)
    return response.json()
  },

  async submitScore(score: number, wave: number, address: string, shipType: string) {
    const response = await fetch(`${API_BASE}/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, score, wave, shipType }),
    })
    return response.json()
  },

  async getPlayerStats(address: string) {
    const response = await fetch(`${API_BASE}/player/stats?address=${address}`)
    return response.json()
  },

  async getShipMetadata(shipId?: string) {
    const url = shipId ? `${API_BASE}/metadata/ships?shipId=${shipId}` : `${API_BASE}/metadata/ships`
    const response = await fetch(url)
    return response.json()
  },

  async getHealth() {
    const response = await fetch(`${API_BASE}/health`)
    return response.json()
  },
}
