"use client"

import { useEffect, useRef } from "react"
import type * as Phaser from "phaser"

interface PhaserGameProps {
  selectedShip: string
  account: string
  mode?: "SOLO" | "MULTIPLAYER"
  playerCount?: number
  roomId?: string
  isCreator?: boolean
  onGameEnd?: (score: number, wave: number) => void
  onBossDefeated?: (data: any) => void
}

export function PhaserGame({ selectedShip, account, mode = "SOLO", playerCount = 1, roomId, isCreator, onGameEnd, onBossDefeated }: PhaserGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return

    let isMounted = true
    let cleanupResize: (() => void) | undefined

    const initGame = async () => {
      const Phaser = await import("phaser")

      if (!isMounted) return

      interface ShipStats {
        speed: number
        firepower: number
        fireRate: number
        maxHealth: number
        armor: number
      }

      // Create GameScene class with proper Phaser.Scene extension
      class GameScene extends Phaser.Scene {
        // ... (GameScene implementation)
        private selectedShip: string
        private account: string
        private onGameEnd?: (score: number, wave: number) => void
        private onBossDefeated?: (data: any) => void
        private player?: Phaser.Physics.Arcade.Sprite
        private enemies?: Phaser.Physics.Arcade.Group
        private bosses?: Phaser.Physics.Arcade.Group
        private bullets?: Phaser.Physics.Arcade.Group
        private enemyBullets?: Phaser.Physics.Arcade.Group
        private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
        private bulletsToSync: any[] = []
        private score = 0
        private wave = 1
        private waveEnemyCount = 5
        private health = 100
        private fireRate = 300
        private lastShot = 0
        private shipStats: ShipStats | null = null
        private spawnedBulletIds: Set<string> = new Set()
        private isBossWave = false
        private bossDefeated = false
        private isGameOverTriggered = false
        private isSyncing = false
        // GameFi
        private killStreak = 0
        private killStreakTimer: any = null
        private dailyStreakBonus = 1.0
        private streakText?: Phaser.GameObjects.Text

        private mode: "SOLO" | "MULTIPLAYER"
        private playerCount: number
        private roomId: string = ""
        private isCreator: boolean = false
        private lastPower: number = 0
        private enemyMap: Map<string, any> = new Map()
        private remoteSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map()
        private remoteHealthBars: Map<string, { bg: Phaser.GameObjects.Rectangle, fill: Phaser.GameObjects.Rectangle }> = new Map()
        private syncInterval: any = null
        private bgMusic?: Phaser.Sound.BaseSound

        constructor(selectedShip: string, account: string, mode: "SOLO" | "MULTIPLAYER" = "SOLO", playerCount: number = 1, roomId: string = "", isCreator: boolean = false, onGameEnd?: (score: number, wave: number) => void) {
          super({ key: 'GameScene' })
          this.selectedShip = selectedShip
          this.account = account
          this.mode = mode
          this.playerCount = playerCount
          this.roomId = roomId
          this.isCreator = isCreator
          this.onGameEnd = onGameEnd
        }

        preload() {
          this.createPlayerSprite()
          this.createEnemySprite()
          this.createBossSprite()
          this.createBulletSprite()
          this.createEnemyBulletSprite()
          
          // Load Imperial March from a reliable public archive
          this.load.audio('imperial_march', 'https://ia801309.us.archive.org/28/items/star-wars-the-imperial-march-darth-vader-s-theme/Star%20Wars%20-%20The%20Imperial%20March%20%28Darth%20Vader%27s%20Theme%29.mp3')
        }

        create() {
          console.log("✅ GameScene created successfully!")
          
          // Start the Imperial March
          try {
            this.bgMusic = this.sound.add('imperial_march', { loop: true, volume: 0.5 })
            this.bgMusic.play()
          } catch (e) {
            console.warn("Imperial March failed to load, continuing in silence...")
          }

          this.shipStats = this.getShipStats(this.selectedShip)
          this.fireRate = this.shipStats.fireRate
          this.health = this.shipStats.maxHealth

          // Daily streak bonus
          try {
            const lastPlay = localStorage.getItem(`lastPlay_${this.account}`)
            const streak = parseInt(localStorage.getItem(`streak_${this.account}`) || '0')
            const today = new Date().toDateString()
            if (lastPlay === today) {
              this.dailyStreakBonus = 1.0 + Math.min(streak * 0.1, 1.0) // max 2x
            } else if (lastPlay === new Date(Date.now() - 86400000).toDateString()) {
              const newStreak = streak + 1
              localStorage.setItem(`streak_${this.account}`, String(newStreak))
              localStorage.setItem(`lastPlay_${this.account}`, today)
              this.dailyStreakBonus = 1.0 + Math.min(newStreak * 0.1, 1.0)
            } else {
              localStorage.setItem(`streak_${this.account}`, '1')
              localStorage.setItem(`lastPlay_${this.account}`, today)
              this.dailyStreakBonus = 1.0
            }
          } catch { this.dailyStreakBonus = 1.0 }

          this.createBackground()

          this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            `player_${this.selectedShip}`,
          )
          this.player.setCollideWorldBounds(true)
          this.player.setData("ship", this.selectedShip)
          this.player.setData("health", this.health)
          this.player.setDisplaySize(50, 50)

          this.bullets = this.physics.add.group()
          this.enemyBullets = this.physics.add.group()

          this.enemies = this.physics.add.group()
          this.bosses = this.physics.add.group()

          this.cursors = this.input.keyboard!.createCursorKeys()
          this.input.keyboard!.on("keydown-SPACE", () => this.fireBullet(this.player))


          if (this.bullets && this.enemies) {
            this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy as any, undefined, this)
          }
          if (this.bullets && this.bosses) {
            this.physics.add.overlap(this.bullets, this.bosses, this.hitBoss as any, undefined, this)
          }
          
           if (this.player && this.enemies && this.enemyBullets && this.bosses) {
                this.physics.add.overlap(this.player, this.enemies, this.playerHit as any, undefined, this)
                this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit as any, undefined, this)
                this.physics.add.overlap(this.player, this.bosses, this.playerHit as any, undefined, this)
           }

          // Ensure canvas has focus
          this.game.canvas.focus()

          // Launch UI Scene explicitly to ensure it's on top
          this.scene.launch('UIScene')

          // Kill streak HUD
          this.streakText = this.add.text(this.cameras.main.width / 2, 60, '', {
            fontSize: '18px', color: '#ffd700', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3
          }).setOrigin(0.5).setDepth(100)

          this.events.emit("updateScore", this.score)
          this.events.emit("updateWave", this.wave)
          this.events.emit("updateHealth", this.health, this.shipStats.maxHealth)

          // Multiplayer: only creator spawns enemies; non-creator waits for server state
          if (this.mode === "MULTIPLAYER" && this.roomId) {
            this.startMultiplayerSync()
            if (this.isCreator) this.spawnWave()
          } else {
            this.spawnWave()
          }
        }

        // ── Multiplayer sync ──────────────────────────────────────────
        private startMultiplayerSync() {
          // Use Phaser timers so they're cleaned up with the scene
          this.time.addEvent({ delay: 50, loop: true, callback: () => {
            if (!this.isSyncing) {
              this.isSyncing = true
              Promise.all([this.syncPush(), this.syncPull()]).finally(() => {
                this.isSyncing = false
              })
            }
          }, callbackScope: this })
        }

        private async syncPush() {
          if (!this.player || !this.roomId) return
          // Only creator pushes enemy state
          const enemies = this.isCreator ? this.serializeEnemies() : undefined
          const wave = this.isCreator ? this.wave : undefined

          const playerState = {
            x: Math.round(this.player.x),
            y: Math.round(this.player.y),
            health: this.health,
            score: this.score,
            bullets: [...this.bulletsToSync],
            shipType: this.selectedShip
          }
          this.bulletsToSync = []

          try {
            await fetch('/api/multiplayer/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'SYNC_PUSH',
                roomId: this.roomId,
                playerAddress: this.account,
                playerState,
                enemies,
                wave,
                isGameOver: this.health <= 0
              })
            })
          } catch { /* silent */ }
        }

        private async syncPull() {
          if (!this.roomId) return
          try {
            const res = await fetch('/api/multiplayer/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'SYNC_PULL', roomId: this.roomId, playerAddress: this.account })
            })
            const data = await res.json()
            if (!data.success) return

            const { gameState } = data

            // Collective Game Over
            if (gameState.isGameOver && this.health > 0) {
              console.log("🚀 Collective Game Over triggered")
              this.gameOver()
              return
            }

            // Sync remote players
            for (const [addr, ps] of Object.entries(gameState.playerStates as Record<string, any>)) {
              if (addr === this.account) continue
              if (!this.remoteSprites.has(addr)) {
                const sprite = this.physics.add.sprite(ps.x, ps.y, `player_${ps.shipType || 'viper'}`)
                sprite.setDisplaySize(50, 50)
                sprite.setAlpha(0.6)
                sprite.setTint(0x00ffff)
                this.remoteSprites.set(addr, sprite)
              } else {
                const sprite = this.remoteSprites.get(addr)!
                sprite.setData('targetX', ps.x)
                sprite.setData('targetY', ps.y)
              }

              // Update remote health bar
              this.updateRemoteHealthBar(addr, ps.x, ps.y, ps.health)

              // Spawn remote bullets
              if (ps.bullets) {
                ps.bullets.forEach((b: any) => {
                  if (!this.spawnedBulletIds.has(b.id)) {
                    this.spawnRemoteBullet(b.x, b.y)
                    this.spawnedBulletIds.add(b.id)
                  }
                })
              }
            }
            // Remove sprites and health bars for players who left
            for (const [addr, sprite] of this.remoteSprites.entries()) {
              if (!gameState.playerStates[addr]) {
                sprite.destroy()
                this.remoteSprites.delete(addr)
                
                const bars = this.remoteHealthBars.get(addr)
                if (bars) {
                  bars.bg.destroy()
                  bars.fill.destroy()
                  this.remoteHealthBars.delete(addr)
                }
              }
            }

            // Non-creator syncs enemies from server
            if (!this.isCreator && gameState.enemies) {
              this.applyServerEnemies(gameState.enemies, gameState.wave)
            }
          } catch { /* silent */ }
        }

        private getEnemyId(enemy: any): string {
          if (!enemy.getData('id')) {
            enemy.setData('id', `e_${this.time.now}_${Math.random().toString(36).substr(2, 5)}`)
          }
          return enemy.getData('id')
        }

        private serializeEnemies(): any[] {
          const result: any[] = []
          if (this.enemies) {
            this.enemies.getChildren().forEach((e: any) => {
              if (e.active) {
                result.push({ 
                  id: this.getEnemyId(e), 
                  x: Math.round(e.x), 
                  y: Math.round(e.y), 
                  health: e.getData('health') || 30, 
                  type: 'enemy' 
                })
              }
            })
          }
          if (this.bosses) {
            this.bosses.getChildren().forEach((b: any) => {
              if (b.active) {
                result.push({ 
                  id: this.getEnemyId(b), 
                  x: Math.round(b.x), 
                  y: Math.round(b.y), 
                  health: b.getData('health') || 300, 
                  type: 'boss',
                  bossType: b.getData('bossType')
                })
              }
            })
          }
          return result
        }

        private applyServerEnemies(serverEnemies: any[], serverWave: number) {
          if (!this.enemies || !this.bosses) return
          if (serverWave && serverWave !== this.wave) {
            this.wave = serverWave
            this.events.emit("updateWave", this.wave)
          }

          const serverIds = new Set(serverEnemies.map(se => se.id))
          
          // 1. Remove local enemies that are no longer on server
          this.enemyMap.forEach((local, id) => {
            if (!serverIds.has(id)) {
              local.destroy()
              this.enemyMap.delete(id)
            }
          })

          // 2. Sync existing or create new
          serverEnemies.forEach(se => {
            let local = this.enemyMap.get(se.id)
            
            if (!local) {
              // Spawn new replica
              if (se.type === 'boss') {
                local = this.bosses!.create(se.x, se.y, `boss_${se.bossType}`)
                local.setDisplaySize(150, 150)
                local.setData('bossType', se.bossType)
              } else {
                local = this.enemies!.create(se.x, se.y, 'enemy')
                local.setDisplaySize(40, 40)
              }
              local.setData('id', se.id)
              this.enemyMap.set(se.id, local)
            }

            // Set target position for lerp in update()
            local.setData('targetX', se.x)
            local.setData('targetY', se.y)
            local.setData('health', se.health)
          })
        }

        private updateRemoteHealthBar(addr: string, x: number, y: number, health: number) {
          let bars = this.remoteHealthBars.get(addr)
          if (!bars) {
            const bg = this.add.rectangle(x, y - 35, 44, 6, 0x000000).setDepth(1000)
            const fill = this.add.rectangle(x, y - 35, 40, 4, 0x22d3ee).setDepth(1001)
            bars = { bg, fill }
            this.remoteHealthBars.set(addr, bars)
          }

          bars.bg.setPosition(x, y - 35)
          bars.fill.setPosition(x - (20 * (1 - health / 100)), y - 35)
          bars.fill.width = Math.max(0, 40 * (health / 100))
          
          const color = health > 60 ? 0x22d3ee : health > 30 ? 0xfbbf24 : 0xef4444
          bars.fill.setFillStyle(color)
        }

        shutdown() {
          if (this.syncInterval) clearInterval(this.syncInterval)
          this.remoteSprites.forEach(s => s.destroy())
          this.remoteSprites.clear()
          this.remoteHealthBars.forEach(b => { 
            if (b.bg) b.bg.destroy(); 
            if (b.fill) b.fill.destroy() 
          })
          this.remoteHealthBars.clear()
        }
        // ─────────────────────────────────────────────────────────────

        // ... (rest of GameScene methods)
        update() {
          if (!this.player || !this.cursors || !this.shipStats) return

          const speed = this.shipStats.speed

          // Player 1 (Arrow keys)
          if (this.player && this.player.active) {
              let vX1 = 0, vY1 = 0
              if (this.cursors.left.isDown) vX1 = -speed
              else if (this.cursors.right.isDown) vX1 = speed
              if (this.cursors.up.isDown) vY1 = -speed
              else if (this.cursors.down.isDown) vY1 = speed
              
              this.player.setVelocity(vX1, vY1)
              if (vX1 !== 0 || vY1 !== 0) {
                  this.player.rotation = Phaser.Math.Angle.Between(0, 0, vX1, vY1)
              }
          }

          // Lerp remote players
          this.remoteSprites.forEach((sprite, addr) => {
            if (!sprite.active || !sprite.scene) {
                this.remoteSprites.delete(addr)
                return
            }
            const tx = sprite.getData('targetX')
            const ty = sprite.getData('targetY')
            if (tx !== undefined && ty !== undefined) {
              sprite.x = Phaser.Math.Linear(sprite.x, tx, 0.2)
              sprite.y = Phaser.Math.Linear(sprite.y, ty, 0.2)
            }
          })

          // Lerp remote enemies (ONLY in MULTIPLAYER and for NON-CREATORS)
          if (this.mode === "MULTIPLAYER" && !this.isCreator && this.enemyMap) {
            this.enemyMap.forEach((enemy, id) => {
              if (!enemy.active || !enemy.scene) {
                  this.enemyMap.delete(id)
                  return
              }
              const tx = enemy.getData('targetX')
              const ty = enemy.getData('targetY')
              if (tx !== undefined && ty !== undefined) {
                enemy.x = Phaser.Math.Linear(enemy.x, tx, 0.2)
                enemy.y = Phaser.Math.Linear(enemy.y, ty, 0.2)
              }
            })
          }

          this.cleanupProjectiles()

          // All players run firing AI; only creator runs movement
          this.updateEnemyBehavior()
          this.updateBossBehavior()

          // Wave progression: Solo mode OR Creator in multiplayer
          const canProgress = this.mode === "SOLO" || this.isCreator
          if (canProgress) {
            if (
              this.enemies &&
              this.bosses &&
              this.enemies.getChildren().length === 0 &&
              this.bosses.getChildren().length === 0
            ) {
              this.nextWave()
            }
          }

          // Update local floating health bar
          if (this.player && this.player.active) {
            this.updateRemoteHealthBar(this.account, this.player.x, this.player.y, this.health)
          }

          if (this.health <= 0) {
            this.gameOver()
          }
        }

        private getShipStats(shipType: string): ShipStats {
          const stats: Record<string, ShipStats> = {
            phoenix: { speed: 350, firepower: 15, fireRate: 200, maxHealth: 80, armor: 0.8 },
            titan: { speed: 200, firepower: 25, fireRate: 400, maxHealth: 150, armor: 1.5 },
            viper: { speed: 300, firepower: 18, fireRate: 250, maxHealth: 100, armor: 1.0 },
            falcon: { speed: 400, firepower: 12, fireRate: 150, maxHealth: 60, armor: 0.6 },
            nova: { speed: 340, firepower: 22, fireRate: 220, maxHealth: 85, armor: 0.85 },
            glacier: { speed: 150, firepower: 30, fireRate: 500, maxHealth: 200, armor: 2.0 },
            venom: { speed: 310, firepower: 20, fireRate: 180, maxHealth: 95, armor: 0.95 },
            sky: { speed: 450, firepower: 10, fireRate: 120, maxHealth: 50, armor: 0.5 },
            obsidian: { speed: 180, firepower: 28, fireRate: 450, maxHealth: 180, armor: 1.8 },
            solar: { speed: 360, firepower: 19, fireRate: 200, maxHealth: 75, armor: 0.98 },
          }
          return stats[shipType.toLowerCase()] || stats.viper
        }

        private createPlayerSprite() {
          const shipTypes = ["phoenix", "titan", "viper", "falcon"]
          shipTypes.forEach((shipType) => {
            const graphics = this.make.graphics({ x: 0, y: 0 })
            const size = 50

            const colors = {
              phoenix: { primary: 0xff6b35, secondary: 0xff8c42, glow: 0xffaa66 },
              titan: { primary: 0x4a90e2, secondary: 0x6ba3e3, glow: 0x8bb5e5 },
              viper: { primary: 0x9b59b6, secondary: 0xb370d4, glow: 0xcb8ce5 },
              falcon: { primary: 0x2ecc71, secondary: 0x52d68a, glow: 0x76e0a3 },
            }

            const color = colors[shipType as keyof typeof colors] || colors.viper

            graphics.fillStyle(color.glow, 0.3)
            graphics.fillCircle(size / 2, size / 2, size / 2 + 5)

            graphics.fillStyle(color.primary, 1)
            graphics.beginPath()
            graphics.moveTo(size / 2, 5)
            graphics.lineTo(size - 5, size - 5)
            graphics.lineTo(5, size - 5)
            graphics.closePath()
            graphics.fillPath()

            graphics.fillStyle(color.secondary, 0.8)
            graphics.fillRect(size / 2 - 8, size / 2, 16, 8)

            graphics.fillStyle(0x40e0d0, 0.9)
            graphics.fillRect(size / 2 - 6, size - 8, 12, 6)

            graphics.fillStyle(0x1a1a2e, 1)
            graphics.fillCircle(size / 2, size / 2 - 5, 6)

            graphics.generateTexture(`player_${shipType}`, size, size)
            graphics.destroy()
          })
        }

        private createEnemySprite() {
          const graphics = this.make.graphics({ x: 0, y: 0 })
          const size = 40

          graphics.fillStyle(0xff0000, 0.4)
          graphics.fillCircle(size / 2, size / 2, size / 2 + 3)

          graphics.fillStyle(0xff6b6b, 1)
          graphics.beginPath()
          graphics.moveTo(size / 2, 5)
          graphics.lineTo(size - 5, size / 2)
          graphics.lineTo(size / 2, size - 5)
          graphics.lineTo(5, size / 2)
          graphics.closePath()
          graphics.fillPath()

          graphics.fillStyle(0x8b0000, 1)
          graphics.fillCircle(size / 2, size / 2, 8)

          graphics.fillStyle(0xff4444, 1)
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2
            const x = size / 2 + Math.cos(angle) * 15
            const y = size / 2 + Math.sin(angle) * 15
            graphics.fillCircle(x, y, 3)
          }

          graphics.generateTexture("enemy", size, size)
          graphics.destroy()
        }

        private createBossSprite() {
          const bossTypes = ["VOID_LEVIATHAN", "NEBULA_TYRANT", "COSMIC_SERPENT", "STAR_DESTROYER", "HARBINGER_OF_DOOM", "GALAXY_EATER", "STAR_CRUSHER", "VOID_PHANTOM"]
          bossTypes.forEach((bossType) => {
            const graphics = this.make.graphics({ x: 0, y: 0 })
            const size = 120 // Larger bosses

            const bossColors: Record<string, { primary: number; secondary: number; glow: number }> = {
              VOID_LEVIATHAN: { primary: 0x2d1b4e, secondary: 0x4a2c7a, glow: 0x6b3fa0 },
              NEBULA_TYRANT: { primary: 0x8b008b, secondary: 0xba55d3, glow: 0xdda0dd },
              COSMIC_SERPENT: { primary: 0x00ced1, secondary: 0x40e0d0, glow: 0x7fffd4 },
              STAR_DESTROYER: { primary: 0xff4500, secondary: 0xff6347, glow: 0xff7f50 },
              HARBINGER_OF_DOOM: { primary: 0x333333, secondary: 0x000000, glow: 0xff0000 },
              GALAXY_EATER: { primary: 0x000000, secondary: 0x1a1a1a, glow: 0x4b0082 },
              STAR_CRUSHER: { primary: 0xc0c0c0, secondary: 0xffd700, glow: 0xfffacd },
              VOID_PHANTOM: { primary: 0xe6e6fa, secondary: 0xf8f8ff, glow: 0xffffff },
            }

            const color = bossColors[bossType] || bossColors.NEBULA_TYRANT

            graphics.fillStyle(color.glow, 0.5)
            graphics.fillCircle(size / 2, size / 2, size / 2 + 10)

            graphics.fillStyle(color.primary, 1)
            graphics.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3
              const x = size / 2 + Math.cos(angle) * (size / 2 - 10)
              const y = size / 2 + Math.sin(angle) * (size / 2 - 10)
              if (i === 0) graphics.moveTo(x, y)
              else graphics.lineTo(x, y)
            }
            graphics.closePath()
            graphics.fillPath()

            graphics.fillStyle(color.secondary, 0.8)
            graphics.fillCircle(size / 2, size / 2, size / 3)

            graphics.fillStyle(0xffffff, 1)
            graphics.fillCircle(size / 2, size / 2, 15)

            graphics.lineStyle(3, color.glow, 0.8)
            graphics.strokeCircle(size / 2, size / 2, size / 2 - 5)
            graphics.strokeCircle(size / 2, size / 2, size / 2 - 15)

            graphics.fillStyle(color.secondary, 1)
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4
              const x = size / 2 + Math.cos(angle) * (size / 2 - 5)
              const y = size / 2 + Math.sin(angle) * (size / 2 - 5)
              graphics.fillCircle(x, y, 4)
            }

            graphics.generateTexture(`boss_${bossType}`, size, size)
            graphics.destroy()
          })
        }

        private createBulletSprite() {
          const graphics = this.make.graphics({ x: 0, y: 0 })
          const size = 8

          graphics.fillStyle(0x40e0d0, 0.6)
          graphics.fillCircle(size / 2, size / 2, size / 2 + 2)

          graphics.fillStyle(0x40e0d0, 1)
          graphics.fillCircle(size / 2, size / 2, size / 2)

          graphics.fillStyle(0xffffff, 1)
          graphics.fillCircle(size / 2, size / 2, 2)

          graphics.generateTexture("bullet", size, size)
          graphics.destroy()
        }

        private createEnemyBulletSprite() {
          const graphics = this.make.graphics({ x: 0, y: 0 })
          const size = 8

          graphics.fillStyle(0xff6b6b, 0.6)
          graphics.fillCircle(size / 2, size / 2, size / 2 + 2)

          graphics.fillStyle(0xff6b6b, 1)
          graphics.fillCircle(size / 2, size / 2, size / 2)

          graphics.fillStyle(0xff0000, 1)
          graphics.fillCircle(size / 2, size / 2, 2)

          graphics.generateTexture("enemyBullet", size, size)
          graphics.destroy()
        }

        private createBackground() {
          const graphics = this.make.graphics({ x: 0, y: 0 })
          graphics.fillStyle(0x0a0e27, 1)
          graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)

          for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width)
            const y = Phaser.Math.Between(0, this.cameras.main.height)
            const size = Math.random() * 2 + 0.5
            const brightness = Math.random() * 0.8 + 0.2
            graphics.fillStyle(0xffffff, brightness)
            graphics.fillCircle(x, y, size)
          }

          for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width)
            const y = Phaser.Math.Between(0, this.cameras.main.height)
            const radius = Phaser.Math.Between(50, 150)
            graphics.fillStyle(0x1a1a3e, 0.3)
            graphics.fillCircle(x, y, radius)
          }

          graphics.generateTexture("background", this.cameras.main.width, this.cameras.main.height)
          graphics.destroy()

          this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, "background")
        }

        private fireBullet(shooter?: Phaser.Physics.Arcade.Sprite) {
          if (!shooter || !shooter.active || !this.bullets || !this.shipStats) return

          const now = this.time.now
          const shooterLastShot = shooter.getData('lastShot') || 0
          
          if (now - shooterLastShot < this.fireRate) return

          shooter.setData('lastShot', now)

          const offsetX = this.shipStats.firepower > 20 ? 15 : 0
          const bullets = [
            this.bullets.create(shooter.x - offsetX, shooter.y - 20, "bullet"),
            ...(offsetX > 0 ? [this.bullets.create(shooter.x + offsetX, shooter.y - 20, "bullet")] : []),
          ]

          bullets.forEach((bullet) => {
            bullet.setVelocityY(-500)
            bullet.setDisplaySize(8, 8)
            this.tweens.add({
              targets: bullet,
              alpha: { from: 1, to: 0.5 },
              duration: 100,
              yoyo: true,
              repeat: -1,
            })
          })

          // Multiplayer sync
          if (shooter === this.player && this.mode === "MULTIPLAYER") {
            const bulletId = `b_${this.account}_${this.time.now}_${Math.random().toString(36).substr(2, 5)}`
            this.bulletsToSync.push({ id: bulletId, x: shooter.x, y: shooter.y - 20 })
          }
        }

        private spawnRemoteBullet(x: number, y: number) {
          if (!this.bullets) return
          const bullet = this.bullets.create(x, y, "bullet")
          bullet.setVelocityY(-500)
          bullet.setDisplaySize(8, 8)
          bullet.setTint(0x00ffff)
        }

        private cleanupProjectiles() {
          ;[this.bullets, this.enemyBullets].forEach((group) => {
            if (!group) return
            group.getChildren().forEach((bullet: any) => {
              if (
                bullet.y < -100 ||
                bullet.y > this.cameras.main.height + 200 || // Allow bullets to go further down
                bullet.x < -100 ||
                bullet.x > this.cameras.main.width + 100
              ) {
                bullet.destroy()
              }
            })
          })
        }

        private updateEnemyBehavior() {
          if (!this.enemies || !this.player) return

          this.enemies.getChildren().forEach((enemy: any) => {
            // Movement: Solo mode OR Creator in multiplayer
            const canMove = this.mode === "SOLO" || this.isCreator
            if (canMove && Math.random() < 0.02) {
              const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player!.x, this.player!.y)
              enemy.setVelocity(Math.cos(angle) * 50, Math.sin(angle) * 50)
            }

            if (Math.random() < 0.015 && this.enemyBullets) { // Increased fire rate
              const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, "enemyBullet")
              bullet.setVelocityY(400) // Much faster
              bullet.setDisplaySize(8, 8)
              this.tweens.add({
                targets: bullet,
                scaleX: { from: 1, to: 1.2 },
                scaleY: { from: 1, to: 1.2 },
                duration: 200,
                yoyo: true,
                repeat: -1,
              })
            }
          })
        }

        private spawnWave() {
          if (!this.enemies) return

          this.isBossWave = this.wave % 5 === 0
          const enemyCount = this.isBossWave ? 1 : this.waveEnemyCount + this.wave * 2

          if (this.isBossWave) {
            this.spawnBoss()
          } else {
            for (let i = 0; i < enemyCount; i++) {
              const x = Phaser.Math.Between(50, this.cameras.main.width - 50)
              const y = Phaser.Math.Between(30, 150)
              const enemy = this.enemies.create(x, y, "enemy")
              enemy.setDisplaySize(40, 40)
              enemy.setData("health", 30)
              enemy.setData("maxHealth", 30)
              enemy.setData("id", `e_${this.time.now}_${Math.random().toString(36).substr(2, 5)}`)
              this.tweens.add({
                targets: enemy,
                y: enemy.y + Phaser.Math.Between(-10, 10),
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              })
            }
          }
        }

        private spawnBoss() {
          if (!this.bosses) return

          const bossType = this.getBossType()
          const boss = this.bosses.create(this.cameras.main.width / 2, 80, `boss_${bossType}`)
          boss.setDisplaySize(150, 150) // Larger bosses
          
          // Buffed HP: Base 2000 + 1000 per wave above 5
          const baseHp = bossType === "STAR_DESTROYER" ? 3000 : 1500
          const totalHp = baseHp + (Math.max(0, this.wave - 5) * 1000)
          
          boss.setData("health", totalHp)
          boss.setData("maxHealth", totalHp)
          boss.setData("bossType", bossType)
          boss.setData("rage", false)
          boss.setData("id", `boss_${this.time.now}_${bossType}`)
          this.bossDefeated = false

          boss.setScale(0)
          this.tweens.add({
            targets: boss,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            ease: "Back.easeOut",
            onComplete: () => {
              this.tweens.add({
                targets: boss,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
              })
            },
          })

          this.tweens.add({
            targets: boss,
            alpha: { from: 1, to: 0.8 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
          })

          this.tweens.add({
            targets: boss,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
          })
        }

        private updateBossBehavior() {
          if (!this.bosses || !this.player || !this.enemyBullets) return

          this.bosses.getChildren().forEach((boss: any) => {
            const bossType = boss.getData("bossType")
            const now = this.time.now
            const lastPower = boss.getData("lastPower") || 0
            const currentHp = boss.getData("health")
            const maxHp = boss.getData("maxHealth")
            
            // Rage Mode check
            const isRage = currentHp < maxHp * 0.4
            if (isRage && !boss.getData("rage")) {
                boss.setData("rage", true)
                boss.setTint(0xff0000)
                this.cameras.main.shake(200, 0.01)
            }
            
            const powerCooldown = isRage ? 600 : 1200 // Faster attacks in rage

            // Movement pattern (Authoritative)
            const canMove = this.mode === "SOLO" || this.isCreator
            if (canMove) {
              if (bossType === "VOID_LEVIATHAN") {
                boss.x += Math.sin(now / 800) * 3
              } else if (bossType === "NEBULA_TYRANT") {
                boss.y += Math.cos(now / 400) * 2
              } else if (bossType === "COSMIC_SERPENT") {
                boss.x += Math.sin(now / 400) * 8
                boss.y += Math.cos(now / 800) * 3
              } else if (bossType === "STAR_CRUSHER") {
                 boss.x += Math.sin(now / 1000) * 10
              } else if (bossType === "VOID_PHANTOM") {
                 boss.setAlpha(0.3 + Math.abs(Math.sin(now / 500)) * 0.7)
              }
            }

            // Offensive Power
            if (now - lastPower > powerCooldown) {
              boss.setData("lastPower", now)

              if (bossType === "VOID_LEVIATHAN") {
                // Circular blast
                for (let i = 0; i < 12; i++) {
                  const angle = (i * Math.PI * 2) / 12
                  const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                  bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200)
                }
              } else if (bossType === "NEBULA_TYRANT") {
                // Target player
                const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player!.x, this.player!.y)
                for (let i = -1; i <= 1; i++) {
                  const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                  const spread = i * 0.2
                  bullet.setVelocity(Math.cos(angle + spread) * 300, Math.sin(angle + spread) * 300)
                }
              } else if (bossType === "COSMIC_SERPENT") {
                // Rapid stream
                this.time.addEvent({
                  delay: 100,
                  repeat: 5,
                  callback: () => {
                    if (boss.active) {
                      const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                      bullet.setVelocityY(400)
                      bullet.setVelocityX(Phaser.Math.Between(-100, 100))
                    }
                  }
                })
              } else if (bossType === "STAR_DESTROYER") {
                // Heavy barrage - Lethal tracking
                const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                bullet.setDisplaySize(35, 35) // Even larger bullet
                bullet.setTint(0xff0000)
                this.physics.moveToObject(bullet, this.player!, 600) // Extreme speed
              } else if (bossType === "HARBINGER_OF_DOOM") {
                // Spiral pattern - More dense
                for (let i = 0; i < 24; i++) { // More bullets
                  const angle = (now / 80) + (i * Math.PI * 2) / 24
                  const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                  bullet.setVelocity(Math.cos(angle) * 450, Math.sin(angle) * 450)
                }
              } else if (bossType === "GALAXY_EATER") {
                // Suck players in (simulated effect)
                this.cameras.main.shake(500, 0.005)
                for (let i = 0; i < 16; i++) {
                  const angle = (i * Math.PI * 2) / 16
                  const bullet = this.enemyBullets!.create(boss.x + Math.cos(angle) * 300, boss.y + Math.sin(angle) * 300, "enemyBullet")
                  this.physics.moveToObject(bullet, boss, 250)
                }
              } else if (bossType === "STAR_CRUSHER") {
                // Massive falling rocks
                for (let i = 0; i < 3; i++) {
                  const x = Phaser.Math.Between(50, this.cameras.main.width - 50)
                  const bullet = this.enemyBullets!.create(x, 0, "enemyBullet")
                  bullet.setDisplaySize(60, 60)
                  bullet.setVelocityY(400)
                  bullet.setTint(0xffd700)
                }
              } else if (bossType === "VOID_PHANTOM") {
                // Teleport (Authoritative) and Snipe (Independent)
                if (this.mode === "SOLO" || this.isCreator) {
                  this.tweens.add({
                    targets: boss,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                      boss.x = Phaser.Math.Between(100, this.cameras.main.width - 100)
                      boss.y = Phaser.Math.Between(50, 150)
                      this.tweens.add({ targets: boss, alpha: 1, duration: 150 })
                      const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                      if (this.player && this.player.active) {
                         this.physics.moveToObject(bullet, this.player!, 800)
                      }
                    }
                  })
                } else {
                  // Non-creator: Wait for sync coordinates and fire
                  this.time.delayedCall(300, () => {
                    if (boss.active && this.player && this.player.active) {
                      const bullet = this.enemyBullets!.create(boss.x, boss.y, "enemyBullet")
                      this.physics.moveToObject(bullet, this.player!, 800)
                    }
                  })
                }
              }
            }
          })
        }

        private getBossType(): string {
          const types = ["VOID_LEVIATHAN", "NEBULA_TYRANT", "COSMIC_SERPENT", "STAR_DESTROYER", "HARBINGER_OF_DOOM", "GALAXY_EATER"]
          return types[Math.floor(Math.random() * types.length)]
        }

        private hitEnemy(
          bullet: Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite,
          enemy: Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite,
        ) {
          if (!this.shipStats) return

          const damage = this.shipStats.firepower
          const enemyHealth = (enemy.getData("health") || 30) - damage

          if (enemyHealth <= 0) {
            this.createExplosion(enemy.x, enemy.y, 0xff6b6b)
            enemy.destroy()
            // Kill streak multiplier
            this.killStreak++
            if (this.killStreakTimer) this.killStreakTimer.remove()
            this.killStreakTimer = this.time.delayedCall(3000, () => { this.killStreak = 0; if (this.streakText) this.streakText.setText('') })
            const streakMult = 1 + Math.floor(this.killStreak / 5) * 0.5
            const points = Math.round(100 * streakMult * this.dailyStreakBonus)
            this.score += points
            if (this.killStreak >= 5 && this.streakText) {
              this.streakText.setText(`🔥 ${this.killStreak} KILL STREAK! x${streakMult.toFixed(1)}`)
            }
            this.events.emit("updateScore", this.score)

            // Save to persistence
            try {
              const hs = parseInt(localStorage.getItem(`highscore_${this.account}`) || '0')
              if (this.score > hs) {
                localStorage.setItem(`highscore_${this.account}`, String(this.score))
              }
            } catch (e) {}
          } else {
            enemy.setData("health", enemyHealth)
            enemy.setTint(0xffffff)
            this.time.delayedCall(100, () => {
              if (enemy.active) enemy.clearTint()
            })
          }

          bullet.destroy()
        }

        private hitBoss(
          bullet: Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite,
          boss: Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite,
        ) {
          if (!this.shipStats) return

          const damage = this.shipStats.firepower
          const bossHealth = (boss.getData("health") || 200) - damage

          if (bossHealth <= 0) {
            this.createBossExplosion(boss.x, boss.y)
            boss.destroy()
            this.score += Math.round(5000 * this.dailyStreakBonus)
            this.killStreak = 0
            this.bossDefeated = true
            this.events.emit("updateScore", this.score)

            this.submitBossVictory(boss.getData("bossType"))
          } else {
            boss.setData("health", bossHealth)
            boss.setTint(0xffffff)
            this.time.delayedCall(150, () => {
              if (boss.active) boss.clearTint()
            })
          }

          bullet.destroy()
        }

        private createExplosion(x: number, y: number, color: number) {
          for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, color)
            const angle = (i * Math.PI * 2) / 8
            const distance = Phaser.Math.Between(20, 40)
            this.tweens.add({
              targets: particle,
              x: x + Math.cos(angle) * distance,
              y: y + Math.sin(angle) * distance,
              alpha: { from: 1, to: 0 },
              scale: { from: 1, to: 0 },
              duration: 300,
              onComplete: () => particle.destroy(),
            })
          }
        }

        private createBossExplosion(x: number, y: number) {
          for (let ring = 0; ring < 3; ring++) {
            const ringSize = 20 + ring * 15
            const particleCount = 16 + ring * 8
            for (let i = 0; i < particleCount; i++) {
              const particle = this.add.circle(x, y, 4, 0xba55d3)
              const angle = (i * Math.PI * 2) / particleCount
              const distance = ringSize
              this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: { from: 1, to: 0 },
                scale: { from: 1.5, to: 0 },
                duration: 500 + ring * 100,
                delay: ring * 50,
                onComplete: () => particle.destroy(),
              })
            }
          }
        }

        private playerHit(player: any, projectile: any) {
          if (projectile && projectile.active) {
            projectile.destroy()
          }

          const damage = 10 // Reduced for better balance but consistent
          this.health -= damage

          if (this.health < 0) this.health = 0

          // Visual feedback
          player.setTint(0xff0000)
          this.time.delayedCall(100, () => {
            if (player.active) player.clearTint()
          })

          this.events.emit("updateHealth", this.health, this.shipStats?.maxHealth || 100)

          if (this.health <= 0) {
            this.gameOver()
          }
        }

        private nextWave() {
          // Wave survival bonus
          const waveBonus = Math.round(this.wave * 250 * this.dailyStreakBonus)
          this.score += waveBonus
          this.events.emit("updateScore", this.score)
          if (this.streakText) {
            this.streakText.setText(`⭐ WAVE ${this.wave} CLEAR! +${waveBonus} pts`)
            this.time.delayedCall(2000, () => { if (this.streakText) this.streakText.setText('') })
          }
          this.wave++
          this.waveEnemyCount += 1
          this.events.emit("updateWave", this.wave)
          // Only creator spawns new enemies
          if (this.mode !== "MULTIPLAYER" || this.isCreator) {
            this.spawnWave()
          }
          // Trigger OCT reward for wave milestones
          if (this.wave === 5 || this.wave === 10 || this.wave === 20) {
            this.triggerReward("WAVE_CLEAR", this.wave)
          }
        }

        private async submitBossVictory(bossType: string) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: this.account, score: this.score, wave: this.wave, shipType: this.selectedShip.toUpperCase() }),
            })
          } catch { }
          // Pay OCT reward from treasury
          this.triggerReward("BOSS_KILL", this.wave)
        }

        private async triggerReward(eventType: string, wave: number) {
          try {
            const res = await fetch("/api/rewards/payout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerAddress: this.account, eventType, wave, score: this.score }),
            })
            const data = await res.json()
            if (data.success && data.rewardOCT) {
              // Show reward toast via DOM event (can't use React hooks in Phaser)
              window.dispatchEvent(new CustomEvent("gameReward", { detail: { amount: data.rewardOCT, eventType } }))
            }
          } catch { }
        }

        private async gameOver() {
          if (this.isGameOverTriggered) return
          this.isGameOverTriggered = true

          // Final sync push to notify others
          if (this.mode === "MULTIPLAYER") {
            await this.syncPush()
          }

          if (this.bgMusic) this.bgMusic.stop()
          if (this.onGameEnd) {
            this.onGameEnd(this.score, this.wave)
          }
          this.scene.stop()
        }
      }

      // Create UIScene class
      class UIScene extends Phaser.Scene {
        private scoreText?: Phaser.GameObjects.Text
        private waveText?: Phaser.GameObjects.Text
        private hpBarBg?: Phaser.GameObjects.Rectangle
        private hpBarFill?: Phaser.GameObjects.Rectangle
        private hpText?: Phaser.GameObjects.Text
        private hpLabel?: Phaser.GameObjects.Text

        constructor() {
          super({ key: 'UIScene' })
        }

        create() {
          const width = this.cameras.main.width
          const height = this.cameras.main.height

          // Score — top left
          this.scoreText = this.add.text(16, 16, "SCORE: 0", {
            fontSize: "22px", fontFamily: "monospace", color: "#22d3ee", fontStyle: "bold",
            stroke: "#000", strokeThickness: 4,
          })

          // Wave — top right
          this.waveText = this.add.text(width - 16, 16, "WAVE 1", {
            fontSize: "22px", fontFamily: "monospace", color: "#c084fc", fontStyle: "bold",
            stroke: "#000", strokeThickness: 4,
          }).setOrigin(1, 0)

          // Health bar — bottom left, prominent
          const barX = 16, barY = height - 28, barW = 220, barH = 18
          this.add.rectangle(barX, barY, barW + 4, barH + 4, 0x000000, 0.7).setOrigin(0, 0.5)
          this.hpBarBg = this.add.rectangle(barX + 2, barY, barW, barH, 0x1e293b).setOrigin(0, 0.5)
          this.hpBarFill = this.add.rectangle(barX + 2, barY, barW, barH, 0x22d3ee).setOrigin(0, 0.5)

          this.hpLabel = this.add.text(barX, barY - 14, "HULL INTEGRITY", {
            fontSize: "10px", fontFamily: "monospace", color: "#94a3b8",
          })
          this.hpText = this.add.text(barX + barW + 8, barY, "100%", {
            fontSize: "13px", fontFamily: "monospace", color: "#22d3ee", fontStyle: "bold",
          }).setOrigin(0, 0.5)

          const gameScene = this.scene.get("GameScene")

          gameScene.events.on("updateScore", (score: number) => {
            if (this.scoreText) this.scoreText.setText(`SCORE: ${score.toLocaleString()}`)
          })
          gameScene.events.on("updateWave", (wave: number) => {
            if (this.waveText) this.waveText.setText(`WAVE ${wave}`)
          })
          gameScene.events.on("updateHealth", (health: number, maxHealth: number) => {
            const pct = Math.max(0, health / maxHealth)
            const barW = 220
            if (this.hpBarFill) {
              this.hpBarFill.setSize(Math.round(barW * pct), 18)
              const color = pct > 0.6 ? 0x22d3ee : pct > 0.3 ? 0xfbbf24 : 0xef4444
              this.hpBarFill.setFillStyle(color)
            }
            if (this.hpText) this.hpText.setText(`${Math.round(pct * 100)}%`)
          })

          this.add.text(width / 2, height - 14, "ARROWS: Move  |  SPACE: Fire  |  Defeat bosses for OCT rewards!", {
            fontSize: "11px", fontFamily: "monospace", color: "#475569", align: "center",
          }).setOrigin(0.5)
        }
      }


      if (!isMounted) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#000000',
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [
          new GameScene(selectedShip, account, mode || "SOLO", playerCount ?? 1, roomId ?? "", isCreator ?? false, onGameEnd),
          new UIScene()
        ],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      gameRef.current = new Phaser.Game(config)

      const handleResize = () => {
        if (gameRef.current) {
          gameRef.current.scale.resize(window.innerWidth, window.innerHeight)
        }
      }

      window.addEventListener("resize", handleResize)
      cleanupResize = () => window.removeEventListener("resize", handleResize)
    }

    initGame()

    return () => {
      isMounted = false
      if (cleanupResize) cleanupResize()
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [selectedShip, account, onGameEnd])

  return <div ref={gameContainerRef} className="w-full h-screen bg-black" />
}
