import { soundSelector, useUiSounds } from "@/hooks/helpers/use-ui-sound";
import Button from "@/ui/elements/button";
import { getEntityIdFromKeys } from "@/ui/utils/utils";
import { getBlockTimestamp } from "@/utils/timestamp";
import {
  ArrivalInfo,
  BattleManager,
  ContractAddress,
  getStructure,
  ID,
  Resource,
  ResourceInventoryManager,
} from "@bibliothecadao/eternum";
import { useDojo } from "@bibliothecadao/react";
import { useComponentValue } from "@dojoengine/react";
import { useMemo, useState } from "react";

type DepositResourcesProps = {
  arrival: ArrivalInfo;
  armyInBattle: boolean;
  resources: Resource[];
};

export const DepositResources = ({ arrival, resources, armyInBattle }: DepositResourcesProps) => {
  const dojo = useDojo();
  const [isLoading, setIsLoading] = useState(false);

  // stone as proxy for depoisiting resources
  const { play: playDeposit } = useUiSounds(soundSelector.addStone);

  const structureAtPosition = useMemo(() => {
    return getStructure(
      arrival.recipientEntityId || 0,
      ContractAddress(dojo.account.account.address),
      dojo.setup.components,
    );
  }, [arrival.recipientEntityId, dojo.account.account.address, dojo.setup.components]);

  const battleInProgress = useMemo(() => {
    if (!structureAtPosition || !structureAtPosition.protector || structureAtPosition.protector.battle_id === 0) {
      return false;
    }
    const currentTimestamp = getBlockTimestamp().currentBlockTimestamp;
    const battleManager = new BattleManager(
      dojo.setup.components,
      dojo.network.provider,
      structureAtPosition.protector.battle_id,
    );

    const battleOngoing = battleManager.isBattleOngoing(currentTimestamp!);
    return battleOngoing && !battleManager.isSiege(currentTimestamp!);
  }, [structureAtPosition?.protector?.battle_id, dojo]);

  const currentBlockTimestamp = getBlockTimestamp().currentBlockTimestamp;

  const weight =
    useComponentValue(dojo.setup.components.Weight, getEntityIdFromKeys([BigInt(arrival.entityId)]))?.value || 0n;

  const depositManager = useMemo(() => {
    return new ResourceInventoryManager(dojo.setup.components, dojo.network.provider, arrival.entityId);
  }, [dojo.setup, arrival.entityId]);

  const onOffload = async (receiverEntityId: ID) => {
    if (resources.length > 0) {
      playDeposit();
      setIsLoading(true);
      await depositManager.onOffloadAll(dojo.account.account, receiverEntityId, resources).then(() => {
        setIsLoading(false);
      });
    }
  };

  return (
    <div className="w-full">
      <Button
        size="xs"
        className="w-full"
        isLoading={isLoading}
        disabled={
          arrival.arrivesAt > currentBlockTimestamp || battleInProgress || armyInBattle || resources.length === 0
        }
        onClick={() => onOffload(arrival.recipientEntityId)}
        variant="primary"
        withoutSound
      >
        {battleInProgress || armyInBattle
          ? `${armyInBattle ? "Army in battle" : "Battle in progress"}`
          : resources.length === 0 && weight > 0n
            ? "Resources syncing..."
            : resources.length === 0 && weight === 0n
              ? "No resources to deposit"
              : "Deposit Resources"}
      </Button>
    </div>
  );
};
