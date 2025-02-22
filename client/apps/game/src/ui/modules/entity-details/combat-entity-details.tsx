import { useUIStore } from "@/hooks/store/use-ui-store";
import { Position } from "@/types/position";
import { HintSection } from "@/ui/components/hints/hint-modal";
import { ArmyChip } from "@/ui/components/military/army-chip";
import { PillageHistory } from "@/ui/components/military/pillage-history";
import { HintModalButton } from "@/ui/elements/hint-modal-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/elements/select";
import { Tabs } from "@/ui/elements/tab";
import { Entities } from "@/ui/modules/entity-details/entities";
import { ArmyInfo, ContractAddress, getStructureAtPosition, ID } from "@bibliothecadao/eternum";
import { useArmiesAtPosition, useBattlesAtPosition, useDojo } from "@bibliothecadao/react";
import { useMemo, useState } from "react";

export const CombatEntityDetails = () => {
  const dojo = useDojo();

  const selectedHex = useUIStore((state) => state.selectedHex);
  const selectedEntityId = useUIStore((state) => state.armyActions.selectedEntityId);
  const setSelectedEntityId = useUIStore((state) => state.updateSelectedEntityId);

  const hexPosition = useMemo(
    () => new Position({ x: selectedHex?.col || 0, y: selectedHex?.row || 0 }),
    [selectedHex],
  );

  const armiesAtPosition = useArmiesAtPosition({
    position: hexPosition.getContract(),
  });

  // player armies that are not in battle
  const playerArmies = useMemo(
    () => armiesAtPosition.filter((army) => army.isMine && army.battle_id === 0),
    [armiesAtPosition],
  );

  const ownArmy = useMemo(() => {
    return playerArmies.find((army) => army.entity_id === selectedEntityId);
  }, [playerArmies, selectedEntityId]);

  const structure = useMemo(
    () =>
      getStructureAtPosition(
        hexPosition.getContract(),
        ContractAddress(dojo.account.account.address),
        dojo.setup.components,
      ),
    [hexPosition, dojo.account.account.address, dojo.setup.components],
  );
  const battles = useBattlesAtPosition(hexPosition.getContract());

  const tabs = useMemo(
    () => [
      {
        key: "entities",
        label: (
          <div className="flex relative group flex-col items-center">
            <div>Entities</div>
          </div>
        ),
        component: selectedHex && <Entities position={hexPosition} ownArmy={ownArmy} battleEntityIds={battles} />,
      },
      ...(structure
        ? [
            {
              key: "pillages",
              label: (
                <div className="flex relative group flex-col items-center">
                  <div>Pillage History</div>
                </div>
              ),
              component: <PillageHistory structureId={structure.entity_id} />,
            },
          ]
        : []),
    ],
    [selectedHex, hexPosition, ownArmy, structure, battles],
  );

  const [selectedTab, setSelectedTab] = useState(0);

  return (
    hexPosition && (
      <div className="px-2 h-full">
        <HintModalButton className="absolute top-1 right-1" section={HintSection.Combat} />

        <div>
          <Tabs selectedIndex={selectedTab} onChange={(index: any) => setSelectedTab(index)} className="h-full">
            <Tabs.List>
              {tabs.map((tab, index) => (
                <Tabs.Tab key={index}>{tab.label}</Tabs.Tab>
              ))}
            </Tabs.List>
            {selectedTab !== 2 && playerArmies.length > 0 && (
              <SelectActiveArmy
                selectedEntity={selectedEntityId || 0}
                setOwnArmySelected={setSelectedEntityId}
                userAttackingArmies={playerArmies}
              />
            )}

            <Tabs.Panels className="">
              {tabs.map((tab, index) => (
                <Tabs.Panel key={index} className="h-full">
                  {tab.component}
                </Tabs.Panel>
              ))}
            </Tabs.Panels>
          </Tabs>
        </div>
      </div>
    )
  );
};

const SelectActiveArmy = ({
  selectedEntity,
  setOwnArmySelected,
  userAttackingArmies,
}: {
  selectedEntity: ID;
  setOwnArmySelected: (id: ID) => void;
  userAttackingArmies: ArmyInfo[];
}) => {
  return (
    <div className="w-[31rem]">
      <Select
        value={selectedEntity.toString()}
        onValueChange={(a: string) => {
          setOwnArmySelected(ID(a));
        }}
      >
        <SelectTrigger className="w-[31rem] px-2">
          <SelectValue placeholder="Your armies" />
        </SelectTrigger>
        <SelectContent className="text-gold w-[31rem]">
          {userAttackingArmies.map((army, index) => {
            return (
              <SelectItem
                className="flex justify-between text-sm w-full"
                key={index}
                value={army.entity_id?.toString() || ""}
              >
                <ArmyChip className={`w-[27rem] bg-green/10`} army={army} showButtons={false} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
