import { useBlockTimestamp } from "@/hooks/helpers/use-block-timestamp";
import Button from "@/ui/elements/button";
import { BattleHistory } from "@/ui/modules/military/battle-view/battle-history";
import { EntityAvatar } from "@/ui/modules/military/battle-view/entity-avatar";
import { TroopRow } from "@/ui/modules/military/battle-view/troops";
import {
  ArmyInfo,
  BattleManager,
  BattleSide,
  ClientComponents,
  ContractAddress,
  getAddressNameFromEntity,
  getArmy,
  ID,
  Structure,
} from "@bibliothecadao/eternum";
import { useDojo } from "@bibliothecadao/react";
import { ComponentValue } from "@dojoengine/recs";
import React, { useMemo, useState } from "react";

export const BattleSideView = ({
  battleManager,
  battleSide,
  battleEntityId,
  showBattleDetails,
  ownSideArmies,
  ownSideTroopsUpdated,
  ownArmyEntityId,
  structure,
  userArmiesOnThatSide,
}: {
  battleManager: BattleManager;
  battleSide: BattleSide;
  battleEntityId: ID | undefined;
  showBattleDetails: boolean;
  ownSideArmies: (ArmyInfo | undefined)[];
  ownSideTroopsUpdated: ComponentValue<ClientComponents["Army"]["schema"]>["troops"] | undefined;
  ownArmyEntityId: ID;
  structure: Structure | undefined;
  userArmiesOnThatSide: ArmyInfo[];
}) => {
  const {
    account: { account },

    setup: {
      components,
      systemCalls: { battle_join, battle_leave },
    },
  } = useDojo();

  const [confirmLeaveWithAllArmies, setConfirmLeaveWithAllArmies] = useState(false);

  const { currentBlockTimestamp: currentTimestamp } = useBlockTimestamp();

  const isActive = useMemo(() => battleManager.isBattleOngoing(currentTimestamp!), [battleManager, currentTimestamp]);

  const [loading, setLoading] = useState<boolean>(false);

  const ownArmy = useMemo(
    () => getArmy(ownArmyEntityId, ContractAddress(account.address), components),
    [ownArmyEntityId, account.address, components],
  );

  const joinBattle = async (side: BattleSide, armyId: ID) => {
    if (ownArmyEntityId) {
      setLoading(true);
      await battle_join({
        signer: account,
        army_id: armyId,
        battle_id: battleEntityId!,
        battle_side: BigInt(side),
      });
      setLoading(false);
    }
  };

  const leaveWithAllArmies = async () => {
    if (!confirmLeaveWithAllArmies) {
      setConfirmLeaveWithAllArmies(true);
    } else {
      setConfirmLeaveWithAllArmies(false);
      setLoading(true);
      await battle_leave({
        signer: account,
        battle_id: battleEntityId!,
        army_ids: userArmiesOnThatSide.map((army) => army.entity_id),
      });
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex col-span-5 mx-4 bg-hex-bg -mt-16 ${
        battleSide === BattleSide.Attack ? "flex-row " : "flex-row-reverse "
      }`}
    >
      <div className="flex flex-col   px-2  mx-4">
        <EntityAvatar
          address={battleSide === BattleSide.Attack ? account.address : battleEntityId?.toString()}
          structure={structure}
          show={ownSideArmies.length > 0}
        />
        <div className="flex flex-col gap-1 mb-2 max-h-24 overflow-y-auto">
          {React.Children.toArray(
            ownSideArmies.map((army) => {
              if (!army) return;
              const addressName = getAddressNameFromEntity(army.entity_id, components) || "Mercenaries";
              return (
                <div className="flex justify-around px-2 py-1 rounded bg-brown/70 text-xs gap-2 border-gold/10 border">
                  <span className="self-center align-middle">{addressName}</span>
                  <span className="self-center align-middle">{army?.name}</span>
                  {army?.isMine && (
                    <div className="h-6 border px-1 rounded self-center">
                      <span className="align-middle self-center font-bold uppercase ">{army?.isMine ? "me" : ""}</span>
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>

        <div className="flex flex-col w-full">
          {Boolean(battleEntityId) && Boolean(ownArmyEntityId) && isActive && ownArmy?.battle_id === 0 && (
            <Button
              onClick={() => joinBattle(battleSide, ownArmyEntityId!)}
              isLoading={loading}
              className="size-xs h-10 self-center w-full"
              variant="primary"
            >
              Join Side
            </Button>
          )}
          {Boolean(battleEntityId) && isActive && userArmiesOnThatSide.length > 0 && (
            <Button
              onClick={leaveWithAllArmies}
              isLoading={loading}
              className="size-xs h-10 self-center w-full mt-2"
              variant="danger"
            >
              {confirmLeaveWithAllArmies ? "Confirm Leave" : "Leave with all armies"}
            </Button>
          )}
        </div>
      </div>
      {showBattleDetails && battleEntityId ? (
        <BattleHistory battleSide={battleSide} battleId={battleEntityId} />
      ) : (
        <TroopRow defending={battleSide === BattleSide.Defence} troops={ownSideTroopsUpdated} />
      )}
    </div>
  );
};
