import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useAuth } from "@/context/AuthContext";
import { FC, useEffect, useState } from "react";
import { Order, OrderedPart, PartHistory } from "@/types";
import { Loader2 } from "lucide-react";
import { convertUtcToBDTime } from "@/services/helper";
import {
  calculateTotalCost,
  getOrderedPartHistory,
} from "@/services/OrderedPartsService";
import { Separator } from "../ui/separator";

interface InvoiceSectionProp {
  order: Order;
  orderPartList: OrderedPart[];
  orderedPartsLoading: boolean;
}

const InvoiceTable: FC<InvoiceSectionProp> = ({
  order,
  orderPartList,
  orderedPartsLoading,
}) => {
  const { hasFeatureAccess } = useAuth();
  const canSeeFinance = hasFeatureAccess("finance_visibility");

  const [totalCost, setTotalCost] = useState<string>(" - ");
  const [partHistoryMap, setPartHistoryMap] = useState<Record<number, PartHistory>>({});

  useEffect(() => {
    const total = calculateTotalCost(orderPartList);
    setTotalCost(total);
  }, [orderedPartsLoading, orderPartList]);

  useEffect(() => {
    const fetchAllPartHistories = async () => {
      const allPartsHistoryMap = await getOrderedPartHistory(orderPartList, order);
      setPartHistoryMap(allPartsHistoryMap);
    };

    if (!orderedPartsLoading && orderPartList.length > 0 && canSeeFinance) {
      // Only fetch extra finance-y history when the user can see it
      fetchAllPartHistories();
    } else {
      setPartHistoryMap({});
    }
  }, [orderedPartsLoading, orderPartList, order, canSeeFinance]);

  return (
    <div>
      <h2 className="text-2xl">Parts Ordered</h2>
      <Separator className="my-2" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Part</TableHead>
            {canSeeFinance && <TableHead>Brand</TableHead>}
            {canSeeFinance && <TableHead>Vendor</TableHead>}
            <TableHead>Qty(Unit)</TableHead>
            {canSeeFinance && <TableHead>Cost/Unit</TableHead>}
            {canSeeFinance && <TableHead>Subtotal</TableHead>}
          </TableRow>
        </TableHeader>

        {orderedPartsLoading ? (
          <div className="flex flex-row justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <TableBody>
            {orderPartList.map((orderedPart, index) => {
              const history = partHistoryMap[orderedPart.part_id];

              return (
                <TableRow key={orderedPart.id}>
                  <TableCell>{index + 1}.</TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <a
                        className="font-bold text-lg hover:underline"
                        target="_blank"
                        href={`/viewpart/${orderedPart.part_id}`}
                        rel="noreferrer"
                      >
                        {orderedPart.parts.name}
                      </a>

                      {canSeeFinance && (
                        <div className="flex gap-2">
                          <div className="whitespace-nowrap text-xs font-bold">
                            MRR: {orderedPart.mrr_number || "-"}
                          </div>
                          <div className="text-xs">
                            Received Date:{" "}
                            {orderedPart.part_received_by_factory_date
                              ? convertUtcToBDTime(
                                  orderedPart.part_received_by_factory_date
                                ).split(",")[0]
                              : "-"}
                          </div>
                        </div>
                      )}

                      {canSeeFinance && (
                        <>
                          <div className="mt-1 text-xs">History:</div>
                          <div className="flex gap-2">
                            <div className="whitespace-nowrap text-xs">
                              Cost:{" "}
                              {history?.lastUnitCost
                                ? `BDT ${history.lastUnitCost}`
                                : "-"}
                            </div>
                            <div className="text-xs">
                              Vendor: {history?.lastVendor ?? "-"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="text-xs">
                              LP Date:{" "}
                              {history?.lastPurchaseDate
                                ? convertUtcToBDTime(
                                    history.lastPurchaseDate
                                  ).split(",")[0]
                                : "-"}
                            </div>
                            <div className="text-xs">
                              Change Date:{" "}
                              {history?.lastChangeDate
                                ? convertUtcToBDTime(
                                    history.lastChangeDate
                                  ).split(",")[0]
                                : "-"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {canSeeFinance && (
                    <TableCell>{orderedPart.brand || "-"}</TableCell>
                  )}
                  {canSeeFinance && (
                    <TableCell>{orderedPart.vendor || "-"}</TableCell>
                  )}

                  <TableCell className="whitespace-nowrap">
                    {orderedPart.qty} ({orderedPart.parts.unit})
                  </TableCell>

                  {canSeeFinance && (
                    <TableCell className="whitespace-nowrap">
                      {orderedPart.unit_cost ?? "-"}
                    </TableCell>
                  )}
                  {canSeeFinance && (
                    <TableCell className="whitespace-nowrap">
                      {orderedPart.unit_cost
                        ? orderedPart.unit_cost * orderedPart.qty
                        : "-"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>

      {canSeeFinance && (
        <div className="flex justify-end mt-4">
          <span className="font-bold">Total: {totalCost}</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;
