import {
  CapacityConfigCategory,
  getContractByName,
  NAMESPACE,
  RESOURCE_PRECISION,
  RESOURCE_RARITY,
  ResourcesIds,
  type Config,
} from "@bibliothecadao/eternum";
import { getGameManifest, getSeasonAddresses, type Chain } from "@contracts";
import { AMM_STARTING_LIQUIDITY, LORDS_LIQUIDITY_PER_RESOURCE } from "./utils/amm";
import {
  BUILDING_CAPACITY,
  BUILDING_POPULATION,
  BUILDING_RESOURCE_PRODUCED,
  NON_RESOURCE_BUILDING_COSTS,
  RESOURCE_BUILDING_COSTS,
} from "./utils/building";
import {
  HYPERSTRUCTURE_CONSTRUCTION_COSTS,
  HYPERSTRUCTURE_CREATION_COSTS,
  HYPERSTRUCTURE_TOTAL_COSTS,
} from "./utils/hyperstructure";
import { REALM_MAX_LEVEL, REALM_UPGRADE_COSTS } from "./utils/levels";
import { QUEST_RESOURCES } from "./utils/quest";
import {
  RESOURCE_PRODUCTION_INPUT_RESOURCES,
  RESOURCE_PRODUCTION_OUTPUT_AMOUNTS,
  RESOURCES_WEIGHTS_GRAM,
} from "./utils/resource";
import { TROOPS_FOOD_CONSUMPTION, TROOPS_STAMINAS } from "./utils/troop";

const manifest = await getGameManifest(process.env.VITE_PUBLIC_CHAIN! as Chain);

// ----- Buildings ----- //
// This scales the costs of the buildings
export const BUILDING_FIXED_COST_SCALE_PERCENT = 5_000; // 5_000/10_000 = 50%

// ----- Hyperstructures ----- //
export const HYPERSTRUCTURE_POINTS_PER_CYCLE = 7;
export const HYPERSTRUCTURE_POINTS_ON_COMPLETION = 500_000;
export const HYPERSTRUCTURE_TIME_BETWEEN_SHARES_CHANGE_S = 17280; // 2 days
export const HYPERSTRUCTURE_POINTS_FOR_WIN = 9_620_000;

// ----- Stamina ----- //
export const STAMINA_REFILL_PER_TICK = 20;
export const STAMINA_START_BOOST_TICK_COUNT = 2;
export const STAMINA_TRAVEL_COST = 10;
export const STAMINA_EXPLORE_COST = 20;

// ----- Resources ----- //
export const RESOURCE_AMOUNT_PER_TICK = 10;
export const STARTING_RESOURCES_INPUT_PRODUCTION_FACTOR = 6;

// ----- Banks ----- //
export const BANK_NAME = "Central Bank";
export const BANK_LORDS_COST = 1000;
export const BANK_LP_FEES_NUMERATOR = 15;
export const BANK_LP_FEES_DENOMINATOR = 100;
export const BANK_OWNER_FEES_NUMERATOR = 15;
export const BANK_OWNER_FEES_DENOMINATOR = 100;
export const BANK_OWNER_BRIDGE_FEE_ON_DEPOSIT_PERCENT = 1000;
export const BANK_OWNER_BRIDGE_FEE_ON_WITHDRAWAL_PERCENT = 1000;

// ----- Population Capacity ----- //
export const WORKER_HUTS_CAPACITY = 5;
export const BASE_POPULATION_CAPACITY = 5;

// ----- Exploration ----- //
export const EXPLORATION_REWARD = 750;
export const SHARDS_MINES_FAIL_PROBABILITY = 99000;
export const SHARDS_MINES_WIN_PROBABILITY = 1000;

// ----- Tick ----- //
export const DEFAULT_TICK_INTERVAL_SECONDS = 1;
export const ARMIES_TICK_INTERVAL_SECONDS = 3600;

// ----- Speed ----- //
// @dev: Seconds per km
export const DONKEY_SPEED = 9;

// @TODO: Deprecate this constant everywhere
export const ARMY_SPEED = 1;

// ----- Battle ----- //
export const BATTLE_GRACE_TICK_COUNT = 24;
export const BATTLE_GRACE_TICK_COUNT_HYPERSTRUCTURES = 1;
export const BATTLE_DELAY_SECONDS = 8 * 60 * 60;

// ----- Troops ----- //
export const TROOP_HEALTH = 1;
export const TROOP_KNIGHT_STRENGTH = 1;
export const TROOP_PALADIN_STRENGTH = 1;
export const TROOP_CROSSBOWMAN_STRENGTH = 1;
export const TROOP_ADVANTAGE_PERCENT = 1000;
export const TROOP_DISADVANTAGE_PERCENT = 1000;
export const TROOP_MAX_COUNT = 500_000;
export const TROOP_BASE_ARMY_NUMBER_FOR_STRUCTURE = 3;
export const TROOP_ARMY_EXTRA_PER_MILITARY_BUILDING = 1;
export const TROOP_MAX_ARMIES_PER_STRUCTURE = 7;
export const TROOP_PILLAGE_HEALTH_DIVISOR = 8;
export const TROOP_BATTLE_LEAVE_SLASH_NUM = 25;
export const TROOP_BATTLE_LEAVE_SLASH_DENOM = 100;
export const TROOP_BATTLE_TIME_REDUCTION_SCALE = 1_000;
export const TROOP_BATTLE_MAX_TIME_SECONDS = 2 * 86400; // 2 days

// ----- Mercenaries ----- //
export const MERCENARIES_KNIGHTS_LOWER_BOUND = 1_000;
export const MERCENARIES_KNIGHTS_UPPER_BOUND = 4_000;
export const MERCENARIES_PALADINS_LOWER_BOUND = 1_000;
export const MERCENARIES_PALADINS_UPPER_BOUND = 4_000;
export const MERCENARIES_CROSSBOWMEN_LOWER_BOUND = 1_000;
export const MERCENARIES_CROSSBOWMEN_UPPER_BOUND = 4_000;
export const MERCENARIES_WHEAT_REWARD = 0;
export const MERCENARIES_FISH_REWARD = 0;

// ----- Settlement ----- //
export const SETTLEMENT_CENTER = 2147483646;
export const SETTLEMENT_BASE_DISTANCE = 10;
export const SETTLEMENT_MIN_FIRST_LAYER_DISTANCE = 30;
export const SETTLEMENT_POINTS_PLACED = 0;
export const SETTLEMENT_CURRENT_LAYER = 1;
export const SETTLEMENT_CURRENT_SIDE = 1;
export const SETTLEMENT_CURRENT_POINT_ON_SIDE = 0;

// ----- Season ----- //
export const SEASON_PASS_ADDRESS = "0x0"; // set in indexer.sh
export const REALMS_ADDRESS = "0x0"; // set in indexer.sh
export const LORDS_ADDRESS = "0x0"; // set in indexer.sh

export const VELORDS_FEE_ON_DEPOSIT = 400; // 4%
export const VELORDS_FEE_ON_WITHDRAWAL = 400; // 4%
export const SEASON_POOL_FEE_ON_DEPOSIT = 400; // 4%
export const SEASON_POOL_FEE_ON_WITHDRAWAL = 400; // 4%
export const CLIENT_FEE_ON_DEPOSIT = 200; // 2%
export const CLIENT_FEE_ON_WITHDRAWAL = 200; // 2%
export const VELORDS_FEE_RECIPIENT = "0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5";
export const SEASON_POOL_FEE_RECIPIENT = getContractByName(manifest, `${NAMESPACE}-season_systems`);
export const MAX_BANK_FEE_ON_DEPOSIT = 0; // 10%
export const MAX_BANK_FEE_ON_WITHDRAWAL = 0; // 10%

export const SEASON_START_AFTER_SECONDS = 60 * 60 * 26; // 1 day
export const SEASON_BRIDGE_CLOSE_AFTER_END_SECONDS = 48 * 60 * 60; // 2 days

export const EternumGlobalConfig: Config = {
  stamina: {
    travelCost: STAMINA_TRAVEL_COST,
    exploreCost: STAMINA_EXPLORE_COST,
    refillPerTick: STAMINA_REFILL_PER_TICK,
    startBoostTickCount: STAMINA_START_BOOST_TICK_COUNT,
  },
  resources: {
    resourcePrecision: RESOURCE_PRECISION,
    resourceMultiplier: RESOURCE_PRECISION,
    resourceAmountPerTick: RESOURCE_AMOUNT_PER_TICK,
    startingResourcesInputProductionFactor: STARTING_RESOURCES_INPUT_PRODUCTION_FACTOR,
    resourceInputs: RESOURCE_PRODUCTION_INPUT_RESOURCES,
    resourceOutputs: RESOURCE_PRODUCTION_OUTPUT_AMOUNTS,
    resourceWeightsGrams: RESOURCES_WEIGHTS_GRAM,
    resourceRarity: RESOURCE_RARITY,
    resourceBuildingCosts: RESOURCE_BUILDING_COSTS,
  },
  banks: {
    name: BANK_NAME,
    lordsCost: BANK_LORDS_COST,
    lpFeesNumerator: BANK_LP_FEES_NUMERATOR,
    lpFeesDenominator: BANK_LP_FEES_DENOMINATOR,
    ownerFeesNumerator: BANK_OWNER_FEES_NUMERATOR,
    ownerFeesDenominator: BANK_OWNER_FEES_DENOMINATOR,
    ownerBridgeFeeOnDepositPercent: BANK_OWNER_BRIDGE_FEE_ON_DEPOSIT_PERCENT,
    ownerBridgeFeeOnWithdrawalPercent: BANK_OWNER_BRIDGE_FEE_ON_WITHDRAWAL_PERCENT,
    ammStartingLiquidity: AMM_STARTING_LIQUIDITY,
    lordsLiquidityPerResource: LORDS_LIQUIDITY_PER_RESOURCE,
  },
  populationCapacity: {
    workerHuts: WORKER_HUTS_CAPACITY,
    basePopulation: BASE_POPULATION_CAPACITY,
  },
  exploration: {
    reward: EXPLORATION_REWARD,
    shardsMinesFailProbability: SHARDS_MINES_FAIL_PROBABILITY,
  },
  tick: {
    defaultTickIntervalInSeconds: DEFAULT_TICK_INTERVAL_SECONDS,
    armiesTickIntervalInSeconds: ARMIES_TICK_INTERVAL_SECONDS,
  },
  carryCapacityGram: {
    [CapacityConfigCategory.None]: 0,
    [CapacityConfigCategory.Structure]: BigInt(2) ** BigInt(128) - BigInt(1),
    [CapacityConfigCategory.Donkey]: 500_000,
    // 10_000 gr per army
    [CapacityConfigCategory.Army]: 10_000,
    [CapacityConfigCategory.Storehouse]: 300_000_000,
  },
  speed: {
    donkey: DONKEY_SPEED,
    army: ARMY_SPEED,
  },
  battle: {
    graceTickCount: BATTLE_GRACE_TICK_COUNT,
    graceTickCountHyp: BATTLE_GRACE_TICK_COUNT_HYPERSTRUCTURES,
    delaySeconds: BATTLE_DELAY_SECONDS,
  },
  troop: {
    health: TROOP_HEALTH,
    knightStrength: TROOP_KNIGHT_STRENGTH,
    paladinStrength: TROOP_PALADIN_STRENGTH,
    crossbowmanStrength: TROOP_CROSSBOWMAN_STRENGTH,
    advantagePercent: TROOP_ADVANTAGE_PERCENT,
    disadvantagePercent: TROOP_DISADVANTAGE_PERCENT,
    maxTroopCount: TROOP_MAX_COUNT,
    baseArmyNumberForStructure: TROOP_BASE_ARMY_NUMBER_FOR_STRUCTURE,
    armyExtraPerMilitaryBuilding: TROOP_ARMY_EXTRA_PER_MILITARY_BUILDING,
    maxArmiesPerStructure: TROOP_MAX_ARMIES_PER_STRUCTURE,
    pillageHealthDivisor: TROOP_PILLAGE_HEALTH_DIVISOR,
    battleLeaveSlashNum: TROOP_BATTLE_LEAVE_SLASH_NUM,
    battleLeaveSlashDenom: TROOP_BATTLE_LEAVE_SLASH_DENOM,
    battleTimeReductionScale: TROOP_BATTLE_TIME_REDUCTION_SCALE,
    battleMaxTimeSeconds: TROOP_BATTLE_MAX_TIME_SECONDS,
    troopStaminas: TROOPS_STAMINAS,
    troopFoodConsumption: TROOPS_FOOD_CONSUMPTION,
  },
  mercenaries: {
    knights_lower_bound: MERCENARIES_KNIGHTS_LOWER_BOUND,
    knights_upper_bound: MERCENARIES_KNIGHTS_UPPER_BOUND,
    paladins_lower_bound: MERCENARIES_PALADINS_LOWER_BOUND,
    paladins_upper_bound: MERCENARIES_PALADINS_UPPER_BOUND,
    crossbowmen_lower_bound: MERCENARIES_CROSSBOWMEN_LOWER_BOUND,
    crossbowmen_upper_bound: MERCENARIES_CROSSBOWMEN_UPPER_BOUND,
    rewards: [
      { resource: ResourcesIds.Wheat, amount: MERCENARIES_WHEAT_REWARD },
      { resource: ResourcesIds.Fish, amount: MERCENARIES_FISH_REWARD },
    ],
  },
  settlement: {
    center: SETTLEMENT_CENTER,
    base_distance: SETTLEMENT_BASE_DISTANCE,
    min_first_layer_distance: SETTLEMENT_MIN_FIRST_LAYER_DISTANCE,
    points_placed: SETTLEMENT_POINTS_PLACED,
    current_layer: SETTLEMENT_CURRENT_LAYER,
    current_side: SETTLEMENT_CURRENT_SIDE,
    current_point_on_side: SETTLEMENT_CURRENT_POINT_ON_SIDE,
  },
  buildings: {
    buildingCapacity: BUILDING_CAPACITY,
    buildingPopulation: BUILDING_POPULATION,
    buildingResourceProduced: BUILDING_RESOURCE_PRODUCED,
    buildingCosts: NON_RESOURCE_BUILDING_COSTS,
    buildingFixedCostScalePercent: BUILDING_FIXED_COST_SCALE_PERCENT,
  },
  hyperstructures: {
    hyperstructureCreationCosts: HYPERSTRUCTURE_CREATION_COSTS,
    hyperstructureConstructionCosts: HYPERSTRUCTURE_CONSTRUCTION_COSTS,
    hyperstructureTotalCosts: HYPERSTRUCTURE_TOTAL_COSTS,
    hyperstructurePointsPerCycle: HYPERSTRUCTURE_POINTS_PER_CYCLE,
    hyperstructurePointsOnCompletion: HYPERSTRUCTURE_POINTS_ON_COMPLETION,
    hyperstructureTimeBetweenSharesChangeSeconds: HYPERSTRUCTURE_TIME_BETWEEN_SHARES_CHANGE_S,
    hyperstructurePointsForWin: HYPERSTRUCTURE_POINTS_FOR_WIN,
  },
  season: {
    startAfterSeconds: SEASON_START_AFTER_SECONDS,
    bridgeCloseAfterEndSeconds: SEASON_BRIDGE_CLOSE_AFTER_END_SECONDS,
  },
  bridge: {
    velords_fee_on_dpt_percent: VELORDS_FEE_ON_DEPOSIT,
    velords_fee_on_wtdr_percent: VELORDS_FEE_ON_WITHDRAWAL,
    season_pool_fee_on_dpt_percent: SEASON_POOL_FEE_ON_DEPOSIT,
    season_pool_fee_on_wtdr_percent: SEASON_POOL_FEE_ON_WITHDRAWAL,
    client_fee_on_dpt_percent: CLIENT_FEE_ON_DEPOSIT,
    client_fee_on_wtdr_percent: CLIENT_FEE_ON_WITHDRAWAL,
    velords_fee_recipient: VELORDS_FEE_RECIPIENT,
    season_pool_fee_recipient: SEASON_POOL_FEE_RECIPIENT,
    max_bank_fee_dpt_percent: MAX_BANK_FEE_ON_DEPOSIT,
    max_bank_fee_wtdr_percent: MAX_BANK_FEE_ON_WITHDRAWAL,
  },
  vrf: {
    vrfProviderAddress: process.env.VITE_PUBLIC_VRF_PROVIDER_ADDRESS!,
  },
  questResources: QUEST_RESOURCES,
  realmUpgradeCosts: REALM_UPGRADE_COSTS,
  realmMaxLevel: REALM_MAX_LEVEL,
  setup: {
    chain: process.env.VITE_PUBLIC_CHAIN!,
    addresses: await getSeasonAddresses(process.env.VITE_PUBLIC_CHAIN! as Chain),
    manifest: manifest,
  },
};
