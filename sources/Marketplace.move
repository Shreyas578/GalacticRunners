module galactic_runners::marketplace {
    use one::object::{Self, UID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    use one::coin::{Self as coin, Coin};
    use one::oct::OCT;
    use one::table::{Self as table, Table};
    use galactic_runners::spaceship::{Self as spaceship, Spaceship};
    
    use one::dynamic_object_field as dof;
    use one::event;
    
    /// Error codes
    const E_NOT_LISTED: u64 = 1;
    const E_ALREADY_LISTED: u64 = 2;
    const E_NOT_OWNER: u64 = 3;
    const E_INSUFFICIENT_FUNDS: u64 = 4;
    const E_INVALID_PRICE: u64 = 5;
    
    /// Platform fee percentage (5%)
    const PLATFORM_FEE_PERCENTAGE: u64 = 5;
    
    /// Events
    struct ListingEvent has copy, drop {
        listing_id: u64,
        seller: address,
        price: u64,
    }

    struct BuyEvent has copy, drop {
        listing_id: u64,
        buyer: address,
        price: u64,
    }

    struct CancelEvent has copy, drop {
        listing_id: u64,
        seller: address,
    }
    
    /// Listing structure
    struct Listing has store, drop {
        seller: address,
        spaceship_id: u64,
        price: u64,
    }
    
    /// Marketplace state
    struct Marketplace has key {
        id: UID,
        listings: Table<u64, Listing>, // spaceship_id -> Listing
        total_volume: u64,
        platform_fees: u64,
    }
    
    /// Initialize marketplace
    public entry fun initialize(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            listings: table::new(ctx),
            total_volume: 0,
            platform_fees: 0,
        };
        transfer::share_object(marketplace);
    }
    
    /// List a spaceship for sale
    public entry fun list_spaceship(
        marketplace: &mut Marketplace,
        spaceship: Spaceship,
        price: u64,
        ctx: &mut TxContext
    ) {
        assert!(price > 0, E_INVALID_PRICE);
        let ship_id = spaceship::get_ship_id(&spaceship);
        let sender = tx_context::sender(ctx);
        
        // Verify ownership
        assert!(spaceship::is_owner(&spaceship, sender), E_NOT_OWNER);
        assert!(!table::contains(&marketplace.listings, ship_id), E_ALREADY_LISTED);
        
        let listing = Listing {
            seller: sender,
            spaceship_id: ship_id,
            price,
        };
        table::add(&mut marketplace.listings, ship_id, listing);
        
        // Transfer spaceship to marketplace using Dynamic Object Field
        dof::add(&mut marketplace.id, ship_id, spaceship);

        // Emit event
        event::emit(ListingEvent {
            listing_id: ship_id,
            seller: sender,
            price,
        });
    }
    
    /// Cancel a listing
    public entry fun cancel_listing(
        marketplace: &mut Marketplace,
        listing_id: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&marketplace.listings, listing_id), E_NOT_LISTED);
        
        let listing = table::remove(&mut marketplace.listings, listing_id);
        assert!(listing.seller == sender, E_NOT_OWNER);
        
        // Return spaceship to seller
        let spaceship = dof::remove<u64, Spaceship>(&mut marketplace.id, listing_id);
        transfer::public_transfer(spaceship, sender);

        event::emit(CancelEvent {
            listing_id,
            seller: sender,
        });
    }
    
    /// Buy a spaceship
    public entry fun buy_spaceship(
        marketplace: &mut Marketplace,
        listing_id: u64,
        payment: Coin<OCT>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        
        assert!(table::contains(&marketplace.listings, listing_id), E_NOT_LISTED);

        let listing = table::remove(&mut marketplace.listings, listing_id);
        let payment_value = coin::value(&payment);
        assert!(payment_value >= listing.price, E_INSUFFICIENT_FUNDS);
        
        // Calculate platform fee (5%)
        let fee = (listing.price * PLATFORM_FEE_PERCENTAGE) / 100;
        let seller_amount = listing.price - fee;
        
        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + listing.price;
        marketplace.platform_fees = marketplace.platform_fees + fee;
        
        // Split payment
        let fee_coin = coin::split(&mut payment, fee, ctx);
        let seller_coin = coin::split(&mut payment, seller_amount, ctx);
        
        // Transfer payments
        transfer::public_transfer(seller_coin, listing.seller);
        transfer::public_transfer(fee_coin, @galactic_runners); // Platform fee
        
        // Return any excess payment to buyer
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            coin::destroy_zero(payment);
        };
        
        // Transfer spaceship to buyer
        let spaceship = dof::remove<u64, Spaceship>(&mut marketplace.id, listing_id);
        spaceship::set_owner(&mut spaceship, buyer); // Update owner field
        transfer::public_transfer(spaceship, buyer);

        event::emit(BuyEvent {
            listing_id,
            buyer,
            price: listing.price,
        });
    }
    
    /// Get listing price
    public fun get_listing_price(marketplace: &Marketplace, ship_id: u64): (bool, u64) {
        if (table::contains(&marketplace.listings, ship_id)) {
            let listing = table::borrow(&marketplace.listings, ship_id);
            (true, listing.price)
        } else {
            (false, 0)
        }
    }
    
    /// Get total volume
    public fun get_total_volume(marketplace: &Marketplace): u64 {
        marketplace.total_volume
    }

    // ==================== Tests ====================
    #[test_only]
    use one::test_scenario;
    #[test_only]
    use one::test_utils;
    #[test_only]
    use galactic_runners::spaceship;

    #[test]
    fun test_marketplace_init() {
        let admin = @0xAD;

        // First transaction to initialize marketplace
        let mut scenario = test_scenario::begin(admin);
        {
            initialize(scenario.ctx());
        };

        // Second transaction to verify marketplace was created
        scenario.next_tx(admin);
        {
            let marketplace = scenario.take_shared<Marketplace>();
            assert!(marketplace.total_volume == 0, 1);
            assert!(marketplace.platform_fees == 0, 2);
            test_scenario::return_shared(marketplace);
        };
        scenario.end();
    }

    #[test]
    fun test_list_spaceship() {
        let seller = @0xCAFE;

        // Initialize marketplace and spaceship counter
        let mut scenario = test_scenario::begin(seller);
        {
            initialize(scenario.ctx());
            spaceship::initialize(scenario.ctx());
        };

        // Mint a spaceship
        scenario.next_tx(seller);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 0, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        // List the spaceship
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            let ship_id = spaceship::get_ship_id(&spaceship);
            
            list_spaceship(&mut marketplace, spaceship, 1000, scenario.ctx());
            
            // Verify listing exists
            let (exists, price) = get_listing_price(&marketplace, ship_id);
            assert!(exists, 1);
            assert!(price == 1000, 2);
            
            test_scenario::return_shared(marketplace);
        };
        scenario.end();
    }

    #[test]
    fun test_cancel_listing() {
        let seller = @0xCAFE;

        // Setup: Initialize and list spaceship
        let mut scenario = test_scenario::begin(seller);
        {
            initialize(scenario.ctx());
            spaceship::initialize(scenario.ctx());
        };

        scenario.next_tx(seller);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 1, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        let listing_id: u64;
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            listing_id = spaceship::get_ship_id(&spaceship);
            
            list_spaceship(&mut marketplace, spaceship, 2000, scenario.ctx());
            test_scenario::return_shared(marketplace);
        };

        // Cancel the listing
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            cancel_listing(&mut marketplace, listing_id, scenario.ctx());
            
            // Verify listing removed
            let (exists, _) = get_listing_price(&marketplace, listing_id);
            assert!(!exists, 1);
            
            test_scenario::return_shared(marketplace);
        };

        // Verify spaceship returned to seller
        scenario.next_tx(seller);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            assert!(spaceship::get_ship_id(&spaceship) == listing_id, 2);
            scenario.return_to_sender(spaceship);
        };
        scenario.end();
    }

    #[test]
    fun test_buy_spaceship() {
        let seller = @0xCAFE;
        let buyer = @0xFACE;
        let price: u64 = 1000000; // 1,000,000 OCT

        // Setup: Initialize marketplace and mint spaceship
        let mut scenario = test_scenario::begin(seller);
        {
            initialize(scenario.ctx());
            spaceship::initialize(scenario.ctx());
        };

        scenario.next_tx(seller);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 0, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        // Seller lists spaceship
        let listing_id: u64;
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            listing_id = spaceship::get_ship_id(&spaceship);
            
            list_spaceship(&mut marketplace, spaceship, price, scenario.ctx());
            test_scenario::return_shared(marketplace);
        };

        // Buyer purchases spaceship
        scenario.next_tx(buyer);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            
            // Create payment coin for buyer
            let payment = coin::mint_for_testing<OCT>(price, scenario.ctx());
            
            buy_spaceship(&mut marketplace, listing_id, payment, scenario.ctx());
            
            // Verify marketplace stats updated
            assert!(marketplace.total_volume == price, 1);
            
            // Platform fee is 5%
            let expected_fee = (price * PLATFORM_FEE_PERCENTAGE) / 100;
            assert!(marketplace.platform_fees == expected_fee, 2);
            
            // Verify listing removed
            let (exists, _) = get_listing_price(&marketplace, listing_id);
            assert!(!exists, 3);
            
            test_scenario::return_shared(marketplace);
        };

        // Verify buyer received spaceship
        scenario.next_tx(buyer);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            assert!(spaceship::get_ship_id(&spaceship) == listing_id, 4);
            assert!(spaceship::is_owner(&spaceship, buyer), 5);
            scenario.return_to_sender(spaceship);
        };

        // Verify seller received payment (price - 5% fee)
        scenario.next_tx(seller);
        {
            let seller_payment = scenario.take_from_sender<Coin<OCT>>();
            let expected_amount = price - ((price * PLATFORM_FEE_PERCENTAGE) / 100);
            assert!(coin::value(&seller_payment) == expected_amount, 6);
            test_utils::destroy(seller_payment);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = E_INSUFFICIENT_FUNDS)]
    fun test_buy_insufficient_funds() {
        let seller = @0xCAFE;
        let buyer = @0xFACE;
        let price: u64 = 1000000;

        // Setup and list spaceship
        let mut scenario = test_scenario::begin(seller);
        {
            initialize(scenario.ctx());
            spaceship::initialize(scenario.ctx());
        };

        scenario.next_tx(seller);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 2, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        let listing_id: u64;
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            listing_id = spaceship::get_ship_id(&spaceship);
            
            list_spaceship(&mut marketplace, spaceship, price, scenario.ctx());
            test_scenario::return_shared(marketplace);
        };

        // Buyer tries to purchase with insufficient funds
        scenario.next_tx(buyer);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            
            // Only half the price!
            let payment = coin::mint_for_testing<OCT>(price / 2, scenario.ctx());
            
            // This should abort with E_INSUFFICIENT_FUNDS
            buy_spaceship(&mut marketplace, listing_id, payment, scenario.ctx());
            
            test_scenario::return_shared(marketplace);
        };
        scenario.end();
    }

    #[test]
    fun test_buy_with_excess_payment() {
        let seller = @0xCAFE;
        let buyer = @0xFACE;
        let price: u64 = 1000000;
        let payment_amount: u64 = 1500000; // 50% extra

        // Setup and list spaceship
        let mut scenario = test_scenario::begin(seller);
        {
            initialize(scenario.ctx());
            spaceship::initialize(scenario.ctx());
        };

        scenario.next_tx(seller);
        {
            let mut counter = scenario.take_shared<spaceship::SpaceshipCounter>();
            spaceship::mint_spaceship(&mut counter, 3, scenario.ctx());
            test_scenario::return_shared(counter);
        };

        let listing_id: u64;
        scenario.next_tx(seller);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let spaceship = scenario.take_from_sender<Spaceship>();
            listing_id = spaceship::get_ship_id(&spaceship);
            
            list_spaceship(&mut marketplace, spaceship, price, scenario.ctx());
            test_scenario::return_shared(marketplace);
        };

        // Buyer purchases with excess payment
        scenario.next_tx(buyer);
        {
            let mut marketplace = scenario.take_shared<Marketplace>();
            let payment = coin::mint_for_testing<OCT>(payment_amount, scenario.ctx());
            
            buy_spaceship(&mut marketplace, listing_id, payment, scenario.ctx());
            test_scenario::return_shared(marketplace);
        };

        // Verify buyer received spaceship AND change
        scenario.next_tx(buyer);
        {
            let spaceship = scenario.take_from_sender<Spaceship>();
            scenario.return_to_sender(spaceship);
            
            // Check if buyer received change
            let change = scenario.take_from_sender<Coin<OCT>>();
            let expected_change = payment_amount - price;
            assert!(coin::value(&change) == expected_change, 1);
            test_utils::destroy(change);
        };

        scenario.end();
    }
}
