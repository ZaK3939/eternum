import { toHexString } from "@bibliothecadao/eternum";
import { useEntityQuery } from "@dojoengine/react";
import { Entity, Has, HasValue, getComponentValue, runQuery } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { shortString } from "starknet";
import { useDojo } from "../context";

export const useFragmentMines = () => {
  const {
    setup: {
      components: { Structure, Position, Owner, EntityName, Building },
    },
  } = useDojo();

  const fragmentMines = useEntityQuery([Has(Structure), HasValue(Structure, { category: "FragmentMine" })]).map(
    (fragmentMineEntityId) => {
      const fragmentMine = getComponentValue(Structure, fragmentMineEntityId);
      const position = getComponentValue(Position, fragmentMineEntityId);
      const entityName = getComponentValue(EntityName, fragmentMineEntityId);

      const owner = toHexString(
        getComponentValue(Owner, getEntityIdFromKeys([BigInt(fragmentMine!.entity_id)]))?.address || 0n,
      );

      const building = getComponentValue(
        Building,
        runQuery([HasValue(Building, { outer_entity_id: fragmentMine!.entity_id })])
          .values()
          .next().value ?? ("0" as Entity),
      );

      return {
        ...fragmentMine,
        ...position,
        ...building,
        owner,
        name: entityName
          ? shortString.decodeShortString(entityName.name.toString())
          : `FragmentMine ${fragmentMine?.entity_id}`,
      };
    },
  );

  return fragmentMines;
};
