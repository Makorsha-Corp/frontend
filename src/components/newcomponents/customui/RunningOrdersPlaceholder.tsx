import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Placeholder for Running Orders section.
 * Same structure as legacy RunningOrders component - ready to swap when orders API is implemented.
 */
const RunningOrdersPlaceholder: React.FC = () => {
  return (
    <div className="flex-1">
      <Card className="mb-4 h-full">
        <CardHeader>
          <CardTitle>Running Orders</CardTitle>
          <CardDescription>A list of current running orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead className="w-[100px]">Req #</TableHead>
                <TableHead className="w-[120px]">Created At</TableHead>
                <TableHead>Order Note</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center h-[250px] text-muted-foreground">
                  Running orders – coming soon
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunningOrdersPlaceholder;
