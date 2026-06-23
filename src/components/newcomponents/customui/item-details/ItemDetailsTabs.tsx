import React, { useMemo, useState } from 'react';

import { Tabs } from '@/components/ui/tabs';

import {

  EmphasisTabPanel,

  EmphasisTabsList,

  EmphasisTabsProvider,

  EmphasisTabsTrigger,

} from '@/components/newcomponents/customui/EmphasisTabSwitcher';

import type { ItemSummary } from '@/types/itemSummary';

import type { ItemDetailsSectionId } from './itemDetailsTypes';

import { hasBomUsage, hasOnHandData } from './itemDetailsShared';

import type { PurchasingPeriod } from './itemDetailsPurchasing';

import { ActivitySection } from './sections/ActivitySection';

import OverviewSection from './sections/OverviewSection';

import { PlacementSection } from './sections/PlacementSection';

import { PurchasingSection } from './sections/PurchasingSection';



interface ItemDetailsTabsProps {

  summary: ItemSummary;

  unit: string;

  itemId: number;

  dialogOpen: boolean;

  purchasingPeriod: PurchasingPeriod;

  onPurchasingPeriodChange: (period: PurchasingPeriod) => void;

  onNavigate: () => void;

}



function getVisibleSections(summary: ItemSummary): { id: ItemDetailsSectionId; label: string }[] {

  const sections: { id: ItemDetailsSectionId; label: string }[] = [

    { id: 'overview', label: 'Overview' },

  ];



  if (hasOnHandData(summary) || hasBomUsage(summary)) {

    sections.push({ id: 'placement', label: 'Placement' });

  }



  sections.push({ id: 'purchasing', label: 'Purchasing' });



  if (summary.recent_activity.length > 0) {

    sections.push({ id: 'activity', label: 'Activity' });

  }



  return sections;

}



const ItemDetailsTabs: React.FC<ItemDetailsTabsProps> = ({

  summary,

  unit,

  itemId,

  dialogOpen,

  purchasingPeriod,

  onPurchasingPeriodChange,

  onNavigate,

}) => {

  const sections = useMemo(() => getVisibleSections(summary), [summary]);

  const [activeTab, setActiveTab] = useState<ItemDetailsSectionId>('overview');



  const tabValue = sections.some((s) => s.id === activeTab)

    ? activeTab

    : (sections[0]?.id ?? 'overview');



  const showPlacement = sections.some((s) => s.id === 'placement');

  const showActivity = sections.some((s) => s.id === 'activity');



  return (

    <EmphasisTabsProvider value={tabValue}>

      <Tabs value={tabValue} onValueChange={(v) => setActiveTab(v as ItemDetailsSectionId)}>

        <EmphasisTabsList className="mb-4">

          {sections.map((section) => (

            <EmphasisTabsTrigger key={section.id} value={section.id}>

              {section.label}

            </EmphasisTabsTrigger>

          ))}

        </EmphasisTabsList>



        <EmphasisTabPanel panelKey={tabValue} className="mt-0">

          {tabValue === 'overview' ? (

            <OverviewSection

              summary={summary}

              unit={unit}

              onGoToTab={setActiveTab}

              showPlacement={showPlacement}

              showActivity={showActivity}

            />

          ) : null}



          {tabValue === 'placement' && showPlacement ? (

            <PlacementSection

              summary={summary}

              unit={unit}

              itemId={itemId}

              onNavigate={onNavigate}

            />

          ) : null}



          {tabValue === 'purchasing' ? (

            <PurchasingSection

              summary={summary}

              unit={unit}

              period={purchasingPeriod}

              onPeriodChange={onPurchasingPeriodChange}

              onNavigate={onNavigate}

              itemId={itemId}

              dialogOpen={dialogOpen}

            />

          ) : null}



          {tabValue === 'activity' && showActivity ? (

            <ActivitySection summary={summary} itemId={itemId} onNavigate={onNavigate} />

          ) : null}

        </EmphasisTabPanel>

      </Tabs>

    </EmphasisTabsProvider>

  );

};



export default ItemDetailsTabs;

