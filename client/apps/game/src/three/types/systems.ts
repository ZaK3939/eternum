import { Position } from "@/types/position";
import { HexPosition, ID, StructureType } from "@bibliothecadao/eternum";
import { StructureProgress } from "./common";

export type ArmySystemUpdate = {
  entityId: ID;
  hexCoords: HexPosition;
  battleId: ID;
  defender: boolean;
  currentHealth: bigint;
  order: number;
  owner: { address: bigint; ownerName: string; guildName: string };
};

export type StructureSystemUpdate = {
  entityId: ID;
  hexCoords: HexPosition;
  structureType: StructureType;
  stage: StructureProgress;
  level: number;
  owner: { address: bigint };
  hasWonder: boolean;
};

export type TileSystemUpdate = {
  hexCoords: HexPosition;
  removeExplored: boolean;
};

export type BattleSystemUpdate = {
  entityId: ID;
  hexCoords: Position;
  isEmpty: boolean;
  deleted: boolean;
  isSiege: boolean;
  isOngoing: boolean;
};

export type BuildingSystemUpdate = {
  buildingType: string;
  innerCol: number;
  innerRow: number;
  paused: boolean;
};

export type RealmSystemUpdate = {
  level: number;
  hexCoords: HexPosition;
};
