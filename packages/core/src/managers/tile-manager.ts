import { Entity, Has, HasValue, NotValue, getComponentValue, runQuery } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { uuid } from "@latticexyz/utils";
import { CairoOption, CairoOptionVariant } from "starknet";
import { type DojoAccount } from "..";
import {
  BUILDINGS_CENTER,
  BuildingType,
  DUMMY_HYPERSTRUCTURE_ENTITY_ID,
  Direction,
  FELT_CENTER,
  RealmLevels,
  ResourcesIds,
  StructureType,
  getDirectionBetweenAdjacentHexes,
  getNeighborHexes,
} from "../constants";
import { ClientComponents } from "../dojo/create-client-components";
import { EternumProvider } from "../provider";
import { ContractAddress, HexPosition, ID, Position } from "../types";
import { configManager } from "./config-manager";

export class TileManager {
  private col: number;
  private row: number;

  constructor(
    private readonly components: ClientComponents,
    private readonly provider: EternumProvider,
    hexCoords: HexPosition,
  ) {
    this.col = hexCoords.col;
    this.row = hexCoords.row;
  }

  getHexCoords = () => {
    return { col: this.col, row: this.row };
  };

  setTile(hexCoords: HexPosition) {
    this.col = hexCoords.col + FELT_CENTER;
    this.row = hexCoords.row + FELT_CENTER;
  }

  getRealmLevel = (realmEntityId: number): RealmLevels => {
    const realm = getComponentValue(this.components.Realm, getEntityIdFromKeys([BigInt(realmEntityId)]));
    return (realm?.level || RealmLevels.Settlement) as RealmLevels;
  };

  getWonder = (realmEntityId: number) => {
    const realm = getComponentValue(this.components.Realm, getEntityIdFromKeys([BigInt(realmEntityId)]));
    return realm?.has_wonder || false;
  };

  existingBuildings = () => {
    const builtBuildings = Array.from(
      runQuery([
        Has(this.components.Building),
        HasValue(this.components.Building, { outer_col: this.col, outer_row: this.row }),
        NotValue(this.components.Building, { entity_id: 0 }),
      ]),
    );

    const buildings = builtBuildings.map((entity) => {
      const productionModelValue = getComponentValue(this.components.Building, entity);
      const category = productionModelValue!.category;

      return {
        col: Number(productionModelValue?.inner_col),
        row: Number(productionModelValue?.inner_row),
        category,
        resource: productionModelValue?.produced_resource_type,
        paused: productionModelValue?.paused,
        structureType: null,
      };
    });

    return buildings;
  };

  getBuilding = (hexCoords: HexPosition) => {
    const building = getComponentValue(
      this.components.Building,
      getEntityIdFromKeys([BigInt(this.col), BigInt(this.row), BigInt(hexCoords.col), BigInt(hexCoords.row)]),
    );
    return building;
  };

  isHexOccupied = (hexCoords: HexPosition) => {
    const building = getComponentValue(
      this.components.Building,
      getEntityIdFromKeys([BigInt(this.col), BigInt(this.row), BigInt(hexCoords.col), BigInt(hexCoords.row)]),
    );
    return building !== undefined && building.category !== BuildingType[BuildingType.None];
  };

  structureType = () => {
    const structures = Array.from(
      runQuery([Has(this.components.Structure), HasValue(this.components.Position, { x: this.col, y: this.row })]),
    );
    if (structures?.length === 1) {
      const structure = getComponentValue(this.components.Structure, structures[0])!;
      let category = structure.category;
      return StructureType[category as keyof typeof StructureType];
    }
  };

  private _getOwnerEntityId = (address: ContractAddress) => {
    const entities = Array.from(
      runQuery([
        Has(this.components.Owner),
        HasValue(this.components.Owner, { address }),
        HasValue(this.components.Position, { x: this.col, y: this.row }),
      ]),
    );

    if (entities.length === 1) {
      return getComponentValue(this.components.Owner, entities[0])!.entity_id;
    }
  };

  private _getBonusFromNeighborBuildings = (col: number, row: number) => {
    const neighborBuildingCoords = getNeighborHexes(col, row);

    let bonusPercent = 0;
    neighborBuildingCoords.map((coord) => {
      const building = getComponentValue(
        this.components.Building,
        getEntityIdFromKeys([BigInt(this.col), BigInt(this.row), BigInt(coord.col), BigInt(coord.row)]),
      );

      if (building?.category === BuildingType[BuildingType.Farm]) bonusPercent += building.bonus_percent;
    });

    return bonusPercent;
  };

  private _getProducedResourceType = (buildingType: BuildingType, resourceType: number | undefined) => {
    let producedResourceType = 0;

    switch (buildingType) {
      case BuildingType.Farm:
        producedResourceType = ResourcesIds.Wheat;
        break;
      case BuildingType.FishingVillage:
        producedResourceType = ResourcesIds.Fish;
        break;
      case BuildingType.Barracks:
        producedResourceType = ResourcesIds.Knight;
        break;
      case BuildingType.ArcheryRange:
        producedResourceType = ResourcesIds.Crossbowman;
        break;
      case BuildingType.Stable:
        producedResourceType = ResourcesIds.Paladin;
        break;
      case BuildingType.Resource:
        producedResourceType = resourceType!;
        break;
    }

    return producedResourceType;
  };

  private _optimisticBuilding = (
    entityId: ID,
    col: number,
    row: number,
    buildingType: BuildingType,
    resourceType?: number,
  ) => {
    let overrideId = uuid();
    const entity = getEntityIdFromKeys([this.col, this.row, col, row].map((v) => BigInt(v)));

    this.components.Building.addOverride(overrideId, {
      entity,
      value: {
        outer_col: this.col,
        outer_row: this.row,
        inner_col: col,
        inner_row: row,
        category: BuildingType[buildingType],
        produced_resource_type: this._getProducedResourceType(buildingType, resourceType),
        bonus_percent: this._getBonusFromNeighborBuildings(col, row),
        entity_id: entityId,
        outer_entity_id: entityId,
        paused: false,
      },
    });

    const populationOverrideId = uuid();

    const realmEntity = getEntityIdFromKeys([BigInt(entityId)]);

    this.components.Population.addOverride(populationOverrideId, {
      entity: realmEntity,
      value: {
        population:
          (getComponentValue(this.components.Population, realmEntity)?.population || 0) +
          configManager.getBuildingPopConfig(buildingType).population,
        capacity:
          (getComponentValue(this.components.Population, realmEntity)?.capacity || 0) +
          configManager.getBuildingPopConfig(buildingType).capacity,
      },
    });
    const quantityOverrideId = uuid();

    const buildingQuantityEntity = getEntityIdFromKeys([BigInt(entityId), BigInt(buildingType)]);

    const storehouseQuantity =
      getComponentValue(this.components.BuildingQuantityv2, buildingQuantityEntity)?.value || 0;

    this.components.BuildingQuantityv2.addOverride(quantityOverrideId, {
      entity: buildingQuantityEntity,
      value: {
        value: storehouseQuantity + 1,
      },
    });

    const resourceChange = configManager.buildingCosts[buildingType];
    resourceChange.forEach((resource) => {
      this._overrideResource(realmEntity, resource.resource, -BigInt(resource.amount));
    });

    return { overrideId, populationOverrideId, quantityOverrideId };
  };

  private _overrideResource = (entity: Entity, resourceType: number, change: bigint) => {
    const currentBalance = getComponentValue(this.components.Resource, entity)?.balance || 0n;
    const resourceOverrideId = uuid();
    this.components.Resource.addOverride(resourceOverrideId, {
      entity,
      value: {
        resource_type: resourceType,
        balance: currentBalance + change,
      },
    });
  };

  private _optimisticDestroy = (entityId: ID, col: number, row: number) => {
    const overrideId = uuid();
    const realmPosition = getComponentValue(this.components.Position, getEntityIdFromKeys([BigInt(entityId)]));
    const { x: outercol, y: outerrow } = realmPosition || { x: 0, y: 0 };
    const entity = getEntityIdFromKeys([outercol, outerrow, col, row].map((v) => BigInt(v)));

    const currentBuilding = getComponentValue(this.components.Building, entity);

    console.log(currentBuilding);

    this.components.Building.addOverride(overrideId, {
      entity,
      value: {
        outer_col: outercol,
        outer_row: outerrow,
        inner_col: col,
        inner_row: row,
        category: "None",
        produced_resource_type: 0,
        bonus_percent: 0,
        entity_id: 0,
        outer_entity_id: 0,
      },
    });

    const populationOverrideId = uuid();

    const realmEntityId = getEntityIdFromKeys([BigInt(entityId)]);

    const type = BuildingType[currentBuilding?.category as keyof typeof BuildingType];

    this.components.Population.addOverride(populationOverrideId, {
      entity: realmEntityId,
      value: {
        population:
          (getComponentValue(this.components.Population, realmEntityId)?.population || 0) -
          configManager.getBuildingPopConfig(type).population,
        capacity:
          (getComponentValue(this.components.Population, realmEntityId)?.capacity || 0) -
          configManager.getBuildingPopConfig(type).capacity,
      },
    });

    return overrideId;
  };

  private _optimisticPause = (col: number, row: number) => {
    let overrideId = uuid();
    const entity = getEntityIdFromKeys([this.col, this.row, col, row].map((v) => BigInt(v)));
    const building = getComponentValue(this.components.Building, entity);
    this.components.Building.addOverride(overrideId, {
      entity,
      value: {
        outer_col: building?.outer_col,
        outer_row: building?.outer_row,
        inner_col: building?.inner_col,
        inner_row: building?.inner_row,
        category: building?.category,
        produced_resource_type: building?.produced_resource_type,
        bonus_percent: building?.bonus_percent,
        entity_id: building?.entity_id,
        outer_entity_id: building?.outer_entity_id,
        paused: true,
      },
    });
    return overrideId;
  };

  private _optimisticResume = (col: number, row: number) => {
    let overrideId = uuid();
    const entity = getEntityIdFromKeys([this.col, this.row, col, row].map((v) => BigInt(v)));
    const building = getComponentValue(this.components.Building, entity);
    this.components.Building.addOverride(overrideId, {
      entity,
      value: {
        outer_col: building?.outer_col,
        outer_row: building?.outer_row,
        inner_col: building?.inner_col,
        inner_row: building?.inner_row,
        category: building?.category,
        produced_resource_type: building?.produced_resource_type,
        bonus_percent: building?.bonus_percent,
        entity_id: building?.entity_id,
        outer_entity_id: building?.outer_entity_id,
        paused: false,
      },
    });
    return overrideId;
  };

  private _optimisticStructure = (coords: Position, structureType: StructureType) => {
    const overrideId = DUMMY_HYPERSTRUCTURE_ENTITY_ID.toString();
    const entity: Entity = getEntityIdFromKeys([BigInt(DUMMY_HYPERSTRUCTURE_ENTITY_ID)]);

    this.components.Position.addOverride(overrideId, {
      entity,
      value: {
        entity_id: Number(DUMMY_HYPERSTRUCTURE_ENTITY_ID),
        x: coords.x,
        y: coords.y,
      },
    });

    this.components.Structure.addOverride(overrideId, {
      entity,
      value: {
        category: StructureType[structureType],
        entity_id: Number(DUMMY_HYPERSTRUCTURE_ENTITY_ID),
        created_at: 0n,
      },
    });

    return { overrideId };
  };

  placeBuilding = async (
    signer: DojoAccount,
    buildingType: BuildingType,
    hexCoords: HexPosition,
    resourceType?: number,
  ) => {
    const entityId = this._getOwnerEntityId(ContractAddress(signer.address));
    if (!entityId) throw new Error("TileManager: Not Owner of the Tile");
    const { col, row } = hexCoords;

    const startingPosition: [number, number] = [BUILDINGS_CENTER[0], BUILDINGS_CENTER[1]];
    const endPosition: [number, number] = [col, row];
    const directions = getDirectionsArray(startingPosition, endPosition);

    // add optimistic rendering
    const { overrideId, populationOverrideId, quantityOverrideId } = this._optimisticBuilding(
      entityId,
      col,
      row,
      buildingType,
      resourceType,
    );

    // const { isSoundOn, effectsLevel } = useUIStore.getState();
    // playBuildingSound(buildingType, isSoundOn, effectsLevel);

    try {
      await this.provider.create_building({
        signer,
        entity_id: entityId,
        directions: directions,
        building_category: buildingType,
        produce_resource_type:
          buildingType == BuildingType.Resource && resourceType
            ? new CairoOption<Number>(CairoOptionVariant.Some, resourceType)
            : new CairoOption<Number>(CairoOptionVariant.None, 0),
      });
    } catch (error) {
      this.components.Building.removeOverride(overrideId);
      this.components.Population.removeOverride(populationOverrideId);
      this.components.BuildingQuantityv2.removeOverride(quantityOverrideId);

      console.error(error);
      throw error;
    }
  };

  destroyBuilding = async (signer: DojoAccount, col: number, row: number) => {
    const entityId = this._getOwnerEntityId(ContractAddress(signer.address));

    if (!entityId) throw new Error("TileManager: Not Owner of the Tile");
    // add optimistic rendering
    this._optimisticDestroy(entityId, col, row);

    await this.provider.destroy_building({
      signer,
      entity_id: entityId,
      building_coord: {
        x: col,
        y: row,
      },
    });
  };

  pauseProduction = async (signer: DojoAccount, col: number, row: number) => {
    const entityId = this._getOwnerEntityId(ContractAddress(signer.address));
    if (!entityId) throw new Error("TileManager: Not Owner of the Tile");

    this._optimisticPause(col, row);

    await this.provider.pause_production({
      signer,
      entity_id: entityId,
      building_coord: {
        x: col,
        y: row,
      },
    });
  };

  resumeProduction = async (signer: DojoAccount, col: number, row: number) => {
    const entityId = this._getOwnerEntityId(ContractAddress(signer.address));
    if (!entityId) throw new Error("TileManager: Not Owner of the Tile");

    this._optimisticResume(col, row);

    await this.provider.resume_production({
      signer,
      entity_id: entityId,
      building_coord: {
        x: col,
        y: row,
      },
    });
  };

  placeStructure = async (signer: DojoAccount, entityId: ID, structureType: StructureType, coords: Position) => {
    const { overrideId } = this._optimisticStructure(coords, structureType);
    try {
      if (structureType == StructureType.Hyperstructure) {
        return await this.provider.create_hyperstructure({
          signer,
          creator_entity_id: entityId,
          coords,
        });
      }
    } catch (error) {
      this.components.Structure.removeOverride(overrideId);
      this.components.Position.removeOverride(overrideId);
      console.error(error);
      throw error;
    }
  };
}

function getDirectionsArray(start: [number, number], end: [number, number]): Direction[] {
  const [startCol, startRow] = start;
  const [endCol, endRow] = end;

  const queue: { col: number; row: number; path: Direction[] }[] = [{ col: startCol, row: startRow, path: [] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { col, row, path } = queue.shift()!;

    if (col === endCol && row === endRow) {
      return path;
    }

    const key = `${col},${row}`;
    if (visited.has(key)) continue;
    visited.add(key);

    for (const { col: neighborCol, row: neighborRow } of getNeighborHexes(col, row)) {
      const direction = getDirectionBetweenAdjacentHexes({ col, row }, { col: neighborCol, row: neighborRow });
      if (direction !== null) {
        queue.push({ col: neighborCol, row: neighborRow, path: [...path, direction] });
      }
    }
  }

  return [];
}
