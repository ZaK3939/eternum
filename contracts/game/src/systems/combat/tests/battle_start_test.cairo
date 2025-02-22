use core::array::SpanTrait;

use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo_cairo_test::{NamespaceDef, TestResource, ContractDefTrait};
use s1_eternum::alias::ID;
use s1_eternum::constants::{WORLD_CONFIG_ID, ARMY_ENTITY_TYPE, TickIds};
use s1_eternum::models::combat::{
    Army, Health, HealthTrait, Troops, TroopsTrait, BattleSide, Protectee, Protector, Battle
};
use s1_eternum::models::config::{
    TroopConfig, TickConfig, CapacityConfig, CapacityConfigCategory, SpeedConfig, SettlementConfig
};
use s1_eternum::models::movable::{Movable};
use s1_eternum::models::owner::{Owner, EntityOwner};
use s1_eternum::models::position::{Coord, Position};

use s1_eternum::models::resource::resource::{
    Resource, ResourceImpl, ResourceTrait, ResourceTypes, ResourceTransferLock, ResourceTransferLockTrait,
    RESOURCE_PRECISION
};
use s1_eternum::models::stamina::Stamina;
use s1_eternum::systems::config::contracts::config_systems;
use s1_eternum::systems::{
    realm::contracts::{realm_systems, IRealmSystemsDispatcher, IRealmSystemsDispatcherTrait},
    combat::contracts::battle_systems::{battle_systems, IBattleContractDispatcher, IBattleContractDispatcherTrait},
    combat::contracts::troop_systems::{troop_systems, ITroopContractDispatcher, ITroopContractDispatcherTrait},
};
use s1_eternum::utils::testing::{
    config::{get_combat_config, set_capacity_config, set_settlement_config}, world::spawn_eternum,
    systems::{deploy_realm_systems, deploy_system, deploy_battle_systems, deploy_troop_systems},
    general::{mint, teleport, spawn_realm}
};
use starknet::ContractAddress;
use starknet::contract_address_const;
use traits::Into;

const DEFAULT_BLOCK_TIMESTAMP: u64 = 3000;
const PLAYER_1_REALM_OWNER: felt252 = 'player_1_realm_owner';
const PLAYER_2_REALM_OWNER: felt252 = 'player_2_realm_owner';
const PLAYER_3_REALM_OWNER: felt252 = 'player_3_realm_owner';

// attack army has significantly less troops so that defeat is easy
const PLAYER_1_STARTING_KNIGHT_COUNT: u128 = 3_000 * RESOURCE_PRECISION;
const PLAYER_1_STARTING_PALADIN_COUNT: u128 = 3_000 * RESOURCE_PRECISION;
const PLAYER_1_STARTING_CROSSBOWMAN_COUNT: u128 = 3_000 * RESOURCE_PRECISION;

const PLAYER_2_STARTING_KNIGHT_COUNT: u128 = 1 * RESOURCE_PRECISION;
const PLAYER_2_STARTING_PALADIN_COUNT: u128 = 1 * RESOURCE_PRECISION;
const PLAYER_2_STARTING_CROSSBOWMAN_COUNT: u128 = 100 * RESOURCE_PRECISION;


const PLAYER_3_STARTING_KNIGHT_COUNT: u128 = 1 * RESOURCE_PRECISION;
const PLAYER_3_STARTING_PALADIN_COUNT: u128 = 1 * RESOURCE_PRECISION;
const PLAYER_3_STARTING_CROSSBOWMAN_COUNT: u128 = 100 * RESOURCE_PRECISION;

const ARMY_GOLD_RESOURCE_AMOUNT: u128 = 5_000 * RESOURCE_PRECISION;

const PLAYER_1_REALM_COORD_X: u32 = 2;
const PLAYER_1_REALM_COORD_Y: u32 = 3;

const PLAYER_2_REALM_COORD_X: u32 = 4;
const PLAYER_2_REALM_COORD_Y: u32 = 5;

const PLAYER_3_REALM_COORD_X: u32 = 6;
const PLAYER_3_REALM_COORD_Y: u32 = 7;

const BATTLE_COORD_X: u32 = 8;
const BATTLE_COORD_Y: u32 = 9;

fn battle_coord() -> Coord {
    Coord { x: BATTLE_COORD_X, y: BATTLE_COORD_Y, }
}

fn set_configurations(ref world: WorldStorage) {
    world.write_model_test(@get_combat_config());
    world
        .write_model_test(
            @TickConfig { config_id: WORLD_CONFIG_ID, tick_id: TickIds::ARMIES, tick_interval_in_seconds: 1 }
        );
    world
        .write_model_test(
            @SpeedConfig {
                config_id: WORLD_CONFIG_ID,
                speed_config_id: ARMY_ENTITY_TYPE,
                entity_type: ARMY_ENTITY_TYPE,
                sec_per_km: 200
            }
        );
}

fn setup() -> (WorldStorage, IBattleContractDispatcher, ID, ID, ID, ID, ID, ID) {
    let mut world = spawn_eternum();
    set_configurations(ref world);
    let battle_system_dispatcher = deploy_battle_systems(ref world);
    let troop_system_dispatcher = deploy_troop_systems(ref world);

    let config_systems_address = deploy_system(ref world, "config_systems");
    set_capacity_config(config_systems_address);
    set_settlement_config(config_systems_address);

    starknet::testing::set_block_timestamp(DEFAULT_BLOCK_TIMESTAMP);

    /// CREATE PLAYER_1 REALM AND BUY ARMY TROOPS
    //////////////////////////////////////////////

    starknet::testing::set_contract_address(contract_address_const::<PLAYER_1_REALM_OWNER>());
    let player_1_realm_id = spawn_realm(ref world, 1, Coord { x: 1, y: 1 });
    mint(
        ref world,
        player_1_realm_id,
        array![
            (ResourceTypes::KNIGHT, PLAYER_1_STARTING_KNIGHT_COUNT),
            (ResourceTypes::CROSSBOWMAN, PLAYER_1_STARTING_CROSSBOWMAN_COUNT),
            (ResourceTypes::PALADIN, PLAYER_1_STARTING_PALADIN_COUNT),
        ]
            .span()
    );

    let player_1_army_id = troop_system_dispatcher.army_create(player_1_realm_id, false);
    mint(ref world, player_1_army_id, array![(ResourceTypes::GOLD, ARMY_GOLD_RESOURCE_AMOUNT),].span());

    let player_1_troops = Troops {
        knight_count: PLAYER_1_STARTING_KNIGHT_COUNT.try_into().unwrap(),
        paladin_count: PLAYER_1_STARTING_PALADIN_COUNT.try_into().unwrap(),
        crossbowman_count: PLAYER_1_STARTING_CROSSBOWMAN_COUNT.try_into().unwrap(),
    };
    troop_system_dispatcher.army_buy_troops(player_1_army_id, player_1_realm_id, player_1_troops);

    /// CREATE PLAYER_2 REALM AND BUY ARMY TROOPS
    //////////////////////////////////////////////

    starknet::testing::set_contract_address(contract_address_const::<PLAYER_2_REALM_OWNER>());
    let player_2_realm_id = spawn_realm(ref world, 2, Coord { x: 2, y: 2 });
    mint(
        ref world,
        player_2_realm_id,
        array![
            (ResourceTypes::KNIGHT, PLAYER_2_STARTING_KNIGHT_COUNT),
            (ResourceTypes::CROSSBOWMAN, PLAYER_2_STARTING_CROSSBOWMAN_COUNT),
            (ResourceTypes::PALADIN, PLAYER_2_STARTING_PALADIN_COUNT),
        ]
            .span()
    );

    let player_2_army_id = troop_system_dispatcher.army_create(player_2_realm_id, false);
    mint(ref world, player_2_army_id, array![(ResourceTypes::GOLD, ARMY_GOLD_RESOURCE_AMOUNT),].span());

    let player_2_troops = Troops {
        knight_count: PLAYER_2_STARTING_KNIGHT_COUNT.try_into().unwrap(),
        paladin_count: PLAYER_2_STARTING_PALADIN_COUNT.try_into().unwrap(),
        crossbowman_count: PLAYER_2_STARTING_CROSSBOWMAN_COUNT.try_into().unwrap(),
    };
    troop_system_dispatcher.army_buy_troops(player_2_army_id, player_2_realm_id, player_2_troops);

    /// CREATE PLAYER_3 REALM AND BUY ARMY TROOPS
    //////////////////////////////////////////////

    starknet::testing::set_contract_address(contract_address_const::<PLAYER_3_REALM_OWNER>());
    let player_3_realm_id = spawn_realm(ref world, 3, Coord { x: 4, y: 4 });
    mint(
        ref world,
        player_3_realm_id,
        array![
            (ResourceTypes::KNIGHT, PLAYER_3_STARTING_KNIGHT_COUNT),
            (ResourceTypes::CROSSBOWMAN, PLAYER_3_STARTING_CROSSBOWMAN_COUNT),
            (ResourceTypes::PALADIN, PLAYER_3_STARTING_PALADIN_COUNT),
        ]
            .span()
    );

    let player_3_army_id = troop_system_dispatcher.army_create(player_3_realm_id, false);
    mint(ref world, player_3_army_id, array![(ResourceTypes::GOLD, ARMY_GOLD_RESOURCE_AMOUNT),].span());

    let player_3_troops = Troops {
        knight_count: PLAYER_3_STARTING_KNIGHT_COUNT.try_into().unwrap(),
        paladin_count: PLAYER_3_STARTING_PALADIN_COUNT.try_into().unwrap(),
        crossbowman_count: PLAYER_3_STARTING_CROSSBOWMAN_COUNT.try_into().unwrap(),
    };
    troop_system_dispatcher.army_buy_troops(player_3_army_id, player_3_realm_id, player_3_troops);

    // put player_1, player_2, player 3 army in the same location
    //////////////////////////////////////////////////////
    teleport(ref world, player_1_army_id, battle_coord());
    teleport(ref world, player_2_army_id, battle_coord());
    teleport(ref world, player_3_army_id, battle_coord());

    (
        world,
        battle_system_dispatcher,
        player_1_realm_id,
        player_2_realm_id,
        player_3_realm_id,
        player_1_army_id,
        player_2_army_id,
        player_3_army_id
    )
}


#[test]
fn combat_test_battle_start() {
    let (
        mut world,
        battle_system_dispatcher,
        _player_1_realm_id,
        _player_2_realm_id,
        _player_3_realm_id,
        player_1_army_id,
        player_2_army_id,
        _player_3_army_id
    ) =
        setup();

    //////////// START BATTLE ////////////////////
    starknet::testing::set_contract_address(contract_address_const::<PLAYER_1_REALM_OWNER>());
    starknet::testing::set_account_contract_address(contract_address_const::<PLAYER_1_REALM_OWNER>());
    // player 1 starts battle against player 2
    let battle_id = battle_system_dispatcher.battle_start(player_1_army_id, player_2_army_id);
    let battle: Battle = world.read_model(battle_id);
    assert_ne!(battle.duration_left, 0);

    let player_1_army: Army = world.read_model(player_1_army_id);
    let player_1_army_health: Health = world.read_model(player_1_army_id);
    let player_2_army: Army = world.read_model(player_2_army_id);
    let player_2_army_health: Health = world.read_model(player_2_army_id);

    assert_eq!(battle.attack_army.troops.count(), player_1_army.troops.count());
    assert_eq!(battle.attack_army_lifetime.troops.count(), player_1_army.troops.count());
    assert_eq!(battle.attack_army_health.current, player_1_army_health.current);
    assert_eq!(player_1_army.battle_id, battle_id);
    assert_eq!(player_1_army.battle_side, BattleSide::Attack);

    assert_eq!(battle.defence_army.troops.count(), player_2_army.troops.count());
    assert_eq!(battle.defence_army_lifetime.troops.count(), player_2_army.troops.count());
    assert_eq!(battle.defence_army_health.current, player_2_army_health.current);
    assert_eq!(player_2_army.battle_id, battle_id);
    assert_eq!(player_2_army.battle_side, BattleSide::Defence);

    // ensure player 1 gold resource still exists but it is locked
    let player_1_gold_resource: Resource = ResourceImpl::get(ref world, (player_1_army_id, ResourceTypes::GOLD));
    assert_eq!(ARMY_GOLD_RESOURCE_AMOUNT, player_1_gold_resource.balance);
    let player_1_resource_lock: ResourceTransferLock = world.read_model(player_1_army_id);
    player_1_resource_lock.assert_locked();

    // ensure player 2 gold resource still exists but it is locked
    let player_2_gold_resource: Resource = ResourceImpl::get(ref world, (player_2_army_id, ResourceTypes::GOLD));
    assert_eq!(ARMY_GOLD_RESOURCE_AMOUNT, player_2_gold_resource.balance);
    let player_2_resource_lock: ResourceTransferLock = world.read_model(player_2_army_id);
    player_2_resource_lock.assert_locked();
}

