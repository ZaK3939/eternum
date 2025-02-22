import { ComponentValue, Entity } from "@dojoengine/recs";
import { Account, AccountInterface } from "starknet";
import {
  BuildingType,
  CapacityConfigCategory,
  QuestType,
  RealmLevels,
  ResourcesIds,
  ResourceTier,
  TroopFoodConsumption,
} from "../constants";
import { ClientComponents } from "../dojo";

/**
 * Interface representing season contract addresses and resources
 * @interface SeasonAddresses
 */
export interface SeasonAddresses {
  /** Address of the season pass contract */
  seasonPass: string;
  /** Address of the realms contract */
  realms: string;
  /** Address of the LORDS token contract */
  lords: string;
  /** Map of resource name to [resourceId, contractAddress] */
  resources: {
    [key: string]: (string | number)[];
  };
}

export type ArrivalInfo = {
  entityId: ID;
  recipientEntityId: ID;
  position: Position;
  arrivesAt: bigint;
  isOwner: boolean;
  hasResources: boolean;
  isHome: boolean;
};

export type DojoAccount = Account | AccountInterface;

export type BattleInfo = ComponentValue<ClientComponents["Battle"]["schema"]> & {
  isStructureBattle: boolean;
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
};

export type ArmyInfo = ComponentValue<ClientComponents["Army"]["schema"]> & {
  name: string;
  isMine: boolean;
  isMercenary: boolean;
  isHome: boolean;
  offset: Position;
  health: ComponentValue<ClientComponents["Health"]["schema"]>;
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
  quantity: ComponentValue<ClientComponents["Quantity"]["schema"]>;
  owner: ComponentValue<ClientComponents["Owner"]["schema"]>;
  entityOwner: ComponentValue<ClientComponents["EntityOwner"]["schema"]>;
  protectee: ComponentValue<ClientComponents["Protectee"]["schema"]> | undefined;
  movable: ComponentValue<ClientComponents["Movable"]["schema"]> | undefined;
  totalCapacity: bigint;
  weight: bigint;
  arrivalTime: ComponentValue<ClientComponents["ArrivalTime"]["schema"]> | undefined;
  stamina: ComponentValue<ClientComponents["Stamina"]["schema"]> | undefined;
  realm: ComponentValue<ClientComponents["Realm"]["schema"]> | undefined;
  homePosition: ComponentValue<ClientComponents["Position"]["schema"]> | undefined;
};

export type Structure = ComponentValue<ClientComponents["Structure"]["schema"]> & {
  isMine: boolean;
  isMercenary: boolean;
  name: string;
  ownerName?: string;
  protector: ArmyInfo | undefined;
  owner: ComponentValue<ClientComponents["Owner"]["schema"]>;
  entityOwner: ComponentValue<ClientComponents["EntityOwner"]["schema"]>;
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
};

export type PlayerStructure = ComponentValue<ClientComponents["Structure"]["schema"]> & {
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
  name: string;
  category?: string | undefined;
  owner: ComponentValue<ClientComponents["Owner"]["schema"]>;
};

export type RealmWithPosition = ComponentValue<ClientComponents["Realm"]["schema"]> & {
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
  name: string;
  owner: ComponentValue<ClientComponents["Owner"]["schema"]>;
};
export interface Prize {
  id: QuestType;
  title: string;
}

export enum QuestStatus {
  InProgress,
  Completed,
  Claimed,
}

export interface Building {
  name: string;
  category: string;
  paused: boolean;
  produced: ResourceCost;
  consumed: ResourceCost[];
  bonusPercent: number;
  innerCol: number;
  innerRow: number;
}

export enum BattleType {
  Hex,
  Structure,
}

export enum BattleStatus {
  BattleStart = "Start battle",
  BattleOngoing = "",
  UserWon = "Victory",
  UserLost = "Defeat",
  BattleEnded = "Battle has ended",
}

export enum RaidStatus {
  isRaidable = "Raid!",
  NoStamina = "Not enough stamina",
  NoStructureToClaim = "No structure to raid",
  OwnStructure = "Can't raid your own structure",
  NoArmy = "No army selected",
  ArmyNotInBattle = "Selected army not in this battle",
  MinTroops = "Minimum 100 troops required",
}

export enum LeaveStatus {
  Leave = "Leave",
  NoBattleToLeave = "No battle to leave",
  DefenderCantLeaveOngoing = "A defender can't leave an ongoing battle",
  NoArmyInBattle = "Your armies aren't in this battle",
}

export enum BattleStartStatus {
  MinTroops = "Minimum 100 troops required",
  BattleStart = "Start battle",
  ForceStart = "Force start",
  NothingToAttack = "Nothing to attack",
  CantStart = "Can't start a battle now.",
}

export enum ClaimStatus {
  Claimable = "Claim",
  NoSelectedArmy = "No selected army",
  BattleOngoing = "Battle ongoing",
  DefenderPresent = "An army's defending the structure",
  NoStructureToClaim = "No structure to claim",
  StructureIsMine = "Can't claim your own structure",
  SelectedArmyIsDead = "Selected army is dead",
}

export type HexPosition = { col: number; row: number };

export enum Winner {
  Attacker = "Attacker",
  Target = "Target",
}

export enum TickIds {
  Default,
  Armies,
}

export enum DestinationType {
  Home,
  Hyperstructure,
  Realm,
  Bank,
}

export enum EntityType {
  DONKEY,
  TROOP,
  UNKNOWN,
}

export enum BattleSide {
  None,
  Attack,
  Defence,
}

export enum Access {
  Public,
  Private,
  GuildOnly,
}

export enum TravelTypes {
  Explore,
  Travel,
}

export interface Health {
  current: bigint;
  lifetime: bigint;
}

export interface CombatResultInterface {
  attackerRealmEntityId: ID;
  targetRealmEntityId: ID;
  attackingEntityIds: ID[];
  winner: Winner;
  stolenResources: Resource[];
  damage: number;
  attackTimestamp: number;
  stolenChestsIds: ID[];
}

export interface CombatInfo {
  entityId: ID;
  health: number;
  quantity: number;
  attack: number;
  defence: number;
  sec_per_km: number;
  blocked?: boolean | undefined;
  capacity?: number | undefined;
  arrivalTime?: number | undefined;
  position?: Position | undefined;
  homePosition?: Position | undefined;
  entityOwnerId?: ID | undefined;
  owner?: ID | undefined;
  locationEntityId?: ID | undefined;
  locationType?: DestinationType;
  originRealmId?: ID | undefined;
  order: number;
  troops: {
    knightCount: number;
    paladinCount: number;
    crossbowmanCount: number;
  };
  battleEntityId: ID;
  battleSide: number;
}

/// TRADING
export interface MarketInterface {
  makerName: string;
  originName: string;
  tradeId: ID;
  makerId: ID;
  takerId: ID;
  // brillance, reflection, ...
  makerOrder: number;
  expiresAt: number;
  takerGets: Resource[];
  makerGets: Resource[];
  ratio: number;
  perLords: number;
}

export interface Trade {
  maker_id: ID;
  taker_id: ID;
  maker_order_id: ID;
  taker_order_id: ID;
  expires_at: number;
  claimed_by_maker: boolean;
  claimed_by_taker: boolean;
  taker_needs_caravan: boolean;
}

/// RESOURCES
export interface Resources {
  trait: string;
  value: number;
  colour: string;
  id: number;
  description: string;
  img: string;
  ticker: string;
  rarity?: string;
}

export interface Resource {
  resourceId: ResourcesIds;
  amount: number;
}

/// TRAVEL

export interface EntityInterface {
  entityId: ID;
  blocked: boolean | undefined;
  arrivalTime: number | undefined;
  capacity: number | undefined;
  intermediateDestination: Position | undefined;
  owner: ID | undefined;
  isMine: boolean;
  isRoundTrip: boolean;
  position: Position | undefined;
  homePosition: Position | undefined;
  resources: Resource[];
  entityType: EntityType;
}

/// REALMS
export interface SelectableRealmInterface {
  entityId: ID;
  realmId: ID;
  name: string;
  order: string;
  distance: number;
  defence?: CombatInfo;
  level?: number;
  addressName: string;
}

export interface SelectableLocationInterface {
  entityId: ID;
  home: boolean;
  realmId: ID;
  name: string;
  order: string;
  distance: number;
  defence?: CombatInfo;
  level?: number;
  addressName: string;
}
export interface RealmInterface {
  realmId: ID;
  name: string;
  cities: number;
  rivers: number;
  wonder: number;
  harbors: number;
  regions: number;
  resourceTypesCount: number;
  resourceTypesPacked: bigint;
  order: number;
  owner?: ContractAddress;
  imageUrl: string;
}

/// LABOR

/// BANK
export interface AuctionInterface {
  start_time: number;
  per_time_unit: bigint;
  sold: bigint;
  price_update_interval: bigint;
}

export interface BankStaticInterface {
  name: string;
  position: Position;
  distance: number | undefined;
}

export interface BankInterface {
  name: string;
  wheatPrice: number;
  fishPrice: number;
  bankId: ID;
  position: Position;
  wheatAuction: AuctionInterface | undefined;
  fishAuction: AuctionInterface | undefined;
  distance: number | undefined;
}

/// POSITION
export interface Position {
  x: number;
  y: number;
}

export interface IOrder {
  orderId: number;
  orderName: string;
  fullOrderName: string;
  color: string;
}

export type ID = number;
export type ContractAddress = bigint;

export function ID(id: number | string): ID {
  return Number(id);
}

export function ContractAddress(address: string | bigint): ContractAddress {
  return BigInt(address);
}

export interface ResourceCost {
  resource: ResourcesIds;
  amount: number;
}
export interface ResourceCostMinMax {
  resource_tier: ResourceTier;
  min_amount: number;
  max_amount: number;
}

export interface ResourceInputs {
  [key: number]: ResourceCost[];
}

export interface ResourceOutputs {
  [key: number]: number;
}

export interface Config {
  stamina: {
    travelCost: number;
    exploreCost: number;
    refillPerTick: number;
    startBoostTickCount: number;
  };
  resources: {
    resourcePrecision: number;
    resourceMultiplier: number;
    resourceAmountPerTick: number;
    startingResourcesInputProductionFactor: number;
    resourceInputs: ResourceInputs;
    resourceOutputs: ResourceOutputs;
    resourceWeightsGrams: { [key in ResourcesIds]: number };
    resourceBuildingCosts: ResourceInputs;
    resourceRarity: { [key in ResourcesIds]?: number };
  };
  banks: {
    name: string;
    lordsCost: number;
    lpFeesNumerator: number;
    lpFeesDenominator: number; // %
    ownerFeesNumerator: number;
    ownerFeesDenominator: number; // %
    ownerBridgeFeeOnDepositPercent: number;
    ownerBridgeFeeOnWithdrawalPercent: number;
    ammStartingLiquidity: { [key in ResourcesIds]?: number };
    lordsLiquidityPerResource: number;
  };
  populationCapacity: {
    workerHuts: number;
    basePopulation: number;
  };
  exploration: {
    reward: number;
    shardsMinesFailProbability: number;
  };
  tick: {
    defaultTickIntervalInSeconds: number;
    armiesTickIntervalInSeconds: number; // 1 hour
  };
  carryCapacityGram: Record<CapacityConfigCategory, bigint | number | string>;
  speed: {
    donkey: number;
    army: number;
  };
  battle: {
    graceTickCount: number;
    graceTickCountHyp: number;
    delaySeconds: number;
  };
  troop: {
    // The 7,200 health value makes battles last up to 20 hours at a maximum.
    // This max will be reached if both armies are very similar in strength and health
    // To reduce max battle time by 4x for example, change the health to (7,200 / 4)
    // which will make the max battle time = 5 hours.
    health: number;
    knightStrength: number;
    paladinStrength: number;
    crossbowmanStrength: number;
    advantagePercent: number;
    disadvantagePercent: number;
    maxTroopCount: number;
    baseArmyNumberForStructure: number;
    armyExtraPerMilitaryBuilding: number;
    // Max attacking armies per structure = 6 + 1 defensive army
    maxArmiesPerStructure: number; // 3 + (3 * 1) = 7 // benefits from at most 3 military buildings
    // By setting the divisor to 8, the max health that can be taken from the weaker army
    // during pillage is 100 / 8 = 12.5%. Adjust this value to change that.
    //
    // The closer the armies are in strength and health, the closer they both
    // get to losing 12.5% each. If an army is far stronger than the order,
    // they lose a small percentage (closer to 0% health loss) while the
    // weak army's loss is closer to 12.5%.
    pillageHealthDivisor: number;

    // 25%
    battleLeaveSlashNum: number;
    battleLeaveSlashDenom: number;
    // 1_000. multiply this number by 2 to reduce battle time by 2x, etc.
    battleTimeReductionScale: number;
    battleMaxTimeSeconds: number;
    troopStaminas: { [key: number]: number };
    troopFoodConsumption: Record<number, TroopFoodConsumption>;
  };
  mercenaries: {
    knights_lower_bound: number;
    knights_upper_bound: number;
    paladins_lower_bound: number;
    paladins_upper_bound: number;
    crossbowmen_lower_bound: number;
    crossbowmen_upper_bound: number;
    rewards: Array<ResourceCost>;
  };
  settlement: {
    center: number;
    base_distance: number;
    min_first_layer_distance: number;
    points_placed: number;
    current_layer: number;
    current_side: number;
    current_point_on_side: number;
  };
  season: {
    startAfterSeconds: number;
    bridgeCloseAfterEndSeconds: number;
  };
  bridge: {
    velords_fee_on_dpt_percent: number;
    velords_fee_on_wtdr_percent: number;
    season_pool_fee_on_dpt_percent: number;
    season_pool_fee_on_wtdr_percent: number;
    client_fee_on_dpt_percent: number;
    client_fee_on_wtdr_percent: number;
    velords_fee_recipient: string;
    season_pool_fee_recipient: string;
    max_bank_fee_dpt_percent: number;
    max_bank_fee_wtdr_percent: number;
  };
  vrf: {
    vrfProviderAddress: string;
  };
  buildings: {
    buildingCapacity: Partial<{ [key in BuildingType]: number }>;
    buildingPopulation: Partial<{ [key in BuildingType]: number }>;
    buildingResourceProduced: Partial<{ [key in BuildingType]: number }>;
    buildingCosts: ResourceInputs;
    buildingFixedCostScalePercent: number;
  };

  hyperstructures: {
    hyperstructureCreationCosts: ResourceCostMinMax[];
    hyperstructureConstructionCosts: ResourceCostMinMax[];
    hyperstructureTotalCosts: ResourceCostMinMax[];
    hyperstructurePointsPerCycle: number;
    hyperstructurePointsOnCompletion: number;
    hyperstructureTimeBetweenSharesChangeSeconds: number;
    hyperstructurePointsForWin: number;
  };
  questResources: { [key in QuestType]: ResourceCost[] };
  realmUpgradeCosts: { [key in RealmLevels]: ResourceCost[] };
  realmMaxLevel: number;

  // Config for calling the setup function
  setup?: {
    chain: string;
    addresses: SeasonAddresses;
    manifest: any;
  };
}

export interface RealmInfo {
  realmId: ID;
  entityId: ID;
  name: string;
  resourceTypesPacked: bigint;
  order: number;
  position: ComponentValue<ClientComponents["Position"]["schema"]>;
  population?: number | undefined;
  capacity?: number;
  hasCapacity: boolean;
  owner: ContractAddress;
  ownerName: string;
  hasWonder: boolean;
  level: number;
}

export interface PlayerInfo {
  entity: Entity;
  rank: number;
  address: bigint;
  name: string;
  points: number;
  percentage: number;
  lords: number;
  realms: number;
  mines: number;
  hyperstructures: number;
  isAlive: boolean;
  guildName: string;
}

export interface Player {
  entity: Entity;
  address: ContractAddress;
  name: string;
}

export type GuildInfo = {
  entityId: ID;
  name: string;
  isOwner: boolean;
  memberCount: number;
  isPublic?: boolean;
  isMember?: boolean;
};

export type GuildMemberInfo = {
  guildEntityId: ID;
  name: string;
  address: ContractAddress;
  isUser: boolean;
  isGuildMaster: boolean;
};

export enum ResourceMiningTypes {
  Forge = "forge",
  Mine = "mine",
  LumberMill = "lumber_mill",
  Dragonhide = "dragonhide",
}
