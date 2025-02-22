import { useBlockTimestamp } from "@/hooks/helpers/use-block-timestamp";
import { useModalStore } from "@/hooks/store/use-modal-store";
import { useUIStore } from "@/hooks/store/use-ui-store";
import { LeftView } from "@/types";
import { EntityResourceTable } from "@/ui/components/resources/entity-resource-table";
import { MarketModal } from "@/ui/components/trading/market-modal";
import { BuildingThumbs, IS_MOBILE, MenuEnum } from "@/ui/config";
import { BaseContainer } from "@/ui/containers/base-container";
import CircleButton from "@/ui/elements/circle-button";
import { KeyBoardKey } from "@/ui/elements/keyboard-key";
import { Chat } from "@/ui/modules/chat/chat";
import { getBlockTimestamp } from "@/utils/timestamp";
import { ContractAddress, getEntityInfo } from "@bibliothecadao/eternum";
import { useDojo, usePlayerArrivalsNotifications, useQuery } from "@bibliothecadao/react";
import { motion } from "framer-motion";
import { Suspense, lazy, memo, useEffect, useMemo } from "react";
import { construction, military, trade, worldStructures } from "../../components/navigation/config";

const EntityDetails = lazy(() =>
  import("@/ui/modules/entity-details/entity-details").then((module) => ({ default: module.EntityDetails })),
);
const Military = lazy(() => import("@/ui/modules/military/military").then((module) => ({ default: module.Military })));
const SelectPreviewBuildingMenu = lazy(() =>
  import("@/ui/components/construction/select-preview-building").then((module) => ({
    default: module.SelectPreviewBuildingMenu,
  })),
);
const StructureConstructionMenu = lazy(() =>
  import("@/ui/components/structures/construction/structure-construction-menu").then((module) => ({
    default: module.StructureConstructionMenu,
  })),
);
const WorldStructuresMenu = lazy(() =>
  import("@/ui/modules/world-structures/world-structures-menu").then((module) => ({
    default: module.WorldStructuresMenu,
  })),
);

const AllResourceArrivals = lazy(() =>
  import("@/ui/components/trading/resource-arrivals").then((module) => ({ default: module.AllResourceArrivals })),
);

export const LeftNavigationModule = memo(() => {
  const {
    account: { account },
    setup: { components },
  } = useDojo();

  const view = useUIStore((state) => state.leftNavigationView);
  const setView = useUIStore((state) => state.setLeftNavigationView);

  const isPopupOpen = useUIStore((state) => state.isPopupOpen);
  const openedPopups = useUIStore((state) => state.openedPopups);

  const structureEntityId = useUIStore((state) => state.structureEntityId);

  const { toggleModal } = useModalStore();
  const { isMapView } = useQuery();
  const { currentBlockTimestamp } = useBlockTimestamp();

  const { arrivedNotificationLength, arrivals } = usePlayerArrivalsNotifications(currentBlockTimestamp);

  const structureInfo = useMemo(
    () =>
      getEntityInfo(
        structureEntityId,
        ContractAddress(account.address),
        getBlockTimestamp().currentDefaultTick,
        components,
      ),
    [structureEntityId, account.address, components],
  );
  const structureIsMine = useMemo(() => structureInfo.isMine, [structureInfo]);

  const isRealm = useMemo(
    () => Boolean(structureInfo) && String(structureInfo?.structureCategory) === "Realm",
    [structureInfo],
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "e":
          setView(view === LeftView.EntityView ? LeftView.None : LeftView.EntityView);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [view, setView, toggleModal]);

  const navigation = useMemo(() => {
    const baseNavigation = [
      {
        name: MenuEnum.entityDetails,
        button: (
          <div className="relative">
            <CircleButton
              className="entity-details-selector"
              image={BuildingThumbs.hex}
              tooltipLocation="top"
              label="Details"
              active={view === LeftView.EntityView}
              size={IS_MOBILE ? "lg" : "xl"}
              onClick={() => setView(view === LeftView.EntityView ? LeftView.None : LeftView.EntityView)}
            />
            {!IS_MOBILE && (
              <KeyBoardKey invertColors={view === LeftView.EntityView} className="absolute top-1 right-1" keyName="E" />
            )}
          </div>
        ),
      },
      {
        name: MenuEnum.military,
        button: (
          <CircleButton
            disabled={!structureIsMine}
            className="military-selector"
            image={BuildingThumbs.military}
            tooltipLocation="top"
            label={military}
            active={view === LeftView.MilitaryView}
            size={IS_MOBILE ? "lg" : "xl"}
            onClick={() => setView(view === LeftView.MilitaryView ? LeftView.None : LeftView.MilitaryView)}
          />
        ),
      },
      {
        name: MenuEnum.construction,
        button: (
          <CircleButton
            disabled={!structureIsMine || !isRealm}
            className="construction-selector"
            image={BuildingThumbs.construction}
            tooltipLocation="top"
            label={construction}
            active={view === LeftView.ConstructionView}
            size={IS_MOBILE ? "lg" : "xl"}
            onClick={() => setView(view === LeftView.ConstructionView ? LeftView.None : LeftView.ConstructionView)}
          />
        ),
      },
      {
        name: MenuEnum.resourceArrivals,
        button: (
          <CircleButton
            disabled={!structureIsMine}
            image={BuildingThumbs.trade}
            tooltipLocation="top"
            label="Resource Arrivals"
            active={view === LeftView.ResourceArrivals}
            size={IS_MOBILE ? "lg" : "xl"}
            onClick={() => setView(view === LeftView.ResourceArrivals ? LeftView.None : LeftView.ResourceArrivals)}
            primaryNotification={{ value: arrivedNotificationLength, color: "green", location: "topright" }}
          />
        ),
      },
      {
        name: MenuEnum.worldStructures,
        button: (
          <CircleButton
            disabled={!structureIsMine}
            image={BuildingThumbs.worldStructures}
            tooltipLocation="top"
            label={worldStructures}
            active={view === LeftView.WorldStructuresView}
            size={IS_MOBILE ? "lg" : "xl"}
            onClick={() =>
              setView(view === LeftView.WorldStructuresView ? LeftView.None : LeftView.WorldStructuresView)
            }
          />
        ),
      },
      {
        name: MenuEnum.trade,
        button: (
          <CircleButton
            disabled={!structureIsMine}
            className="trade-selector"
            image={BuildingThumbs.scale}
            tooltipLocation="top"
            label={trade}
            active={isPopupOpen(trade)}
            size={IS_MOBILE ? "lg" : "xl"}
            onClick={() => toggleModal(isPopupOpen(trade) ? null : <MarketModal />)}
          />
        ),
      },
      {
        name: MenuEnum.resourceTable,
        button: (
          <CircleButton
            image={BuildingThumbs.resources}
            size={IS_MOBILE ? "lg" : "xl"}
            tooltipLocation="top"
            label="Balance"
            active={view === LeftView.ResourceTable}
            onClick={() => setView(view === LeftView.ResourceTable ? LeftView.None : LeftView.ResourceTable)}
          />
        ),
      },
    ];

    const filteredNavigation = baseNavigation.filter((item) =>
      [
        MenuEnum.entityDetails,
        MenuEnum.military,
        MenuEnum.construction,
        MenuEnum.worldStructures,
        MenuEnum.resourceArrivals,
        MenuEnum.trade,
        ...(IS_MOBILE ? [MenuEnum.resourceTable] : []),
      ].includes(item.name as MenuEnum),
    );

    return filteredNavigation;
  }, [view, openedPopups, structureEntityId, isMapView, structureIsMine, isRealm, arrivedNotificationLength]);

  const slideLeft = {
    hidden: { x: "-100%" },
    visible: { x: "0%", transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col">
      <div className="flex-grow overflow-hidden">
        <div
          className={`max-h-full transition-all duration-200 space-x-1 flex gap-2 z-0 w-screen pr-2 md:pr-0 md:w-[600px] text-gold left-10 md:pt-20 pointer-events-none ${
            isOffscreen(view) ? (IS_MOBILE ? "-translate-x-[92%]" : "-translate-x-[88%]") : ""
          }`}
        >
          <BaseContainer
            className={`w-full pointer-events-auto rounded-r-2xl overflow-y-auto max-h-[60vh] md:max-h-[60vh] sm:max-h-[80vh] xs:max-h-[90vh] border-r-2 border-y-2 border-gold/20`}
          >
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              {view === LeftView.EntityView && <EntityDetails />}
              {view === LeftView.MilitaryView && <Military entityId={structureEntityId} />}
              {!isMapView && view === LeftView.ConstructionView && (
                <SelectPreviewBuildingMenu entityId={structureEntityId} />
              )}
              {isMapView && view === LeftView.ConstructionView && (
                <StructureConstructionMenu entityId={structureEntityId} />
              )}
              {view === LeftView.WorldStructuresView && <WorldStructuresMenu />}
              {view === LeftView.ResourceArrivals && <AllResourceArrivals arrivals={arrivals} />}
              {view === LeftView.ResourceTable && <EntityResourceTable entityId={structureEntityId} />}
            </Suspense>
          </BaseContainer>
          <motion.div
            variants={slideLeft}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center pointer-events-auto"
          >
            <div className="flex flex-col gap-1 md:gap-2 mb-auto">
              {navigation.map((item, index) => (
                <div key={index}>{item.button}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      {!IS_MOBILE && (
        <div className="flex">
          <Chat />
          {/* <EventStream /> */}
        </div>
      )}
    </div>
  );
});

LeftNavigationModule.displayName = "LeftNavigationModule";

const isOffscreen = (view: LeftView) => {
  return view === LeftView.None;
};
