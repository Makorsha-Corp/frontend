import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusTracker from "@/components/customui/StatusTracker";
import OrderInfo from "@/components/customui/OrderInfoComponents/OrderInfo";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Order, OrderedPart } from "@/types";
import { fetchOrderByID } from "@/services/OrdersService";
import { supabase_client } from "@/services/SupabaseClient";
import { useAuth } from "@/context/AuthContext";
import NavigationBar from "@/components/customui/NavigationBar";
import ViewOrderedPartsSection from "@/components/customui/ViewOrderedPartsSection";
import { fetchOrderedPartsByOrderID } from "@/services/OrderedPartsService";
import OrderMachineInfo from "@/components/customui/OrderInfoComponents/OrderMachineInfo";
import OrderStorageInfo from "@/components/customui/OrderInfoComponents/OrderStorageInfo";
import OrderMachineAndStorageInfo from "@/components/customui/OrderInfoComponents/OrderMachineAndStorageInfo";
import OrderProjectInfo from "@/components/customui/OrderInfoComponents/OrderProjectInfo";
import OrderProjectStorageInfo from "@/components/customui/OrderInfoComponents/OrderProjectStorageInfo";

const ViewOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrderedParts, setLoadingOrderedParts] = useState(true);
  const navigate = useNavigate();
  const profile = useAuth().profile;
  
   const loadOrderData = async () => {
        if (!id || isNaN(parseInt(id))) {
          toast.error("Invalid order ID");
          navigate("/orders");
          return;
        }
        const order_id = parseInt(id);
        try {
          const data = await fetchOrderByID(order_id);
          loadOrderedParts(order_id)
          if (data) {
            setOrder(data);
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

  const loadOrderedParts = async (order_id:number) => {
      try {
        setLoadingOrderedParts(true)
        const orderedPartsList = await fetchOrderedPartsByOrderID(order_id)
        if (orderedPartsList) {
          setOrderedParts(orderedPartsList)
        }
        else {
          toast.error("Could not load ordered parts for this order")
        }
      } catch (error) {
        toast.error("Error loading parts")
      } finally {
        setLoadingOrderedParts(false);
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
              console.log("Changes detect, processing realtime")
              loadOrderData();
          }
      )
      .subscribe()
    loadOrderData();
  }, [id, navigate,supabase_client]);

  
  const CreateInvoice = () => {
    window.open(`/invoice/${id}`, '_blank');
  };

  if (loading) {
    return <div>Loading...</div>; // Add a loading state if necessary
  }
  
  if (!order) {
    toast.error("No order found with this id");
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <>
          <NavigationBar />
      <div className="mx-4 my-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full">
          <div className="w-full lg:w-3/6 h-[45vh]">
            <OrderInfo order={order} mode="view" />
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
                  mode="view"
                />
              </div>
            )}

            {order.order_type === 'STP' && (
              <div className="h-[45vh]">
                <OrderProjectStorageInfo
                  order={order}
                  mode="view"
                />
              </div>
            )}
            
          </div>

          <div className="w-full sm:w-1/6 h-[45vh]">
            <StatusTracker order={order} />
          </div>
        </div>
        
        <div className="w-full mt-4 overflow-x-auto">
          <ViewOrderedPartsSection order={order} orderPartList={orderedParts} orderedPartsLoading={loadingOrderedParts} />
        </div>
        
                 <div className="flex justify-end">
           <div className="my-3 mx-3 flex gap-2">
             <Button  
               onClick={CreateInvoice}
             >
               Create Invoice
             </Button>
             <Link to={'/orders'}>
               <Button>Back To Orders</Button>
             </Link>
           </div>
         </div>
       </div>
      </>
  );
};

export default ViewOrderPage;
