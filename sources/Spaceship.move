module galactic_runners::spaceship {
    use one::object::{Self, UID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    
    /// Ship types
    const SHIP_TYPE_PHOENIX: u8 = 0;
    const SHIP_TYPE_TITAN: u8 = 1;
    const SHIP_TYPE_VIPER: u8 = 2;
    const SHIP_TYPE_FALCON: u8 = 3;
    
    /// Spaceship structure
    struct Spaceship has key, store {
        id: UID,
        ship_id: u64,
        ship_type: u8,
        level: u64,
        experience: u64,
        wins: u64,
        score: u64,
        owner: address,
    }
    
    /// Global counter for ship IDs
    struct SpaceshipCounter has key {
        id: UID,
        counter: u64,
    }
    
    /// Initialize the module
    public entry fun initialize(ctx: &mut TxContext) {
        let counter = SpaceshipCounter {
            id: object::new(ctx),
            counter: 0,
        };
        transfer::share_object(counter);
    }
    
    /// Mint a new spaceship
    public entry fun mint_spaceship(
        counter: &mut SpaceshipCounter,
        ship_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(ship_type <= SHIP_TYPE_FALCON, 2);
        
        let ship_id = counter.counter;
        counter.counter = counter.counter + 1;
        
        let spaceship = Spaceship {
            id: object::new(ctx),
            ship_id,
            ship_type,
            level: 1,
            experience: 0,
            wins: 0,
            score: 0,
            owner: tx_context::sender(ctx),
        };
        transfer::public_transfer(spaceship, tx_context::sender(ctx));
    }
    
    /// Transfer spaceship to another address
    public entry fun transfer_spaceship(
        spaceship: Spaceship,
        recipient: address,
    ) {
        transfer::public_transfer(spaceship, recipient);
    }
    
    /// Update ship stats after gameplay
    public fun update_stats(
        spaceship: &mut Spaceship,
        add_experience: u64,
        add_wins: u64,
        add_score: u64,
    ) {
        spaceship.experience = spaceship.experience + add_experience;
        spaceship.wins = spaceship.wins + add_wins;
        spaceship.score = spaceship.score + add_score;
        
        // Level up every 1000 experience
        let new_level = (spaceship.experience / 1000) + 1;
        if (new_level > spaceship.level) {
            spaceship.level = new_level;
        }
    }
    
    /// Get ship ID
    public fun get_ship_id(spaceship: &Spaceship): u64 {
        spaceship.ship_id
    }
    
    /// Get ship type
    public fun get_ship_type(spaceship: &Spaceship): u8 {
        spaceship.ship_type
    }
    
    /// Get ship stats
    public fun get_stats(spaceship: &Spaceship): (u64, u64, u64, u64) {
        (spaceship.level, spaceship.experience, spaceship.wins, spaceship.score)
    }
    
    /// Get owner
    public fun get_owner(spaceship: &Spaceship): address {
        spaceship.owner
    }
    
    /// Update owner
    public fun set_owner(spaceship: &mut Spaceship, new_owner: address) {
        spaceship.owner = new_owner;
    }
    
    /// Check if address owns the spaceship
    public fun is_owner(spaceship: &Spaceship, addr: address): bool {
        spaceship.owner == addr
    }

    // ==================== Tests ====================
    #[test_only]
    use one::test_scenario;
    #[test_only]
    use std::debug;

    #[test]
    fun test_spaceship_create() {
        // Create a dummy TxContext for testing
        let mut ctx = tx_context::dummy();

        // Create a spaceship
        let spaceship = Spaceship {
            id: object::new(&mut ctx),
            ship_id: 42,
            ship_type: SHIP_TYPE_PHOENIX,
            level: 1,
            experience: 0,
            wins: 0,
            score: 0,
            owner: tx_context::sender(&ctx),
        };

        // Check if accessor functions return correct values
        assert!(spaceship.get_ship_id() == 42, 1);
        assert!(spaceship.get_ship_type() == SHIP_TYPE_PHOENIX, 2);
        let (level, experience, wins, score) = spaceship.get_stats();
        assert!(level == 1 && experience == 0 && wins == 0 && score == 0, 3);

        // Transfer to dummy address to satisfy Move's safety
        let dummy_address = @0xCAFE;
        transfer::public_transfer(spaceship, dummy_address);
    }

    #[test]
    fun test_spaceship_transactions() {
        // Create test addresses representing users
        let initial_owner = @0xCAFE;
        let final_owner = @0xFACE;
        let admin = @0xAD;

        // First transaction: Initialize counter and mint spaceship
        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        // Second transaction: Admin mints a spaceship
        scenario.next_tx(admin);
        {
            let mut counter = scenario.take_shared<SpaceshipCounter>();
            mint_spaceship(&mut counter, SHIP_TYPE_VIPER, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        // Third transaction: Admin transfers spaceship to initial owner
        scenario.next_tx(admin);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            transfer::public_transfer(spaceship, initial_owner);
        };

        // Fourth transaction: Initial owner transfers to final owner
        scenario.next_tx(initial_owner);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            transfer::public_transfer(spaceship, final_owner);
        };

        // Fifth transaction: Final owner verifies ownership and properties
        scenario.next_tx(final_owner);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            assert!(spaceship.get_ship_type() == SHIP_TYPE_VIPER, 1);
            assert!(spaceship.is_owner(final_owner), 2);
            scenario.return_to_sender(spaceship);
        };
        scenario.end();
    }

    #[test]
    fun test_module_init() {
        let admin = @0xAD;

        // First transaction to emulate module initialization
        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        // Second transaction to check if counter was created and initialized
        scenario.next_tx(admin);
        {
            let counter = scenario.take_shared<SpaceshipCounter>();
            assert!(counter.counter == 0, 1);
            test_scenario::return_shared(counter);
        };

        // Third transaction to mint a spaceship
        scenario.next_tx(admin);
        {
            let mut counter = scenario.take_shared<SpaceshipCounter>();
            mint_spaceship(&mut counter, SHIP_TYPE_PHOENIX, scenario.ctx());
            assert!(counter.counter == 1, 2);
            test_scenario::return_shared(counter);
        };

        // Fourth transaction to verify spaceship was created
        scenario.next_tx(admin);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            assert!(spaceship.get_ship_id() == 0, 3);
            assert!(spaceship.get_ship_type() == SHIP_TYPE_PHOENIX, 4);
            scenario.return_to_sender(spaceship);
        };
        scenario.end();
    }

    #[test]
    fun test_stats_update() {
        let mut ctx = tx_context::dummy();

        // Create a spaceship
        let mut spaceship = Spaceship {
            id: object::new(&mut ctx),
            ship_id: 1,
            ship_type: SHIP_TYPE_TITAN,
            level: 1,
            experience: 0,
            wins: 0,
            score: 0,
            owner: tx_context::sender(&ctx),
        };

        // Update stats with some experience (not enough to level up)
        update_stats(&mut spaceship, 500, 1, 100);
        let (level, experience, wins, score) = get_stats(&spaceship);
        assert!(level == 1, 1);
        assert!(experience == 500, 2);
        assert!(wins == 1, 3);
        assert!(score == 100, 4);

        // Update stats to trigger level up (1000 XP total)
        update_stats(&mut spaceship, 500, 2, 200);
        let (level, experience, wins, score) = get_stats(&spaceship);
        assert!(level == 2, 5);
        assert!(experience == 1000, 6);
        assert!(wins == 3, 7);
        assert!(score == 300, 8);

        // Update to level 3 (2000 XP total)
        update_stats(&mut spaceship, 1000, 5, 500);
        let (level, experience, wins, score) = get_stats(&spaceship);
        assert!(level == 3, 9);
        assert!(experience == 2000, 10);
        assert!(wins == 8, 11);
        assert!(score == 800, 12);

        // Clean up
        transfer::public_transfer(spaceship, @0xCAFE);
    }
}