import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ActiveOrdersPanel from '@/components/newcomponents/customui/RunningOrdersPlaceholder';

interface StorageActiveOrdersBannerProps {
  factoryId: number | null;
}

const StorageActiveOrdersBanner: React.FC<StorageActiveOrdersBannerProps> = ({ factoryId }) => {
  if (!factoryId) {
    return (
      <div className="shrink-0 border-b border-border bg-muted/30 px-8 py-2.5">
        <p className="text-xs text-muted-foreground">
          Select a factory to see active orders affecting storage.
        </p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-border bg-card px-8 py-3">
      <Card className="border-border bg-muted/20 shadow-none">
        <CardContent className="p-3">
          <ActiveOrdersPanel scope={{ factoryId }} minimal compact />
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageActiveOrdersBanner;
