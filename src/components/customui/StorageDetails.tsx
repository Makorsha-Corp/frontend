import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Props = {
  factoryName?: string;
  totalItems?: number;
  totalValue?: number;
};

const StorageDetails = ({ factoryName, totalItems, totalValue }: Props) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="w-80 flex-shrink-0">
      <Card className="mb-4 h-full">
        <CardHeader>
          <CardTitle>Storage Details</CardTitle>
          <CardDescription>Overview of selected storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>Factory: {factoryName || "-"}</div>
            {typeof totalItems === 'number' && <div>Total Items: {totalItems}</div>}
            {typeof totalValue === 'number' && (
              <div className="text-lg font-semibold text-green-600">
                Total Value: {totalValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageDetails;


