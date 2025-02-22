import { useLeaderBoardStore } from "@/hooks/store/use-leaderboard-store";
import { useUIStore } from "@/hooks/store/use-ui-store";
import Button from "@/ui/elements/button";
import { getBlockTimestamp } from "@/utils/timestamp";
import { configManager, ContractAddress, LeaderboardManager } from "@bibliothecadao/eternum";
import { useDojo, useGetPlayerEpochs } from "@bibliothecadao/react";
import clsx from "clsx";
import { useCallback, useMemo } from "react";

export const EndSeasonButton = () => {
  const dojo = useDojo();
  const {
    setup,
    account: { account },
  } = dojo;

  const playersByRank = useLeaderBoardStore((state) => state.playersByRank);

  const setTooltip = useUIStore((state) => state.setTooltip);
  const structureEntityId = useUIStore((state) => state.structureEntityId);
  const currentBlockTimestamp = getBlockTimestamp().currentBlockTimestamp;

  const getEpochs = useGetPlayerEpochs();

  const pointsForWin = configManager.getHyperstructureConfig().pointsForWin;

  const { playerPoints, percentageOfPoints } = useMemo(() => {
    const player = playersByRank.find(([player, _]) => ContractAddress(player) === ContractAddress(account.address));
    const playerPoints = player?.[1] ?? 0;

    return { playerPoints, percentageOfPoints: Math.min((playerPoints / pointsForWin) * 100, 100) };
  }, [structureEntityId, currentBlockTimestamp]);

  const hasReachedFinalPoints = useMemo(() => {
    return percentageOfPoints >= 100;
  }, [percentageOfPoints]);

  const gradient = useMemo(() => {
    const filledPercentage = percentageOfPoints;
    const emptyPercentage = 1 - percentageOfPoints;
    return `linear-gradient(to right, #f3c99f80 ${filledPercentage}%, #f3c99f80 ${filledPercentage}%, #0000000d ${filledPercentage}%, #0000000d ${
      filledPercentage + emptyPercentage
    }%)`;
  }, [percentageOfPoints]);

  const endGame = useCallback(async () => {
    if (!hasReachedFinalPoints) {
      return;
    }
    const contributions = Array.from(
      LeaderboardManager.instance(setup.components).getHyperstructuresWithContributionsFromPlayer(
        ContractAddress(account.address),
      ),
    );
    const epochs = getEpochs();

    await setup.systemCalls.end_game({
      signer: account,
      hyperstructure_contributed_to: contributions,
      hyperstructure_shareholder_epochs: epochs,
    });
  }, [hasReachedFinalPoints]);

  return (
    <Button
      variant="primary"
      className={clsx("self-center")}
      onMouseOver={() => {
        setTooltip({
          position: "bottom",
          content: (
            <span className="flex flex-col whitespace-nowrap pointer-events-none">
              <span className="flex justify-center">
                {playerPoints.toLocaleString()} / {pointsForWin.toLocaleString()}
              </span>
              {!hasReachedFinalPoints && <span>Not enough points to end the season</span>}
            </span>
          ),
        });
      }}
      onMouseOut={() => {
        setTooltip(null);
      }}
      style={{ background: gradient }}
      onClick={endGame}
    >
      End season
    </Button>
  );
};
