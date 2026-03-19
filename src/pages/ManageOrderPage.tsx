import { Link, useNavigate, useParams } from "react-router-dom";
import OrderInfo from "@/components/customui/OrderInfoComponents/OrderInfo";
import OrderMachineInfo from "@/components/customui/OrderInfoComponents/OrderMachineInfo";
import OrderStorageInfo from "@/components/customui/OrderInfoComponents/OrderStorageInfo";
import OrderMachineAndStorageInfo from "@/components/customui/OrderInfoComponents/OrderMachineAndStorageInfo";
import OrderProjectInfo from "@/components/customui/OrderInfoComponents/OrderProjectInfo";
import OrderProjectStorageInfo from "@/components/customui/OrderInfoComponents/OrderProjectStorageInfo";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Order, Part } from "@/types";
import { fetchOrderByID } from "@/services/OrdersService";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { managePermission } from "@/services/helper";
import { supabase_client } from "@/services/SupabaseClient";
import { DialogContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import NavigationBar from "../components/customui/NavigationBar"
import { fetchAllParts } from "@/services/PartsService";
import ManageOrderedPartsSection from "@/components/customui/ManageOrder/ManageOrderedPartsSection";
import StatusTracker from "@/components/customui/StatusTracker";

const ManageOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(true)
  const navigate = useNavigate();
  const profile = useAuth().profile
  const {canAccessManageOrder} = useAuth()
  const [isManageOrderAuthorizedDialogOpen, setIsManageOrderAuthorizedDialogOpen] = useState<boolean>(false)
  const handleNavigationToOrderPage = () => {
    navigate("/orders");
  }

  const handleNavigationToViewOrderPage = () => {
    navigate(`/vieworder/${id}`)
  }

  const loadOrder = async () => {
    if (!id || isNaN(parseInt(id))) {
      toast.error("Invalid order ID");
      navigate("/orders");
      return;
    }
    const order_id = parseInt(id);
    try {
      const data = await fetchOrderByID(order_id);
      if (data) {
        const order = data
        setOrder(order);
        // if (profile && profile.permission && !managePermission(order.statuses.name,profile.permission))
        // {
        //   setIsManageOrderAuthorizedDialogOpen(true)
        // }
        if (canAccessManageOrder(order.statuses.id)===false)
        {
          setIsManageOrderAuthorizedDialogOpen(true)
        }

      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
    } catch (error) {
      toast.error("Failed to fetch order info");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      setPartsLoading(true)
      const parts_data = await fetchAllParts();
      if (parts_data) {
        setParts(parts_data)
      }
      else {
        setParts([])
      }
    } catch (error) {
      toast.error("Failed to fetch parts")
    } finally {
      setPartsLoading(false)
    }
  }

  useEffect(() => {
    const channel = supabase_client
        .channel('order-changes')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'orders'
            },
            () => {
                console.log("Changes detected for order, processing realtime")
                loadOrder();
            }
        )
        .subscribe()  

    return () => {
      channel.unsubscribe()
    }
  }, [id, navigate]);
  
  useEffect(() => { 
    loadParts();
    loadOrder();
  }, []);

  if (loading || partsLoading) {
    return <div>Loading...</div>; // Add a loading state if necessary
  }

  if(!order)
  {  
    toast.error("No order found with this id")
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <>
      <NavigationBar />
      <div className="mx-4 my-4">
        {/* Flex layout - 3/5 and 2/5 proportions with equal heights */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full">
          <div className="w-full lg:w-3/6 h-[45vh]">
            <OrderInfo
              order={order}
              mode="manage"
            />
          </div>
          
          <div className="w-full lg:w-2/6">
            {order.order_type === 'PFM' && (
              <div className="h-[45vh]">
                <OrderMachineInfo
                  order={order}
                  mode="manage"
                />
              </div>
            )}
            
            {order.order_type === 'PFS' && (
              <div className="h-[45vh]">
                <OrderStorageInfo
                  order={order}
                  mode="manage"
                />
              </div>
            )}
            
            {order.order_type === 'STM' && (
              <div className="h-[45vh]">
                <OrderMachineAndStorageInfo
                  order={order}
                  mode="manage"
                />
              </div>
            )}

            {order.order_type === 'PFP' && (
              <div className="h-[45vh]">
                <OrderProjectInfo
                  order={order}
                  mode="manage"
                />
              </div>
            )}

            {order.order_type === 'STP' && (
              <div className="h-[45vh]">
                <OrderProjectStorageInfo
                  order={order}
                  mode="manage"
                />
              </div>
            )}

          </div>

          <div className="w-full sm:w-1/6 h-[45vh]">
              <StatusTracker order={order} />
          </div>
        </div>
        <ManageOrderedPartsSection
          order={order} 
          parts={parts}
        />
      <div className="flex justify-end">
        <div className="my-3 mx-3 flex gap-2">
          <Link to={'/orders'}><Button>Back To Orders</Button></Link>
        </div>
      </div>
    </div>

      <Dialog open={isManageOrderAuthorizedDialogOpen} onOpenChange={handleNavigationToOrderPage}>
        <DialogContent>
          <DialogTitle>
           Unauthorized to manage order
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              This order is in a status that cannot be managed by you. You will be redirected to view order page. 
            </p>
          </DialogDescription>
          <Button onClick={handleNavigationToViewOrderPage}>Okay</Button>
        </DialogContent>
      </Dialog>
    </>
    
  )
}

export default ManageOrderPage