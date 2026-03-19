
import { TableCell, TableRow } from "../../ui/table"
import { Button } from "../../ui/button"
import { ExternalLink, MoreHorizontal, Notebook, NotebookPen,  } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../ui/dialog"
import React, { useEffect, useState } from "react"

import { Order, OrderedPart } from "@/types"

import { getOrderedPartHistory } from "@/services/OrderedPartsService"
import OrderedPartInfo from "../OrderedPartInfo"
import { convertUtcToBDTime} from "@/services/helper"

import { fetchStoragePartByFactoryAndPartID } from "@/services/StorageService"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "../../ui/badge"
import OrderedPartsActionMenu from "./OrderedPartsActionMenu"


interface ManagerowtemporaryProp{
    index: number
    order: Order
    orderedPartInfo: OrderedPart
}

export const Managerowtemporary:React.FC<ManagerowtemporaryProp> = ({index, order, orderedPartInfo}) => {
  const { hasFeatureAccess } = useAuth();
  const canSeeFinance = hasFeatureAccess("finance_visibility");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [lastUnitCost, setLastUnitCost] = useState<number | null>(null);
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string | null>(null); // assuming date is string
  const [lastVendor, setLastVendor] = useState<string|null>(null);
  const [lastChangeDate, setLastChangeDate] = useState<string|null>(null)
  const [disableTakeStorageRow, setDisableTakeStorageRow] = useState(false);
  const [currentStorageQty,setCurrentStorageQty] = useState<number|null>(null)

    useEffect(() => {
    const run = async () => {
        //Check if the row should be disabled since parts were taken from storage
        const disableRow = orderedPartInfo.in_storage && orderedPartInfo.approved_storage_withdrawal && orderedPartInfo.qty === 0;
        setDisableTakeStorageRow(disableRow);

        // If the order type is "Machine", get current storage quantity
        if (order.order_type === "PFM") {
        const storageData = await fetchStoragePartByFactoryAndPartID(orderedPartInfo.part_id,order.factory_id);
        if (storageData) {
            setCurrentStorageQty(storageData.qty);
        } else {
            console.log(`No storage data found for part_id ${orderedPartInfo.part_id} in factory_id ${order.factory_id}`);
        }
        }

        // Fetch part history using shared helper
        const historyMap = await getOrderedPartHistory([orderedPartInfo], order);
        const history = historyMap[orderedPartInfo.part_id];

        setLastUnitCost(history.lastUnitCost);
        setLastPurchaseDate(history.lastPurchaseDate);
        setLastVendor(history.lastVendor);
        setLastChangeDate(history.lastChangeDate);
    };

    run();
    }, []);

    return(
        <TableRow
        className={`cursor-pointer ${
            disableTakeStorageRow ? 'bg-gray-300 pointer-events-none' : ''
        } transition duration-200 ease-in-out`}
        >
        <TableCell>{index}.</TableCell>
        <TableCell>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
                onClick={() => setIsActionMenuOpen(true)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
        </TableCell>
        <TableCell className="whitespace-nowrap"><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a></TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
          className={orderedPartInfo.in_storage ? "bg-green-100" : "bg-red-100"}
          variant="secondary"
        >
          {orderedPartInfo.in_storage ? "Yes" : "No"}
         </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
            className={orderedPartInfo.approved_storage_withdrawal ? "bg-green-100" : "bg-red-100"}
            variant="secondary"
          >
            {orderedPartInfo.approved_storage_withdrawal ? `${orderedPartInfo.qty_taken_from_storage}` : "No"}
          </Badge>
        </TableCell>        
        <TableCell className="whitespace-nowrap">{currentStorageQty? currentStorageQty : "-"}</TableCell>
        {canSeeFinance && <TableCell className="whitespace-nowrap">{lastUnitCost?`BDT ${lastUnitCost}` : '-'}</TableCell>}
        <TableCell className="whitespace-nowrap">{lastVendor? lastVendor: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastPurchaseDate? convertUtcToBDTime(lastPurchaseDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastChangeDate? convertUtcToBDTime(lastChangeDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.qty}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.parts.unit}</TableCell>
        {canSeeFinance && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.brand || '-'}</TableCell>}
        {canSeeFinance && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.vendor || '-'}</TableCell>}
        {canSeeFinance && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.unit_cost || '-'}</TableCell>}
        <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.note?
            (
              <Dialog>
                <DialogTrigger asChild>
                  <Notebook className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <div>{orderedPartInfo.note}</div>    
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
        </TableCell>
        {canSeeFinance && 
          <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.office_note?
            ( <Dialog>
                <DialogTrigger asChild>
                  <NotebookPen className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Office Note</DialogTitle>
                    {orderedPartInfo.office_note.split('\n').map((line, index) => (
                    <p key={index}>
                      {line}
                    </p>
                   ))}
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
          </TableCell>
        }
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date ? (convertUtcToBDTime(orderedPartInfo.part_purchased_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_sent_by_office_date ? (convertUtcToBDTime(orderedPartInfo.part_sent_by_office_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_received_by_factory_date ? (convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.mrr_number? orderedPartInfo.mrr_number: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{`${orderedPartInfo.is_sample_sent_to_office? 'Yes': 'No'} / ${orderedPartInfo.is_sample_received_by_office? 'Yes': 'No'}`}</TableCell>
        <TableCell className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <ExternalLink className="hover:cursor-pointer"/>
              </DialogTrigger>
                <DialogContent className="">
                  <OrderedPartInfo 
                    orderedPart={orderedPartInfo}                
                  />    
                </DialogContent>
            </Dialog>
        </TableCell>

            <OrderedPartsActionMenu
                order={order}
                orderedPartInfo={orderedPartInfo}
                isOpen={isActionMenuOpen}
                setIsOpen={setIsActionMenuOpen}
            />
        </TableRow>
        
        
    ) 
}
export default Managerowtemporary