use core::array::SpanTrait;


use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo_cairo_test::{NamespaceDef, TestResource, ContractDefTrait};
use s1_eternum::{
    alias::ID,
    models::{
        position::{Coord, Position}, weight::Weight, resource::resource::{ResourceTypes, RESOURCE_PRECISION},
        combat::{Troops}, quantity::Quantity, config::CapacityConfig
    },
    systems::{
        config::contracts::config_systems,
        combat::contracts::battle_systems::{
            battle_systems, IBattleContractDispatcher, IBattleContractDispatcherTrait, IBattlePillageContractDispatcher,
            IBattlePillageContractDispatcherTrait,
        },
        combat::contracts::troop_systems::{troop_systems, ITroopContractDispatcher, ITroopContractDispatcherTrait},
    },
    utils::testing::{
        world::spawn_eternum, general::{mint, teleport, spawn_realm, create_army_with_troops},
        systems::{
            deploy_system, deploy_realm_systems, deploy_battle_systems, deploy_battle_pillage_systems,
            deploy_troop_systems
        },
        config::{
            set_combat_config, setup_globals, set_stamina_config, set_capacity_config, set_speed_config,
            set_weight_config, set_travel_and_explore_stamina_cost_config, set_battle_config,
            set_travel_food_cost_config, set_settlement_config
        }
    },
};
use starknet::contract_address_const;


const DEFAULT_BLOCK_TIMESTAMP: u64 = 20_000;
const ATTACKER: felt252 = 'player1';
const DEFENDER: felt252 = 'player2';

const STARTING_KNIGHT_COUNT: u128 = 100 * RESOURCE_PRECISION;

const DEFENDER_REALM_COORD_X: u32 = 2;
const DEFENDER_REALM_COORD_Y: u32 = 3;

fn setup() -> (WorldStorage, IBattlePillageContractDispatcher, ID, ID) {
    let mut world = spawn_eternum();

    let config_systems_address = deploy_system(ref world, "config_systems");
    set_settlement_config(config_systems_address);
    set_combat_config(config_systems_address);
    setup_globals(config_systems_address);
    set_stamina_config(config_systems_address);
    set_capacity_config(config_systems_address);
    set_speed_config(config_systems_address);
    set_weight_config(config_systems_address);
    set_travel_and_explore_stamina_cost_config(config_systems_address);
    set_battle_config(config_systems_address);
    set_travel_food_cost_config(config_systems_address);

    let battle_pillage_system_dispatcher = deploy_battle_pillage_systems(ref world);
    let troop_system_dispatcher = deploy_troop_systems(ref world);

    starknet::testing::set_block_timestamp(DEFAULT_BLOCK_TIMESTAMP);

    // SPAWN ATTACKER REALM & ARMY
    starknet::testing::set_contract_address(contract_address_const::<ATTACKER>());
    let attacker_realm_entity_id = spawn_realm(ref world, 1, Coord { x: 1, y: 1 });

    mint(ref world, attacker_realm_entity_id, array![(ResourceTypes::KNIGHT, STARTING_KNIGHT_COUNT),].span());

    let attacking_troops = Troops {
        knight_count: STARTING_KNIGHT_COUNT.try_into().unwrap(), paladin_count: 0, crossbowman_count: 0,
    };

    let attacker_realm_army_unit_id = create_army_with_troops(
        ref world, troop_system_dispatcher, attacker_realm_entity_id, attacking_troops, false
    );

    // SPAWN DEFENDER REALM & DEFENSIVE ARMY
    starknet::testing::set_contract_address(contract_address_const::<DEFENDER>());

    let defender_realm_entity_id = spawn_realm(
        ref world, 2, Coord { x: DEFENDER_REALM_COORD_X, y: DEFENDER_REALM_COORD_Y }
    );

    mint(
        ref world,
        defender_realm_entity_id,
        array![
            (ResourceTypes::WOOD, 100_000),
            (ResourceTypes::STONE, 100_000),
            (ResourceTypes::COAL, 100_000),
            (ResourceTypes::COPPER, 100_000),
            (ResourceTypes::OBSIDIAN, 100_000),
            (ResourceTypes::SILVER, 100_000),
            (ResourceTypes::IRONWOOD, 100_000),
            (ResourceTypes::COLD_IRON, 100_000),
            (ResourceTypes::GOLD, 100_000),
            (ResourceTypes::HARTWOOD, 100_000),
            (ResourceTypes::DIAMONDS, 100_000),
            (ResourceTypes::SAPPHIRE, 100_000),
            (ResourceTypes::RUBY, 100_000),
            (ResourceTypes::DEEP_CRYSTAL, 100_000),
            (ResourceTypes::IGNIUM, 100_000),
            (ResourceTypes::ETHEREAL_SILICA, 100_000),
            (ResourceTypes::TRUE_ICE, 100_000),
            (ResourceTypes::TWILIGHT_QUARTZ, 100_000),
            (ResourceTypes::ALCHEMICAL_SILVER, 100_000),
            (ResourceTypes::ADAMANTINE, 100_000),
            (ResourceTypes::MITHRAL, 100_000),
            (ResourceTypes::DRAGONHIDE, 100_000),
            (ResourceTypes::DEMONHIDE, 100_000),
        ]
            .span()
    );

    let defender_position: Position = world.read_model(defender_realm_entity_id);
    teleport(ref world, attacker_realm_army_unit_id, Coord { x: defender_position.x, y: defender_position.y });

    (world, battle_pillage_system_dispatcher, attacker_realm_army_unit_id, defender_realm_entity_id)
}

#[test]
fn combat_test_battle_pillage__near_max_capacity() {
    let (mut world, battle_pillage_system_dispatcher, attacker_realm_army_unit_id, defender_realm_entity_id) = setup();

    starknet::testing::set_contract_address(contract_address_const::<ATTACKER>());

    let realm_pos: Position = world.read_model(defender_realm_entity_id);
    let army_pos: Position = world.read_model(attacker_realm_army_unit_id);
    assert_eq!(army_pos.x, realm_pos.x, "Army & realm not at same pos");
    assert_eq!(army_pos.y, realm_pos.y, "Army & realm not at same pos");

    let mut army_weight: Weight = world.read_model(attacker_realm_army_unit_id);
    world.write_model_test(@Weight { entity_id: attacker_realm_army_unit_id, value: 950_000 });
    let initial_army_weight = army_weight.value;
    assert_eq!(initial_army_weight, 0, "Initial army weight not correct");

    starknet::testing::set_block_timestamp(DEFAULT_BLOCK_TIMESTAMP * 2);

    let _army_quantity: Quantity = world.read_model(attacker_realm_army_unit_id);

    let _capacity_config: CapacityConfig = world.read_model(3);

    battle_pillage_system_dispatcher.battle_pillage(attacker_realm_army_unit_id, defender_realm_entity_id);

    let army_weight: Weight = world.read_model(attacker_realm_army_unit_id);
    let army_weight = army_weight.value;

    assert_ne!(initial_army_weight, army_weight, "Weight not changed after pillage");
}

#[test]
fn combat_test_simple_battle_pillage() {
    let (mut world, battle_pillage_system_dispatcher, attacker_realm_army_unit_id, defender_realm_entity_id) = setup();

    starknet::testing::set_contract_address(contract_address_const::<ATTACKER>());

    let realm_pos: Position = world.read_model(defender_realm_entity_id);
    let army_pos: Position = world.read_model(attacker_realm_army_unit_id);
    assert_eq!(army_pos.x, realm_pos.x, "Army & realm not at same pos");
    assert_eq!(army_pos.y, realm_pos.y, "Army & realm not at same pos");

    let mut army_weight: Weight = world.read_model(attacker_realm_army_unit_id);
    let initial_army_weight = army_weight.value;

    starknet::testing::set_block_timestamp(DEFAULT_BLOCK_TIMESTAMP * 2);

    battle_pillage_system_dispatcher.battle_pillage(attacker_realm_army_unit_id, defender_realm_entity_id);

    let army_weight: Weight = world.read_model(attacker_realm_army_unit_id);
    assert_ne!(initial_army_weight, army_weight.value, "Weight not changed after pillage");
}

