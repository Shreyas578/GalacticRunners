module galactic_runners::bossdrop {
    use one::object::{Self, UID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;

    /// Boss types
    const BOSS_TYPE_VOID_LEVIATHAN: u8 = 0;
    const BOSS_TYPE_NEBULA_TYRANT: u8 = 1;
    const BOSS_TYPE_COSMIC_SERPENT: u8 = 2;
    const BOSS_TYPE_STAR_DESTROYER: u8 = 3;

    /// Boss drop structure
    struct BossDrop has key, store {
        id: UID,
        drop_id: u64,
        boss_type: u8,
        rarity: u8,
        owner: address,
    }

    /// Global counter for drop IDs
    struct BossDropCounter has key {
        id: UID,
        counter: u64,
    }

    /// Initialize the module
    public entry fun initialize(ctx: &mut TxContext) {
        let counter = BossDropCounter {
            id: object::new(ctx),
            counter: 0,
        };
        transfer::share_object(counter);
    }

    /// Mint a new boss drop
    public fun mint_boss_drop(
        counter: &mut BossDropCounter,
        boss_type: u8,
        rarity: u8,
        ctx: &mut TxContext
    ): BossDrop {
        assert!(boss_type <= BOSS_TYPE_STAR_DESTROYER, 1);
        assert!(rarity >= 1 && rarity <= 5, 2);

        let drop_id = counter.counter;
        counter.counter = counter.counter + 1;

        BossDrop {
            id: object::new(ctx),
            drop_id,
            boss_type,
            rarity,
            owner: tx_context::sender(ctx),
        }
    }

    /// Claim a boss drop after defeating a boss
    public entry fun claim_boss_drop(
        counter: &mut BossDropCounter,
        boss_type: u8,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let boss_drop = mint_boss_drop(counter, boss_type, rarity, ctx);
        transfer::public_transfer(boss_drop, tx_context::sender(ctx));
    }

    /// Transfer boss drop to another address
    public entry fun transfer_boss_drop(
        boss_drop: BossDrop,
        recipient: address,
    ) {
        transfer::public_transfer(boss_drop, recipient);
    }

    /// Get drop ID
    public fun get_drop_id(boss_drop: &BossDrop): u64 {
        boss_drop.drop_id
    }

    /// Get boss type
    public fun get_boss_type(boss_drop: &BossDrop): u8 {
        boss_drop.boss_type
    }

    /// Get rarity
    public fun get_rarity(boss_drop: &BossDrop): u8 {
        boss_drop.rarity
    }

    /// Get owner
    public fun get_owner(boss_drop: &BossDrop): address {
        boss_drop.owner
    }

    /// Update owner
    public fun set_owner(boss_drop: &mut BossDrop, new_owner: address) {
        boss_drop.owner = new_owner;
    }

    // ==================== Tests ====================
    #[test_only]
    use one::test_scenario;

    #[test]
    fun test_bossdrop_init() {
        let admin = @0xAD;

        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        // Verify counter was created
        scenario.next_tx(admin);
        {
            let counter = scenario.take_shared<BossDropCounter>();
            assert!(counter.counter == 0, 1);
            test_scenario::return_shared(counter);
        };
        scenario.end();
    }

    #[test]
    fun test_mint_boss_drop() {
        let admin = @0xAD;

        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        // Mint a boss drop
        scenario.next_tx(admin);
        {
            let mut counter = scenario.take_shared<BossDropCounter>();
            let boss_drop = mint_boss_drop(&mut counter, BOSS_TYPE_VOID_LEVIATHAN, 5, scenario.ctx());
            
            assert!(get_drop_id(&boss_drop) == 0, 1);
            assert!(get_boss_type(&boss_drop) == BOSS_TYPE_VOID_LEVIATHAN, 2);
            assert!(get_rarity(&boss_drop) == 5, 3);
            assert!(get_owner(&boss_drop) == admin, 4);
            assert!(counter.counter == 1, 5);
            
            transfer::public_transfer(boss_drop, admin);
            test_scenario::return_shared(counter);
        };

        // Verify boss drop was received
        scenario.next_tx(admin);
        {
            let boss_drop = scenario.take_from_sender<BossDrop>();
            scenario.return_to_sender(boss_drop);
        };
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_invalid_boss_type() {
        let admin = @0xAD;

        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let mut counter = scenario.take_shared<BossDropCounter>();
            // Try to mint with invalid boss type (max is 3)
            let boss_drop = mint_boss_drop(&mut counter, 99, 3, scenario.ctx());
            
            transfer::public_transfer(boss_drop, admin);
            test_scenario::return_shared(counter);
        };
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 2)]
    fun test_invalid_rarity() {
        let admin = @0xAD;

        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let mut counter = scenario.take_shared<BossDropCounter>();
            // Try to mint with invalid rarity (must be 1-5)
            let boss_drop = mint_boss_drop(&mut counter, BOSS_TYPE_NEBULA_TYRANT, 0, scenario.ctx());
            
            transfer::public_transfer(boss_drop, admin);
            test_scenario::return_shared(counter);
        };
        scenario.end();
    }
}