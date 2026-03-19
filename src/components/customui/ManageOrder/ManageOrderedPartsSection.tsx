import { Order, OrderedPart, Part } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { useEffect, useState } from "react";
import { fetchOrderedPartsByOrderID } from "@/services/OrderedPartsService";
import toast from "react-hot-toast";
import { Flag, FlagOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { getNextStatusIdFromSequence, isLastStatusInWorkflow, isRevertStatusAllowed, isStatusActionsComplete } from "@/services/helper";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { deleteOrderByID, UpdateStatusByID } from "@/services/OrdersService";
import { InsertStatusTracker } from "@/services/StatusTrackerService";
import { useNavigate } from 'react-router-dom';
import { showAddPartButton , showAllBudgetApproveButton, showOfficeOrderApproveButton, showPendingOrderApproveButton } from "@/services/ButtonVisibilityHelper";
import { useAuth } from "@/context/AuthContext";
import { supabase_client } from "@/services/SupabaseClient";

import Managerowtemporary from "./ManageOrderedPartsRow";
import AddNewPartToOrderAction from "./Actions/AddNewPartToOrderAction";
import ApproveAllPendingAction from "./Actions/ApproveAllPendingAction";
import AdvanceOrderDialog from "./Actions/AdvanceOrderAction";
import ApproveAllFromOfficeAction from "./Actions/ApproveAllFromOfficeAction";
import ApproveAllBudgetAction from "./Actions/ApproveAllBudgetAction";

interface ManageOrderedPartsSectionProp {
  order: Order
  parts: Part[]
}


const ManageOrderedPartsSection:React.FC<ManageOrderedPartsSectionProp> = ({order, parts}) => {
  const profile = useAuth().profile
  const { hasFeatureAccess } = useAuth();
  const canSeeFinance = hasFeatureAccess("finance_visibility");
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [showActionsCompletedPopup, setShowActionsCompletedPopup] = useState(false);
  const [showEmptyOrderPopup, setShowEmptyOrderPopup] = useState(false);
  const [loadingTableButtons, setLoadingTableButtons] =useState(false)
  const [loadingAddPart, setLoadingAddPart] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false)
  const [isApprovePendingDialogOpen, setIsApprovePendingDialogOpen] = useState(false)
  const [isApproveAllOfficeDialogOpen, setisApproveAllOfficeDialogOpen] = useState(false)
  const [isApproveAllBudgetDialogOpen, setApproveAllBudgetDialogOpen] = useState(false)
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false)
  const navigate = useNavigate()
  const [totalCost, setTotalCost] = useState<string>(" - ")
  const [costBreakdown, setCostBreakdown] = useState<string>("Total Cost Breakdown: -")
  const [runCount, setRunCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanceButton, setShowAdvanceButton] = useState<boolean>(false)
  const [showRevertButton, setShowRevertButton] = useState<boolean>(false)
  const [isAdvanceDialogOpen,setIsAdvanceDialogOpen] = useState<boolean>(false)
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState<boolean>(false)


  
  
  const deleteEmptyOrder = async () => {
    setShowEmptyOrderPopup(true);
    try {
            await deleteOrderByID(order.id) 
        } 
    catch (error) {
        toast.error("Could not delete order by id")
    }
    toast.success("Empty order was removed")
    handleNavigation()
  }


const loadOrderedParts = async () => {
    try {
      setLoadingTable(true)
      const order_id = order.id
      const orderedPartsList = await fetchOrderedPartsByOrderID(order_id)
      if (orderedPartsList) {
        setOrderedParts(orderedPartsList)
        if (orderedPartsList.length===0){
          await deleteEmptyOrder()
        }
        return orderedPartsList
      }
      else {
        toast.error("Could not load ordered parts for this order")
      }
    } catch (error) {
      toast.error("Error loading parts")
    } finally {
      setLoadingTable(false);
    }
  }



const handleRevertOrderStatus = async() => {
  setLoadingTableButtons(true)
  if (!profile) {
    toast.error("Profile not found")
    return
  }
  try {
    const prevStatus = 3 //always goes back to waiting for quotation status
    await UpdateStatusByID(order.id, prevStatus)
    await InsertStatusTracker((new Date()), order.id, profile.id, prevStatus)
    toast.success("Successfully reverted status to Waiting For Quotation")
  } catch (error) {
    toast.error("Error occured while reverting status")
  } finally {
    setLoadingTableButtons(false)
    setIsRevertDialogOpen(false)
  }
};

const updateOrderStatus = async () => {
  const updatedOrderedParts = await loadOrderedParts();

  if (updatedOrderedParts) {
    const actionsComplete = isStatusActionsComplete(updatedOrderedParts, order.statuses.name);
    const nextStatusId = getNextStatusIdFromSequence(order.order_workflows.status_sequence, order.statuses.id);
    const isLast = isLastStatusInWorkflow(order.order_workflows.status_sequence, order.statuses.id);
    console.log("actions complete:" + actionsComplete+" next statusid: "+nextStatusId+" is last statuse: "+isLast)
    setShowRevertButton(isRevertStatusAllowed(updatedOrderedParts, order.statuses.name));
    
    if (actionsComplete && isLast) {
      setIsOrderCompleted(true)
    }

    if (actionsComplete && !isLast && nextStatusId && nextStatusId !== order.statuses.id) {
      setShowAdvanceButton(true);
    } else {
      setShowAdvanceButton(false);
    }
  }
};



const calculateTotalCost = () => {
  if (orderedParts.length > 0) {
    let totalCost = 0; 
    let ans_string = "";

    orderedParts.forEach((part, index) => {
      if (part.qty && part.unit_cost) {
        const cost = part.qty * part.unit_cost;
        totalCost += cost;
        ans_string += `(${part.qty} x ${part.unit_cost})`; // Add current part to string
        if (index < orderedParts.length - 1) {
          ans_string += " + ";
        }
      }
    });

    const finalTotalCostString = totalCost > 0
      ? `BDT ${totalCost}`
      : "-"; // Handle case where there are no valid parts

    const finalCostBreakdownString = totalCost > 0
    ? `Total Cost Breakdown: BDT ${ans_string}`
    : "Total Cost Breakdown: -"; // Handle case where there are no valid parts

    setTotalCost(finalTotalCostString);
    setCostBreakdown(finalCostBreakdownString)
  } else {
     // Handle case where orderedParts is empty
    setTotalCost("Total Cost: -");
    setCostBreakdown("Total Cost Breakdown: -")
  }
};

const handleOrderManagement = async () => {
    if (runCount > 0 && !isProcessing) {
      setIsProcessing(true)
      await updateOrderStatus();
      setRunCount(0);
      setIsProcessing(false) // Reset the count after running
    }
    else{
      return;
    }
};

  //use effect to calculate total cost everytime orderedParts is reloaded
  useEffect( () => {
    calculateTotalCost();
  }, [orderedParts]);

  // useEffect to monitor and process the queue
  useEffect( () => {
    handleOrderManagement();
}, [runCount, isProcessing]);

  const handleChanges = async (payload: any) => {
    if (!isProcessing) {
    setRunCount(prevCount => prevCount + 1);
  }
  };
  


  useEffect(()=>{
    const channel = supabase_client
    .channel('order_parts-changes')
    .on(
        'postgres_changes',
        {
        event: '*',
        schema: 'public',
        table: 'order_parts'
        },handleChanges
    )
    .subscribe()
  },[])

  useEffect(()=>{
    loadOrderedParts()
  },[])

  useEffect(()=>{
    updateOrderStatus()
  },[order])
  
  const handleNavigation = () => {
    navigate('/orders'); 
  };

  return(
      <Card x-chunk="dashboard-06-chunk-0" className={isOrderCompleted ? "border-green-600 mt-5" : "mt-5"} >
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
            Manage Parts Ordered
            {isOrderCompleted && <span className="text-green-600 text-xl">✅</span>}
          </CardTitle>
          <CardDescription>
            This is a list of parts that were ordered, you can complete actions on each ordered part.
          </CardDescription>
        </div>
        <div className="flex flex-wrap justify-end items-center gap-2">
          {showPendingOrderApproveButton(order.statuses.name,false) && !orderedParts.every(part => part.approved_pending_order) && (
            <Button disabled={loadingTableButtons} onClick={()=>setIsApprovePendingDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all pending parts"}</Button>
          )}
          {showOfficeOrderApproveButton(order.statuses.name,false) && (
            <Button disabled={loadingTableButtons} onClick={()=>setisApproveAllOfficeDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all parts"}</Button>
          )}
          {showAllBudgetApproveButton(order.statuses.name, orderedParts) && (
            <Button disabled={loadingTableButtons} onClick={()=>setApproveAllBudgetDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all budgets"}</Button>
          )}
          {showAddPartButton(order.statuses.name) && (
            <Button className="bg-blue-700" disabled={loadingAddPart} onClick={()=>setIsAddPartDialogOpen(true)}>{loadingAddPart? "Adding...": "Add Part"}</Button>
          )}
          {showAdvanceButton && (
            <Button disabled={loadingTableButtons} className="bg-green-700" onClick={()=>setIsAdvanceDialogOpen(true)}><Flag/>Advance</Button>
          )}
          {showRevertButton && (
            <Button disabled={loadingTableButtons} className="bg-orange-600" onClick={()=>setIsRevertDialogOpen(true)}><FlagOff/>Revert to Quotation</Button>
          )}
        </div>
      </CardHeader>
      {(loadingTable===true)? (
                  <div className='animate-spin flex flex-row justify-center p-5'>
                      <Loader2 />
                  </div>
        ):
        <CardContent>
        <Table>
        <TableHeader>
        <TableRow>
            <TableHead></TableHead>
            <TableHead className="whitespace-nowrap">Actions</TableHead>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            <TableHead className="whitespace-nowrap">Current Storage Qty</TableHead>
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
        {loadingTable? (
            <div className='flex flex-row justify-center'>
                <Loader2 className='h-8 w-8 animate-spin'/>
            </div>
        ):
            <TableBody>
            {orderedParts.map((orderedPart,index) => (                                        
                <Managerowtemporary key={orderedPart.id}
              index={index+1}
              order={order}
              orderedPartInfo={orderedPart}/>
            ))}
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
      <Dialog open={showActionsCompletedPopup} onOpenChange={handleNavigation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">All action completed for current status</DialogTitle>
              <DialogDescription>
                <p>Order will be moved to next status.</p>
                <p>You will be moved back to orders page.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleNavigation}>OK</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={showEmptyOrderPopup} onOpenChange={handleNavigation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">This order has no parts ordered.</DialogTitle>
              <DialogDescription>
                <p>Order will be deleted.</p>
                <p>You will be moved back to orders page.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleNavigation}>OK</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Reverting Order Status 
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You can now revert this order to previous status. Please confirm if you would like to revert.
            </p>
          </DialogDescription>
          <Button onClick={handleRevertOrderStatus}>Confirm</Button>
        </DialogContent>
      </Dialog>
      <AddNewPartToOrderAction
        isAddPartDialogOpen={isAddPartDialogOpen}
        setAddPartDialogOpen={setIsAddPartDialogOpen}
        order={order}
        parts={parts}
        orderedParts={orderedParts}
      />
      <ApproveAllBudgetAction
        open={isApproveAllBudgetDialogOpen}
        onOpenChange={setApproveAllBudgetDialogOpen}
        orderedParts={orderedParts}
      />
      <ApproveAllPendingAction
        isApprovePendingDialogOpen={isApprovePendingDialogOpen}
        setApprovePendingDialogOpen={setIsApprovePendingDialogOpen}
        orderedParts={orderedParts}
        order={order}
        isLoadingTableButtons={loadingTable}
        setIsLoadingTableButtons={setLoadingTableButtons}
      />
      <ApproveAllFromOfficeAction
        open={isApproveAllOfficeDialogOpen}
        onOpenChange={setisApproveAllOfficeDialogOpen}
        orderedParts={orderedParts}
      />
      <AdvanceOrderDialog
        open={isAdvanceDialogOpen}
        onOpenChange={setIsAdvanceDialogOpen}
        order={order}
      />
      
      
      </Card>
      
    )
  }

export default ManageOrderedPartsSection