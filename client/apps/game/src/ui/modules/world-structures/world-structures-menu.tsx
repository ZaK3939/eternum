import { FragmentMinePanel } from "@/ui/components/fragmentMines/fragment-mine-panel";
import { HintSection } from "@/ui/components/hints/hint-modal";
import { DisplayedAccess, HyperstructurePanel } from "@/ui/components/hyperstructures/hyperstructure-panel";
import { EntityList } from "@/ui/components/list/entity-list";
import { NavigateToPositionIcon } from "@/ui/components/military/army-chip";
import { ViewOnMapIcon } from "@/ui/components/military/army-management-card";
import { Checkbox } from "@/ui/elements/checkbox";
import { HintModalButton } from "@/ui/elements/hint-modal-button";
import { ResourceIcon } from "@/ui/elements/resource-icon";
import { currencyFormat, currencyIntlFormat } from "@/ui/utils/utils";
import { getBlockTimestamp } from "@/utils/timestamp";
import {
  BattleSide,
  ContractAddress,
  divideByPrecision,
  findResourceById,
  getAddressFromEntity,
  getAddressNameFromEntity,
  getBalance,
  getGuildFromPlayerAddress,
  ID,
  LeaderboardManager,
  ResourcesIds,
} from "@bibliothecadao/eternum";
import {
  useArmiesAtPosition,
  useDojo,
  useFragmentMines,
  useHyperstructureProgress,
  useHyperstructures,
} from "@bibliothecadao/react";
import { ArrowRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Tabs } from "../../elements/tab";

export const WorldStructuresMenu = ({ className }: { className?: string }) => {
  const {
    setup: { components },
    account: { account },
  } = useDojo();

  const [selectedTab, setSelectedTab] = useState(0);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const { hyperstructures } = useHyperstructures();
  const fragmentMines = useFragmentMines();

  const myHyperstructures = useMemo(
    () =>
      LeaderboardManager.instance(components).getHyperstructuresWithContributionsFromPlayer(
        ContractAddress(account.address),
      ),
    [components, account.address],
  );

  const renderExtraContent = useCallback(
    (entityId: ID, type: "hyperstructure" | "fragmentMine") => {
      const entities = type === "hyperstructure" ? hyperstructures : fragmentMines;
      const entity = entities.find((e) => e.entity_id === entityId);
      if (!entity) return null;

      return type === "hyperstructure" ? (
        <HyperStructureExtraContent hyperstructureEntityId={entity.entity_id!} x={entity.x!} y={entity.y!} />
      ) : (
        <FragmentMineExtraContent x={Number(entity.x!)} y={Number(entity.y!)} entityId={entityId!} />
      );
    },
    [hyperstructures, fragmentMines],
  );

  const renderEntityHeader = useCallback(
    (entityId: ID, type: "hyperstructure" | "fragmentMine") => {
      const entities = type === "hyperstructure" ? hyperstructures : fragmentMines;
      const entity = entities.find((e) => e.entity_id === entityId);
      return entity ? <EntityHeader entity={entity} /> : null;
    },
    [hyperstructures, fragmentMines],
  );

  const tabs = useMemo(
    () => [
      {
        key: "Hyperstructures",
        label: "Hyperstructures",
        component: (
          <>
            <FilterCheckbox showOnlyMine={showOnlyMine} setShowOnlyMine={setShowOnlyMine} />
            <EntityList
              title="Hyperstructures"
              panel={({ entity }) => <HyperstructurePanel entity={entity} />}
              entityHeader={(id: any) => renderEntityHeader(id, "hyperstructure")}
              entityContent={(id: any) => renderExtraContent(id, "hyperstructure")}
              chunkSize={10}
              list={hyperstructures
                .filter((h) => h.created_at)
                .sort((a, b) => Number(a.entity_id) - Number(b.entity_id))
                .map((h) => ({
                  id: h.entity_id,
                  position: { x: h.x, y: h.y },
                  ...h,
                }))}
              filterEntityIds={showOnlyMine ? Array.from(myHyperstructures) : undefined}
            />
          </>
        ),
      },
      {
        key: "Mines",
        label: "Mines",
        component: (
          <>
            <FilterCheckbox showOnlyMine={showOnlyMine} setShowOnlyMine={setShowOnlyMine} />
            <EntityList
              title="FragmentMines"
              panel={({ entity }) => <FragmentMinePanel entity={entity} />}
              entityHeader={(id: any) => renderEntityHeader(id, "fragmentMine")}
              entityContent={(id: any) => renderExtraContent(id, "fragmentMine")}
              chunkSize={10}
              list={fragmentMines
                .sort((a, b) => Number(a.entity_id) - Number(b.entity_id))
                .map((m) => ({
                  id: m.entity_id,
                  position: { x: m.x, y: m.y },
                  ...m,
                }))}
              filterEntityIds={
                showOnlyMine
                  ? fragmentMines.filter((m) => m.owner === account.address).map((m) => m.entity_id as ID)
                  : undefined
              }
            />
          </>
        ),
      },
    ],
    [selectedTab, hyperstructures, fragmentMines, showOnlyMine, account.address, myHyperstructures],
  );

  return (
    <>
      <HintModalButton className="absolute top-1 right-1" section={HintSection.WorldStructures} />
      <Tabs selectedIndex={selectedTab} onChange={setSelectedTab} variant="default">
        <Tabs.List>
          {tabs.map((tab, index) => (
            <Tabs.Tab key={index}>
              <div className="flex group relative flex-col items-center">
                <div>{tab.label}</div>
              </div>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panels className="overflow-hidden">
          {tabs.map((tab, index) => (
            <Tabs.Panel key={index}>{tab.component}</Tabs.Panel>
          ))}
        </Tabs.Panels>
      </Tabs>
    </>
  );
};

const FilterCheckbox = ({
  showOnlyMine,
  setShowOnlyMine,
}: {
  showOnlyMine: boolean;
  setShowOnlyMine: (show: boolean) => void;
}) => (
  <div className="px-2 pb-2">
    <label className="flex items-center space-x-1 text-xs">
      <Checkbox enabled={showOnlyMine} onClick={() => setShowOnlyMine(!showOnlyMine)} />
      <span>Show only mine</span>
    </label>
  </div>
);

const BaseStructureExtraContent = ({
  x,
  y,
  entityId,
  children,
}: {
  x: number;
  y: number;
  entityId: ID;
  children: React.ReactNode;
}) => {
  const {
    setup: { components },
  } = useDojo();

  const armies = useArmiesAtPosition({ position: { x, y } });

  const structureOwner = useMemo(() => {
    const ownerName = getAddressNameFromEntity(entityId, components);
    const address = getAddressFromEntity(entityId, components);
    const guildName = getGuildFromPlayerAddress(address || 0n, components)?.name;
    return { name: ownerName, guildName };
  }, [entityId]);

  const { defensiveArmy, attackingArmy } = useMemo(() => {
    const defensive = armies.find((army) => army.protectee?.protectee_id);
    const attacking = armies.find(
      (army) => army.battle_side === BattleSide[BattleSide.Attack] && army.battle_id === defensive?.battle_id,
    );

    const getArmyInfo = (army?: any) => {
      if (!army) return;
      const ownerName = getAddressNameFromEntity(army.entity_id || 0, components);
      const guildName = getGuildFromPlayerAddress(army.owner?.address || 0n, components)?.name;
      const totalTroops =
        (army.troops?.knight_count || 0n) + (army.troops?.paladin_count || 0n) + (army.troops?.crossbowman_count || 0n);
      return { totalTroops, army, name: ownerName, guildName };
    };

    return {
      defensiveArmy: getArmyInfo(defensive) || { totalTroops: 0n },
      attackingArmy: getArmyInfo(attacking),
    };
  }, [armies]);

  return (
    <div className="grid grid-cols-2 gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gold/80">Owner:</span>
        <span className="font-medium">{structureOwner?.guildName || structureOwner?.name || "Mercenaries"}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gold/80">Defense:</span>
        <span className="font-medium">{currencyFormat(Number(defensiveArmy.totalTroops), 0)}</span>
      </div>
      <div className="flex items-center gap-2 col-span-2">
        <span className="text-gold/80">Battle:</span>
        <span className="font-medium">
          {attackingArmy ? `${attackingArmy.guildName || attackingArmy.name || "Mercenaries"}⚔` : "None"}
        </span>
      </div>
      {children}
    </div>
  );
};

const HyperStructureExtraContent = ({
  hyperstructureEntityId,
  x,
  y,
}: {
  hyperstructureEntityId: ID;
  x: number;
  y: number;
}) => {
  const {
    setup: { components },
    account: { account },
  } = useDojo();

  const progress = useHyperstructureProgress(hyperstructureEntityId);
  const latestChangeEvent = LeaderboardManager.instance(components).getCurrentCoOwners(hyperstructureEntityId);
  const needTosetCoOwners = !latestChangeEvent && progress.percentage === 100;
  const shares =
    LeaderboardManager.instance(components).getAddressShares(
      ContractAddress(account.address),
      hyperstructureEntityId,
    ) || 0;

  return (
    <BaseStructureExtraContent x={x} y={y} entityId={hyperstructureEntityId}>
      <div className="flex items-center gap-2">
        <span className="text-gold/80">Progress:</span>
        <span className="font-medium">{`${progress.percentage}%`}</span>
        {needTosetCoOwners && <div className="text-xs text-red animate-pulse">Co-owners not set</div>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gold/80">Shares:</span>
        <span className="font-medium">{currencyIntlFormat(shares * 100, 0)}%</span>
      </div>
    </BaseStructureExtraContent>
  );
};

const FragmentMineExtraContent = ({ x, y, entityId }: { x: number; y: number; entityId: ID }) => {
  const dojo = useDojo();
  const currentDefaultTick = getBlockTimestamp().currentDefaultTick;

  const { balance } = getBalance(entityId, ResourcesIds.AncientFragment, currentDefaultTick, dojo.setup.components);
  const trait = useMemo(() => findResourceById(ResourcesIds.AncientFragment)?.trait, []);

  return (
    <BaseStructureExtraContent x={x} y={y} entityId={entityId}>
      <div className="flex items-center gap-2">
        <span className="text-gold/80">Balance:</span>
        <span className="font-medium flex items-center">
          {Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(divideByPrecision(balance || 0))}
          <ResourceIcon className="ml-1" isLabor={false} withTooltip={false} resource={trait || ""} size="xs" />
        </span>
      </div>
    </BaseStructureExtraContent>
  );
};

const EntityHeader = ({ entity }: { entity: any }) => {
  const position = { x: entity.x, y: entity.y };
  const access = entity?.access ? DisplayedAccess[entity.access as keyof typeof DisplayedAccess] : undefined;

  const getAccessStyle = (access?: string) => {
    if (!access) return "";
    const styles = {
      Public: "text-green border border-green",
      Private: "text-red border border-red",
      "Tribe Only": "text-gold border border-gold",
    };
    return styles[access as keyof typeof styles] || "";
  };

  return (
    <div className="flex flex-row justify-between items-center">
      <div className="flex flex-row space-x-5 items-center">
        <div className="flex flex-row items-center gap-2">
          <h5 className="font-semibold text-gold">{entity.name}</h5>
          {access && (
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getAccessStyle(access)}`}>{access}</span>
          )}
          <div className="flex flex-row">
            <ViewOnMapIcon className="my-auto" position={position} />
            <NavigateToPositionIcon className="h-6 w-6" position={position} />
          </div>
        </div>
      </div>
      <ArrowRight className="w-2 fill-current" />
    </div>
  );
};
