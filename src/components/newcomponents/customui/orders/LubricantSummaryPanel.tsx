import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { LubricantRollupLine } from '@/pages/newpages/orders/workOrderSheetData';
import { cn } from '@/lib/utils';

export interface LubricantSummaryPanelProps {
  lines: LubricantRollupLine[];
  isLoading?: boolean;
  className?: string;
}

const LubricantSummaryPanel: React.FC<LubricantSummaryPanelProps> = ({ lines, isLoading, className }) => {
  return (
    <Card className={cn('flex min-h-0 flex-col border-border shadow-sm', className)}>
      <CardHeader className="shrink-0 border-b border-border py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-brand-primary" />
          Parts summary
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : lines.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No parts in this view.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Need</th>
                <th className="px-3 py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const low =
                  line.inStock != null && line.inStock < line.requiredQty;
                return (
                  <tr key={line.itemId} className="border-b border-border/50">
                    <td className="px-3 py-2">
                      <div className="font-medium">{line.name}</div>
                      <div className="text-[10px] text-muted-foreground">{line.unit}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {line.requiredQty}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right tabular-nums',
                        low && 'text-destructive font-medium',
                      )}
                    >
                      {line.inStock != null ? line.inStock : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};

export default LubricantSummaryPanel;
