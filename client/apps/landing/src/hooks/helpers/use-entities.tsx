import { getRealmNameById } from "@bibliothecadao/eternum";
import { useAccount } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { execute } from "../gql/execute";
import { GET_ETERNUM_OWNER_REALM_IDS } from "../query/entities";

interface s1EternumRealm {
  __typename: "s1_eternum_Realm";
  realm_id: number;
}

function iss1EternumRealm(model: any): model is s1EternumRealm {
  return model?.__typename === "s1_eternum_Realm";
}

function iss1EternumStructure(model: any) {
  return model?.__typename === "s1_eternum_Structure";
}

export const useEntities = () => {
  const { address } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["entityResources", address],
    queryFn: () => (address ? execute(GET_ETERNUM_OWNER_REALM_IDS, { accountAddress: address }) : null),
    refetchInterval: 10_000,
  });

  console.log({ data });

  const playerRealms = useMemo(() => {
    if (!data) return [];

    return data.s1EternumOwnerModels?.edges
      ?.map((realm) => {
        const realmModel = realm?.node?.entity?.models?.find(iss1EternumRealm);
        if (!realmModel) return null;
        return {
          realmId: realmModel?.realm_id,
          entityId: realm?.node?.entity_id,
          name: getRealmNameById(realmModel?.realm_id ?? 0),
        };
      })
      .filter(Boolean) as { realmId: number; entityId: number; name: string }[];
  }, [data, getRealmNameById]);

  const playerStructures = useMemo(() => {
    if (!data) return [];

    return data.s1EternumOwnerModels?.edges
      ?.map((structure) => {
        const structureModel = structure?.node?.entity?.models?.find(iss1EternumStructure);
        if (!structureModel) return null;
        const realmModel = structure?.node?.entity?.models?.find(iss1EternumRealm);
        const entityId = structure?.node?.entity_id;
        return {
          realmId: realmModel?.realm_id || entityId,
          entityId,
          name: realmModel ? getRealmNameById(realmModel?.realm_id ?? 0) : "Structure",
        };
      })
      .filter(Boolean) as { realmId: number | undefined; entityId: number; name: string }[];
  }, [data, getRealmNameById]);

  return {
    playerRealms,
    playerStructures,
    isLoading,
  };
};
