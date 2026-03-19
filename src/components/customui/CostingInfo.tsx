import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface CostingInfoProp {
    vendor: string | null
    price: number | null
}
export const CostingInfo: React.FC<CostingInfoProp> = ({vendor,price}) => {
  return (
    <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
        <CardHeader className="pb-3">
        <CardTitle>Costing</CardTitle>
        </CardHeader>
        <Separator className="my-4"/>
        <CardContent>
        <ul className="grid gap-3">
            <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Vendor</span>
            <span>{vendor || '-'}</span>
            </li>
            <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Unit Cost</span>
            <span>{price || '-'}</span>
            </li>
        </ul>
        </CardContent>
    </Card>
  )
}
