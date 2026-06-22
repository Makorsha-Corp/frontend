import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <Tabs value={tabValue} onValueChange={(v) => setActiveTab(v as ItemDetailsSectionId)}>
      <TabsList className="mb-4 h-9 w-full flex-wrap justify-start">
        {sections.map((section) => (
          <TabsTrigger key={section.id} value={section.id} className="text-xs">
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <OverviewSection
          summary={summary}
          unit={unit}
          onGoToTab={setActiveTab}
          showPlacement={showPlacement}
          showActivity={showActivity}
        />
      </TabsContent>

      {showPlacement ? (
        <TabsContent value="placement" className="mt-0">
          <PlacementSection
            summary={summary}
            unit={unit}
            itemId={itemId}
            onNavigate={onNavigate}
          />
        </TabsContent>
      ) : null}

      <TabsContent value="purchasing" className="mt-0">
        <PurchasingSection
          summary={summary}
          unit={unit}
          period={purchasingPeriod}
          onPeriodChange={onPurchasingPeriodChange}
          onNavigate={onNavigate}
          itemId={itemId}
          dialogOpen={dialogOpen}
        />
      </TabsContent>

      {showActivity ? (
        <TabsContent value="activity" className="mt-0">
          <ActivitySection summary={summary} itemId={itemId} onNavigate={onNavigate} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
};

export default ItemDetailsTabs;
