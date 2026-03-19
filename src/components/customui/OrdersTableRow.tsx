import React, { useEffect, useState } from 'react';
import { ExternalLink, MoreHorizontal, OctagonAlert } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { TableCell, TableRow } from "../ui/table";
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { deleteOrderByID, fetchRunningOrdersByMachineId } from '@/services/OrdersService';
import toast from 'react-hot-toast';
import { Order, OrderedPart } from '@/types';
import { convertUtcToBDTime, isManagebleOrder, managePermission } from '@/services/helper';
import { fetchFactoriesByIds } from '@/services/FactoriesService';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription, DialogTrigger } from '../ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { setMachineIsRunningById } from '@/services/MachineServices';
import { fetchOrderedPartsByOrderID } from '@/services/OrderedPartsService';
import OrderedPartsPopup from './OrderedPartsPopup';

/* =========================
   COMPLETED & STATUS COLORS
   - Only "Pending" is red.
   - All completed statuses are green.
   - Everything else keeps prior colors.
   ========================= */

// Which statuses count as "completed"
const COMPLETED_STATUSES = new Set<string>([
  'Parts Received',
  'Transferred To Machine',
  'Transferred To Storage',
  'Transferred To Project',
  'Transfer Completed',
]);

// Colors for non-completed statuses
const STATUS_BADGE_STYLES: Record<string, string> = {
  'Pending': 'bg-red-200 text-red-900',

  // In-progress steps
  'Order Sent To Head Office': "bg-orange-100",
  'Waiting For Quotation': "bg-orange-100",
  'Budget Released': "bg-orange-100",
  'Waiting For Purchase': "bg-orange-100",
  'Purchase Complete': "bg-orange-100",
  'Parts Sent To Factory': "bg-orange-100",
};

function getStatusBadgeClass(statusName: string): string {
  if (COMPLETED_STATUSES.has(statusName)) return 'bg-green-100 text-green-900';
  if (statusName === 'Pending') return 'bg-red-200 text-red-900';
  return STATUS_BADGE_STYLES[statusName] ?? 'bg-orange-100 text-orange-900';
}

interface OrdersTableRowProps {
  order: Order;
}

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({ order }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const profile = useAuth().profile;
  const [orderedParts, setOrderedParts] = useState<OrderedPart[] | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [orderDisplayText, setOrderDisplayText] = useState<string>("Loading...");
  const {hasFeatureAccess, canAccessManageOrder} = useAuth()
  const canDeleteOrder = hasFeatureAccess('order_delete')

  const handleDeleteOrder = async () => {
    try {
      if (order.order_type === "PFM") {
        if (order.current_status_id === 1) {
          if ((await fetchRunningOrdersByMachineId(order.machine_id)).length === 1) {
            setMachineIsRunningById(order.machine_id, true);
            toast.success("Machine is now running");
          }
        }
      }
      await deleteOrderByID(order.id);
      toast.success("Order successfully deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
    setIsDeleteDialogOpen(false);
  };

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const rowRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX;
    const popupTop = rowRect.top + window.scrollY - 250;
    const popupLeft = clickX - 128;

    setPopupPosition({ top: popupTop, left: popupLeft });
    setIsPopupOpen(true);
  };

  const loadOrderedParts = async () => {
    try {
      const ordered_parts = await fetchOrderedPartsByOrderID(order.id);
      setOrderedParts(ordered_parts ?? null);
    } catch (error) {
      console.log(`ERROR - ${error}`);
      setOrderedParts(null);
    }
  };

  useEffect(() => {
    loadOrderedParts();
  }, []);

  // Compute display string
  useEffect(() => {
    const processOrderDisplay = async () => {
      try {
        if (order.order_type === "STM" && order.src_factory) {
          setOrderDisplayText("Loading...");
          const factories = await fetchFactoriesByIds([order.src_factory]);
          const sourceFactory = factories.length > 0 ? factories[0] : null;

          if (sourceFactory) {
            setOrderDisplayText(
              `${sourceFactory.abbreviation} → ${order.factories.abbreviation} - ${order.factory_sections?.name} - ${order.machines?.name || 'N/A'}`
            );
          } else {
            setOrderDisplayText(
              `Unknown → ${order.factories.abbreviation} - ${order.machines?.name || 'N/A'}`
            );
          }
        } else if (order.factory_sections?.name && order.machines?.name) {
          setOrderDisplayText(`${order.factories.abbreviation} - ${order.factory_sections?.name} - ${order.machines?.name}`);
        } else if (order.order_type === "PFS") {
          setOrderDisplayText(`${order.factories.abbreviation} - Storage`);
        } else if (order.order_type === "PFP") {
          setOrderDisplayText(`${order.factories.abbreviation} - Project`);
        } else if (order.order_type === "STP") {
          if (order.src_factory) {
            setOrderDisplayText(`${order.factories.abbreviation} - Storage to Project`);
          } else {
            setOrderDisplayText(`${order.factories.abbreviation} - Project - Storage`);
          }
        }
      } catch (error) {
        console.error("Error processing order display:", error);
        if (order.factory_sections?.name && order.machines?.name) {
          setOrderDisplayText(`${order.factories.abbreviation} - ${order.factory_sections?.name} - ${order.machines?.name}`);
        } else {
          setOrderDisplayText(`${order.factories.abbreviation} - Storage`);
        }
      }
    };

    processOrderDisplay();
  }, [order.order_type, order.factories.abbreviation, order.factory_sections?.name, order.machines?.name, order.src_factory]);

  // const permissionToManage = managePermission(order.statuses.name, profile?.permission ?? "");
  const permissionToManage = canAccessManageOrder(order.statuses.id)
  const isHighlightedOrder = isManagebleOrder(order.statuses.name, profile?.permission ?? "");

  return (
    <>
      <TableRow onClick={handleRowClick} className={isHighlightedOrder ? "bg-red-50" : ""}>
        <TableCell className="font-medium">
          {order.id}
        </TableCell>
        <TableCell className="font-medium hidden md:table-cell">
          {order.req_num}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {orderDisplayText}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {convertUtcToBDTime(order.created_at)}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {order.profiles.name}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {order.departments.name}
        </TableCell>

        {/* Compact dialog for mobile */}
        <TableCell className="table-cell md:hidden">
          <Dialog>
            <DialogTrigger><ExternalLink className="hover:cursor-pointer" /></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Order information</DialogTitle>
                <DialogDescription>
                  <li className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Req Number</span>
                    <span> {order.req_num} </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Order Type</span>
                    <span>{orderDisplayText}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Created At</span>
                    <span> {convertUtcToBDTime(order.created_at)} </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Created by</span>
                    <span>{order.profiles.name}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Department</span>
                    <span> {order.departments.name}</span>
                  </li>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </TableCell>

        {/* Status badge with centralized color logic */}
        <TableCell>
          <Badge className={getStatusBadgeClass(order.statuses.name)} variant="secondary">
            {order.statuses.name}
          </Badge>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isHighlightedOrder ? (
                <Button
                  className="text-yellow-900"
                  aria-haspopup="true"
                  size="icon"
                  variant="ghost"
                >
                  <OctagonAlert>
                    <span className="sr-only text-red-600 ">Toggle menu</span>
                  </OctagonAlert>
                </Button>
              ) : (
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <Link to={`/vieworder/${order.id}`}>
                <DropdownMenuItem>View</DropdownMenuItem>
              </Link>
              {permissionToManage && (
                <Link to={`/manageorder/${order.id}`}>
                  <DropdownMenuItem>Manage</DropdownMenuItem>
                </Link>
              )}
              {canDeleteOrder && (
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                  <span className='hover:text-red-600'>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle className="text-red-600">
              Delete Order - <span> ID: {order.id}</span>
            </DialogTitle>
            <div>
              You are about to permanently delete this order.
              <br />
              Are you sure you want to delete this order?
            </div>
            <Button onClick={handleDeleteOrder}>Delete</Button>
          </DialogContent>
        </Dialog>
      </TableRow>

      {isPopupOpen && (
        <OrderedPartsPopup
          orderedParts={orderedParts}
          onClose={() => setIsPopupOpen(false)}
          position={popupPosition}
        />
      )}
    </>
  );
};

export default OrdersTableRow;
