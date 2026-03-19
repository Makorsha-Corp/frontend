import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { ExternalLink, Loader2, Notebook, NotebookPen } from "lucide-react"
import { useEffect, useState } from "react"
import { Order, OrderedPart, PartHistory } from "@/types"
import { calculateTotalCost, getOrderedPartHistory } from "@/services/OrderedPartsService"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog"
import OrderedPartInfo from "./OrderedPartInfo"
import { Badge } from "../ui/badge"
import { convertUtcToBDTime } from "@/services/helper"

interface ViewOrderedPartsSection {
  order: Order;
  orderPartList: OrderedPart[];
  orderedPartsLoading: boolean;
}

const ViewOrderedPartsSection:React.FC<ViewOrderedPartsSection> = ({order, orderPartList, orderedPartsLoading}) => {
    const profile = useAuth().profile
    const [totalCost, setTotalCost] = useState<string>(" - ");
    const [partHistoryMap, setPartHistoryMap] = useState<Record<number, PartHistory>>({});
    const { hasFeatureAccess } = useAuth();
    const canSeeFinance = hasFeatureAccess("finance_visibility");
    
    useEffect(() => {
        const totalCost = calculateTotalCost(orderPartList);
        setTotalCost(totalCost);
    }, [orderedPartsLoading]);

    useEffect(() => {
        const fetchAllPartHistories = async () => {
        const allPartsHistoryMap = await getOrderedPartHistory(orderPartList, order)
        setPartHistoryMap(allPartsHistoryMap);
        };

        if (!orderedPartsLoading && orderPartList.length > 0) {
        fetchAllPartHistories();
        }
    }, [orderedPartsLoading]);
    
    
    return(      
      <Card x-chunk="dashboard-06-chunk-0" className="mt-1">
      <CardHeader>
          <CardTitle>Parts Ordered</CardTitle>
          <CardDescription>
          <p>This is a list of parts that were ordered.</p>
          </CardDescription>
      </CardHeader>
      {(orderedPartsLoading===true)? (
                  <div className='animate-spin flex flex-row justify-center p-5'>
                      <Loader2 />
                  </div>
        ):
      <CardContent>
        <Table>
        <TableHeader>
        <TableRow>
            <TableHead></TableHead>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            {canSeeFinance && <TableHead className="whitespace-nowrap">Last Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap">Last Vendor</TableHead>
            <TableHead className="whitespace-nowrap">Last Purchase Date</TableHead>
            <TableHead className="whitespace-nowrap">Last Change Date</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Qty</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Unit</TableHead>
            {canSeeFinance && <TableHead className="whitespace-nowrap hidden md:table-cell">Brand</TableHead>}
            {canSeeFinance && <TableHead className="whitespace-nowrap hidden md:table-cell">Vendor</TableHead>}
            {canSeeFinance && <TableHead className="whitespace-nowrap hidden md:table-cell">Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Note</TableHead>
            {canSeeFinance && <TableHead className="whitespace-nowrap hidden md:table-cell">Office Note</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Purchased</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Sent To Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Received By Factory</TableHead>
            <TableHead className="whitespace-nowrap">MRR number</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Office Sample Sent/Received</TableHead>
            <TableHead className="md:hidden">Info</TableHead>
        </TableRow>
        </TableHeader>
        {orderedPartsLoading? (
            <div className='flex flex-row justify-center'>
                <Loader2 className='h-8 w-8 animate-spin'/>
            </div>
        ):
        
            <TableBody>
            {orderPartList.map((orderedPartInfo,index) => {      
              const history = partHistoryMap[orderedPartInfo.part_id];
              return( 
              <TableRow>
                      <TableCell>{index+1}.</TableCell>
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
                      {canSeeFinance && (
                        <TableCell className="whitespace-nowrap">
                          {history?.lastUnitCost ? `BDT ${history.lastUnitCost}` : '-'}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        {history?.lastVendor ?? '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {history?.lastPurchaseDate
                          ? convertUtcToBDTime(history.lastPurchaseDate).split(',')[0]
                          : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {history?.lastChangeDate
                          ? convertUtcToBDTime(history.lastChangeDate).split(',')[0]
                          : '-'}
                      </TableCell>
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
                      {canSeeFinance && <TableCell className="hidden md:table-cell">
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
                      </TableCell>}
                      <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date? (convertUtcToBDTime(orderedPartInfo.part_purchased_date)).split(',')[0] : '-'}</TableCell>
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
                  </TableRow>
              );
              })}
              {canSeeFinance && ( <TableRow>
                <TableCell className="font-bold">Total:</TableCell>
                <TableCell className="font-bold">{totalCost}</TableCell>
              </TableRow>
              )}
            </TableBody>
        }  
      </Table>
      </CardContent>
    }
    </Card>
    )
}

export default ViewOrderedPartsSection