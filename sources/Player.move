module galactic_runners::player {
    use one::object::{Self, UID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    use one::table::{Self as table, Table};
    use galactic_runners::spaceship::{Self as spaceship, Spaceship};
    use galactic_runners::bossdrop::{Self as bossdrop, BossDrop};
    
    /// Player stats structure
    struct PlayerStats has key {
        id: UID,
        owner: address,
        total_games: u64,
        total_wins: u64,
        total_score: u64,
        highest_wave: u64,
        spaceships_owned: Table<u64, bool>, // ship_id -> exists
        boss_drops_owned: Table<u64, bool>, // drop_id -> exists
    }
    
    /// Initialize player stats
    public entry fun initialize_player(ctx: &mut TxContext) {
        let stats = PlayerStats {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            total_games: 0,
            total_wins: 0,
            total_score: 0,
            highest_wave: 0,
            spaceships_owned: table::new(ctx),
            boss_drops_owned: table::new(ctx),
        };
        transfer::transfer(stats, tx_context::sender(ctx));
    }
    
    /// Update player stats after game
    public fun update_game_stats(
        stats: &mut PlayerStats,
        score: u64,
        wave: u64,
        won: bool,
    ) {
        stats.total_games = stats.total_games + 1;
        stats.total_score = stats.total_score + score;
        
        if (won) {
            stats.total_wins = stats.total_wins + 1;
        };
        
        if (wave > stats.highest_wave) {
            stats.highest_wave = wave;
        };
    }
    
    /// Add spaceship to player inventory
    public fun add_spaceship(
        stats: &mut PlayerStats,
        spaceship: &Spaceship,
    ) {
        let ship_id = spaceship::get_ship_id(spaceship);
        if (!table::contains(&stats.spaceships_owned, ship_id)) {
            table::add(&mut stats.spaceships_owned, ship_id, true);
        };
    }
    
    /// Add boss drop to player inventory
    public fun add_boss_drop(
        stats: &mut PlayerStats,
        boss_drop: &BossDrop,
    ) {
        let drop_id = bossdrop::get_drop_id(boss_drop);
        if (!table::contains(&stats.boss_drops_owned, drop_id)) {
            table::add(&mut stats.boss_drops_owned, drop_id, true);
        };
    }
    
    /// Get player stats
    public fun get_stats(stats: &PlayerStats): (u64, u64, u64, u64) {
        (stats.total_games, stats.total_wins, stats.total_score, stats.highest_wave)
    }
    
    /// Get number of spaceships owned
    public fun get_spaceship_count(stats: &PlayerStats): u64 {
        table::length(&stats.spaceships_owned)
    }
    
    /// Get number of boss drops owned
    public fun get_boss_drop_count(stats: &PlayerStats): u64 {
        table::length(&stats.boss_drops_owned)
    }
    
    /// Check if player owns a spaceship
    public fun owns_spaceship(stats: &PlayerStats, ship_id: u64): bool {
        table::contains(&stats.spaceships_owned, ship_id)
    }
    
    /// Check if player owns a boss drop
    public fun owns_boss_drop(stats: &PlayerStats, drop_id: u64): bool {
        table::contains(&stats.boss_drops_owned, drop_id)
    }

    // ==================== Tests ====================
    #[test_only]
    use one::test_scenario;

    #[test]
    fun test_player_init() {
        let player = @0xCAFE;

        let mut scenario = test_scenario::begin(player);
        {
            initialize_player(scenario.ctx());
        };

        // Verify player stats were created with initial values
        scenario.next_tx(player);
        {
            let stats = scenario.take_from_sender<PlayerStats>();
            let (total_games, total_wins, total_score, highest_wave) = get_stats(&stats);
            
            assert!(total_games == 0, 1);
            assert!(total_wins == 0, 2);
            assert!(total_score == 0, 3);
            assert!(highest_wave == 0, 4);
            assert!(get_spaceship_count(&stats) == 0, 5);
            assert!(get_boss_drop_count(&stats) == 0, 6);
            
            scenario.return_to_sender(stats);
        };
        scenario.end();
    }

    #[test]
    fun test_update_game_stats() {
        let player = @0xCAFE;

        let mut scenario = test_scenario::begin(player);
        {
            initialize_player(scenario.ctx());
        };

        // Update stats after first game
        scenario.next_tx(player);
        {
            let mut stats = scenario.take_from_sender<PlayerStats>();
            update_game_stats(&mut stats, 1000, 5, true);
            
            let (total_games, total_wins, total_score, highest_wave) = get_stats(&stats);
            assert!(total_games == 1, 1);
            assert!(total_wins == 1, 2);
            assert!(total_score == 1000, 3);
            assert!(highest_wave == 5, 4);
            
            scenario.return_to_sender(stats);
        };

        // Update stats after second game (lost, higher wave)
        scenario.next_tx(player);
        {
            let mut stats = scenario.take_from_sender<PlayerStats>();
            update_game_stats(&mut stats, 1500, 7, false);
            
            let (total_games, total_wins, total_score, highest_wave) = get_stats(&stats);
            assert!(total_games == 2, 5);
            assert!(total_wins == 1, 6); // Still 1 win
            assert!(total_score == 2500, 7);
            assert!(highest_wave == 7, 8); // Updated to higher wave
            
            scenario.return_to_sender(stats);
        };
        scenario.end();
    }

    #[test]
    fun test_inventory_tracking() {
        let player = @0xCAFE;

        let mut scenario = test_scenario::begin(player);
        {
            initialize_player(scenario.ctx());
            spaceship::initialize(scenario.ctx());
            bossdrop::initialize(scenario.ctx());
        };

        // Mint a spaceship
        scenario.next_tx(player);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 0, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        // Add spaceship to inventory
        scenario.next_tx(player);
        {
            let mut stats = scenario.take_from_sender<PlayerStats>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            let ship_id = spaceship::get_ship_id(&spaceship);
            
            add_spaceship(&mut stats, &spaceship);
            assert!(owns_spaceship(&stats, ship_id), 1);
            assert!(get_spaceship_count(&stats) == 1, 2);
            
            scenario.return_to_sender(stats);
            scenario.return_to_sender(spaceship);
        };

        // Mint a boss drop
        scenario.next_tx(player);
        {
            let mut counter = scenario.take_shared<bossdrop::BossDropCounter>();
            let boss_drop = bossdrop::mint_boss_drop(&mut counter, 0, 3, scenario.ctx());
            transfer::public_transfer(boss_drop, player);
            test_scenario::return_shared(counter);
        };

        // Add boss drop to inventory
        scenario.next_tx(player);
        {
            let mut stats = scenario.take_from_sender<PlayerStats>();
            let boss_drop = scenario.take_from_sender<BossDrop>();
            let drop_id = bossdrop::get_drop_id(&boss_drop);
            
            add_boss_drop(&mut stats, &boss_drop);
            assert!(owns_boss_drop(&stats, drop_id), 3);
            assert!(get_boss_drop_count(&stats) == 1, 4);
            
            scenario.return_to_sender(stats);
            scenario.return_to_sender(boss_drop);
        };
        scenario.end();
    }
}