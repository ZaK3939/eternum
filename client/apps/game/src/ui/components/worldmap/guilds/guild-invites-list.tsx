import { ReactComponent as Trash } from "@/assets/icons/common/trashcan.svg";
import { useUIStore } from "@/hooks/store/use-ui-store";
import { SortButton, SortInterface } from "@/ui/elements/sort-button";
import { SortPanel } from "@/ui/elements/sort-panel";
import { sortItems } from "@/ui/utils/utils";
import { ContractAddress, GuildMemberInfo } from "@bibliothecadao/eternum";
import clsx from "clsx";
import { useMemo, useState } from "react";

interface GuildInviteListProps {
  invitedPlayers: GuildMemberInfo[];
  isLoading: boolean;
  viewPlayerInfo: (playerAddress: ContractAddress) => void;
  removePlayerFromWhitelist: (playerAddress: ContractAddress) => void;
}

interface InviteRowProps {
  player: GuildMemberInfo;
  isLoading: boolean;
  viewPlayerInfo: (playerAddress: ContractAddress) => void;
  removePlayerFromWhitelist: (playerAddress: ContractAddress) => void;
}

export const GuildInviteList = ({
  invitedPlayers,
  isLoading,
  viewPlayerInfo,
  removePlayerFromWhitelist,
}: GuildInviteListProps) => {
  const [activeSort, setActiveSort] = useState<SortInterface>({
    sortKey: "number",
    sort: "none",
  });

  return (
    <div className="flex flex-col p-2 border rounded-xl h-full">
      <GuildInviteListHeader activeSort={activeSort} setActiveSort={setActiveSort} />
      <div className="space-y-2 overflow-y-auto">
        {sortItems(invitedPlayers, activeSort, { sortKey: "rank", sort: "asc" }).map((player) => (
          <InviteRow
            key={player.address}
            player={player}
            isLoading={isLoading}
            viewPlayerInfo={viewPlayerInfo}
            removePlayerFromWhitelist={removePlayerFromWhitelist}
          />
        ))}
        {!invitedPlayers.length && <p className="text-center italic">No Tribe Invites Sent</p>}
      </div>
    </div>
  );
};

interface ListHeaderProps {
  activeSort: SortInterface;
  setActiveSort: (sort: SortInterface) => void;
}

const GuildInviteListHeader = ({ activeSort, setActiveSort }: ListHeaderProps) => {
  const sortingParams = useMemo(() => {
    return [
      { label: "Rank", sortKey: "rank", className: "" },
      { label: "Name", sortKey: "name", className: "col-span-2" },
      { label: "Pts", sortKey: "points", className: "" },
    ];
  }, []);

  const textStyle = "text-gray-gold font-bold";

  return (
    <SortPanel className="grid grid-cols-5 mb-1 font-bold">
      {sortingParams.map(({ label, sortKey, className }) => (
        <SortButton
          className={className + " " + textStyle}
          classNameCaret="w-2"
          key={sortKey}
          label={label}
          sortKey={sortKey}
          activeSort={activeSort}
          onChange={(_sortKey, _sort) => {
            setActiveSort({
              sortKey: _sortKey,
              sort: _sort,
            });
          }}
        />
      ))}
    </SortPanel>
  );
};

const InviteRow = ({ player, isLoading, viewPlayerInfo, removePlayerFromWhitelist }: InviteRowProps) => {
  const setTooltip = useUIStore((state) => state.setTooltip);

  return (
    <div className="flex grid grid-cols-5">
      <div
        className="col-span-4 grid grid-cols-1 text-md hover:opacity-70 hover:border p-1 rounded-xl"
        onClick={() => {
          viewPlayerInfo(ContractAddress(player.address!));
        }}
      >
        <p className="truncate font-bold h6">{player.name}</p>
      </div>

      <Trash
        onClick={() => {
          removePlayerFromWhitelist(player.address!);
          setTooltip(null);
        }}
        className={clsx("m-auto self-center w-4 fill-red/70 hover:fill-red/40 duration-100 transition-all", {
          "animate-pulse ": isLoading,
        })}
        onMouseEnter={() =>
          setTooltip({
            content: <div>Revoke tribe invitation</div>,
            position: "top",
          })
        }
        onMouseLeave={() => setTooltip(null)}
      />
    </div>
  );
};
