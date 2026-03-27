# 🚀 Galactic Runners

A Star Wars-inspired on-chain space shooter built on **OneChain Testnet**. Players pilot NFT starfighters, defeat Imperial bosses, earn OCT rewards, and compete on a global leaderboard — all powered by Move smart contracts.

---

## ✨ Features

- **Star Wars intro crawl** — cinematic opening sequence
- **12 unique starfighters** — free Viper + 11 purchasable ships with distinct stats
- **Solo & Multiplayer modes** — up to 4 pilots in a shared room
- **On-chain purchases** — ship prices paid in OCT, transferred to treasury
- **Boss encounters** — every 5 waves spawns a unique boss with special attack patterns
- **GameFi mechanics** — kill streak multiplier, daily streak bonus, wave clear rewards
- **OCT rewards** — treasury auto-pays players for boss kills and wave milestones
- **Global leaderboard** — best score per wallet, live refresh
- **Command Analytics** — treasury balance, total games, unique pilots (owner-only)
- **Animated starfield** — canvas-based parallax star background
- **Imperial March** — Star Wars theme plays in-game

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Game Engine | Phaser 3 (client-side, dynamic import) |
| Blockchain | OneChain Testnet (Sui-compatible Move VM) |
| Wallet | `@mysten/dapp-kit` + OneWallet extension |
| Transactions | `@mysten/sui/transactions` — `Transaction` builder |
| Smart Contracts | Move (Spaceship, Marketplace, BossDrop, Player modules) |
| State | In-memory API routes (Next.js Route Handlers) |

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                  # Main app shell, routing, wallet state
│   ├── layout.tsx                # Root layout with OneChainProvider
│   ├── api/
│   │   ├── leaderboard/          # GET/POST scores (best-per-address)
│   │   ├── multiplayer/rooms/    # Room create/join/start/sync
│   │   ├── rewards/payout/       # Auto OCT payout from treasury
│   │   ├── player/               # Player stats
│   │   └── onechain/             # RPC proxy (balance, object fetch)
│   └── api-client.ts             # Frontend API helper
│
├── components/
│   ├── phaser-game.tsx           # Full Phaser 3 game (GameScene + UIScene)
│   ├── game-container.tsx        # React wrapper, HUD, reward toasts
│   ├── star-wars-intro.tsx       # Perspective crawl intro
│   ├── spaceships-portal.tsx     # Ship hangar grid
│   ├── multiplayer-lobby.tsx     # Room create/join/poll UI
│   ├── leaderboard-widget.tsx    # Live leaderboard
│   ├── analysis-dashboard.tsx    # Owner analytics (treasury, games, players)
│   ├── onechain-provider.tsx     # dapp-kit QueryClient + WalletProvider
│   └── wallet-connector.tsx      # Legacy connector (unused)
│
├── hooks/
│   ├── use-marketplace-purchase.ts  # Ship purchase → treasury transfer
│   └── use-claim-boss-drop.ts       # Boss NFT claim
│
├── lib/
│   ├── onechain-config.ts        # RPC URL, package IDs
│   └── onechain.ts               # OneChainClient (balance, spaceships)
│
├── sources/                      # Move smart contracts
│   ├── Spaceship.move
│   ├── Marketplace.move
│   ├── BossDrop.move
│   └── Player.move
│
└── public/
    ├── logo.png                  # Game logo
    └── Star Wars- The Imperial March (Darth Vaders Theme).mp3
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
# OneChain Testnet RPC
NEXT_PUBLIC_ONECHAIN_NODE_URL=https://rpc-testnet.onelabs.cc:443
NEXT_PUBLIC_CHAIN_ID=1002
NEXT_PUBLIC_CHAIN_NAME=OneChain Testnet

# Deployed Move Package
NEXT_PUBLIC_SPACESHIP_MODULE=0xPACKAGE_ID::spaceship
NEXT_PUBLIC_BOSSDROP_MODULE=0xPACKAGE_ID::bossdrop
NEXT_PUBLIC_MARKETPLACE_MODULE=0xPACKAGE_ID::marketplace
NEXT_PUBLIC_PLAYER_MODULE=0xPACKAGE_ID::player

# Shared Objects
NEXT_PUBLIC_MARKETPLACE_OBJECT_ID=0xMARKETPLACE_OBJECT_ID
NEXT_PUBLIC_SPACESHIP_COUNTER_ID=0xCOUNTER_OBJECT_ID

# Treasury (server-side only — never expose to client)
TREASURY_ADDRESS=0x0a784b7266d2725db744b69fdd647466a66e0a2c6e054d02a11bddc6a1e01ba2
ONECHAIN_TREASURY_SECRET_KEY=YOUR_64_CHAR_HEX_PRIVATE_KEY
```

> ⚠️ Never commit `ONECHAIN_TREASURY_SECRET_KEY` to git. Add `.env` to `.gitignore`.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) and connect your OneWallet.

---

## 🎮 How to Play

1. Connect your **OneWallet** (set to OneChain Testnet)
2. Watch the intro crawl or skip it
3. Select a ship from the **Hangar** (Viper is free)
4. Choose **Solo Strike** (pay 0.001 OCT entry fee) or **Squadron Combat**
5. Survive waves of enemies — every 5 waves spawns a boss
6. Defeat bosses to earn **OCT rewards** sent automatically to your wallet
7. Your best score is recorded on the **Rankings** leaderboard

### Controls
| Key | Action |
|---|---|
| Arrow Keys | Move ship |
| Space | Fire |
| ESC | Exit game |

### GameFi Mechanics
| Mechanic | Reward |
|---|---|
| Kill Streak (5+) | Score multiplier (0.5x per 5 kills) |
| Daily Streak | Up to 2x score bonus for consecutive days |
| Wave Clear | Bonus points per wave + OCT at waves 5/10/20 |
| Boss Kill | 0.05 OCT auto-paid from treasury |
| New Personal Best | 0.1 OCT auto-paid from treasury |

---

## 🏪 Marketplace

Ships are purchased by transferring OCT directly to the treasury address. Ownership is persisted in `localStorage` per wallet address. The treasury balance is visible in the Command Analytics dashboard (owner wallet only).

---

## 👥 Multiplayer

1. One player creates a room (pays entry fee)
2. Others join via room code (each pays entry fee)
3. Creator sees all joined pilots and clicks **LAUNCH MISSION**
4. All players' screens launch simultaneously
5. The **creator is the authoritative game server** — enemy positions sync to all clients every 200ms via polling
6. Remote players appear as cyan-tinted ghost ships

> **Note:** Multiplayer uses in-memory state. Works reliably on localhost. For production deployment, replace the in-memory `rooms` Map in `app/api/multiplayer/rooms/route.ts` with Redis or Vercel KV.

---

## 🔐 Owner Dashboard

Connect with wallet `0x0a784b...` to access **Command Analytics**:
- Live treasury OCT balance
- Total games played
- Unique pilots registered
- Platform fees collected
- Revenue breakdown chart

---

## 📜 Smart Contracts

Deployed on OneChain Testnet at package `0x514d92711951d421d7a94af7c350597d3d1368ca34eaa1203080634e8f065568`

| Module | Description |
|---|---|
| `spaceship` | Mint and manage NFT starfighters |
| `marketplace` | List, buy, cancel ship listings |
| `bossdrop` | Mint boss defeat reward NFTs |
| `player` | Track game stats on-chain |

---

## 🌐 Deployment

### Vercel

```bash
vercel deploy
```

Add all environment variables in **Vercel Project Settings → Environment Variables**.

> For multiplayer on Vercel, add [Upstash Redis](https://upstash.com) and replace the in-memory Map with Redis calls.

---

## 📄 License

MIT
