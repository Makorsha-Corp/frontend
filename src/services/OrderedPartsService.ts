import { Order, OrderedPart, Part, PartHistory } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";
import { fetchPartsByIDs } from "./PartsService";
import { convertBDTimeToUtc } from "./helper";

export const fetchOrderedPartByPartID = async( part_id:number) => {
    const {data,error} =  await supabase_client.from('order_parts').select(
        `
        id,
        is_sample_received_by_office,
        is_sample_sent_to_office,
        part_sent_by_office_date,
        part_received_by_factory_date,
        part_purchased_date,
        qty,
        vendor,
        brand, 
        unit_cost,
        note,
        office_note,
        in_storage,
        approved_storage_withdrawal,
        order_id,
        part_id,
        mrr_number,
        approved_pending_order,
        approved_office_order,
        approved_budget,
        unstable_type,
        orders(*),
        parts(*),
        qty_taken_from_storage
        `
    ).eq('part_id',part_id).order('id', { ascending: true });

    // console.log(data)
    if(error) {
        toast.error(error.message)
    }
    return data as unknown as OrderedPart[]

}

export const fetchOrderedPartsByOrderID = async (order_id: number)=> {
    const {data,error} =  await supabase_client.from('order_parts').select(
        `
        id,
        is_sample_received_by_office,
        is_sample_sent_to_office,
        part_sent_by_office_date,
        part_received_by_factory_date,
        part_purchased_date,
        qty,
        vendor,
        brand, 
        unit_cost,
        note,
        office_note,
        in_storage,
        approved_storage_withdrawal,
        order_id,
        part_id,
        mrr_number,
        approved_pending_order,
        approved_office_order,
        approved_budget,
        unstable_type,
        orders(*),
        parts(*),
        qty_taken_from_storage
        `
    ).eq('order_id',order_id).order('id', { ascending: true });
    // console.log(data)
    if(error) {
        toast.error(error.message)
    }
    return data as unknown as OrderedPart[]
}

export const fetchLastChangeDate = async (machine_id:number, part_id:number) => {
    const { data, error } = await supabase_client
    .from('order_parts')
    .select(`
      part_received_by_factory_date,
      part_id,
      orders!inner(machine_id)
    `)
    .eq('orders.machine_id', machine_id)
    .eq('part_id', part_id)
    .not('part_received_by_factory_date', 'is', null)
    .order('part_received_by_factory_date', {ascending:false})
    .limit(1)
    if (error) {
        toast.error(error.message);
        return null; 
    }

    if (data && data.length > 0) {
        const mostRecentChange = data[0]
        return mostRecentChange.part_received_by_factory_date

    } else {
        // console.log(data)
        return null;
    }
}

export const fetchLastCostAndPurchaseDate = async (part_id: number) => {
    const { data, error } = await supabase_client
    .from('order_parts')
    .select(`
      unit_cost, 
      part_purchased_date,
      part_id,
      vendor
    `)
    .eq('part_id', part_id)
    .not('part_purchased_date', 'is', null)
    .order('part_purchased_date', {ascending:false})
    .limit(1)
    if (error) {
        toast.error(error.message);
        return null; 
    }
    if (data && data.length > 0) {
        const mostRecent = data[0]
        return {
            unit_cost: mostRecent.unit_cost,
            part_purchase_date: mostRecent.part_purchased_date,
            vendor: mostRecent.vendor
        };
    } else {
        // console.log(data)
        return null;
    }
};

export const updateOfficeNoteByID = async(orderedpart_id: number, updated_note: string) => {
    const {error} =  await supabase_client.from('order_parts').update(
        {office_note: updated_note}
    ).eq('id',orderedpart_id)

    if (error) {
        toast.error(error.message)
    }
}

export const updateApprovedOfficeOrderByID = async (orderedpart_id: number, approved: boolean) => {
        
    const { error } = await supabase_client.from('order_parts').update(
        { approved_office_order: approved }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const returnOrderedPartByID = async (orderedpart_id:number) => {
    const { error } = await supabase_client.from('order_parts')
    .update(
    { 
        brand: null,
        vendor: null,
        unit_cost: null,
        approved_budget: false,
        part_purchased_date: null,
        part_sent_by_office_date:null,
        part_received_by_factory_date: null,
        mrr_number: null
    }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updateApprovedStorageWithdrawalByID = async (orderedpart_id: number, approved: boolean) => {
        
    const { error } = await supabase_client.from('order_parts').update(
        { approved_storage_withdrawal: approved }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updateApprovedBudgetByID = async (orderedpart_id: number, approved:boolean) => {
    const { error } = await supabase_client.from('order_parts').update(
        { approved_budget: approved }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updateApprovedPendingOrderByID = async (orderedpart_id:number, approved:boolean) => {
    const { error } = await supabase_client.from('order_parts').update(
        { approved_pending_order: approved }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const deleteOrderedPartByID = async (orderedpart_id: number) => {
    
    const { error } = await supabase_client.from('order_parts').delete()
    .eq('id', orderedpart_id)

    if (error){
        toast.error(error.message)
    }
        
}

export const updateMrrNumberByID = async (orderedpart_id:number, mrr_number:string) => {
    const { error } = await supabase_client.from('order_parts').update(
        { 
            mrr_number: mrr_number,
        }
    ).eq('id', orderedpart_id)

    if (error) {
        // console.log("error for unique:",error.code)
        toast.error(error.message)
    }
    
}

export const updateCostingByID = async (orderedpart_id: number, brand:string | null, unit_cost: number | null, vendor: string | null) => {
    const { error } = await supabase_client.from('order_parts').update(
        { 
            brand: brand,
            vendor: vendor,
            unit_cost: unit_cost
        }
    ).eq('id', orderedpart_id)

    if (error) {
        toast.error(error.message)
    }
}

export const updateSampleReceivedByID = async (orderedpart_id: number, isReceived: boolean) => {
    const { error } = await supabase_client.from('order_parts').update(
        { is_sample_received_by_office: isReceived }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updatePurchasedDateByID = async (orderedpart_id: number, purchasedDate: Date) => {
    const { error } = await supabase_client.from('order_parts').update(
        { part_purchased_date: purchasedDate }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updateSentDateByID = async (orderedpart_id: number, sentDate: Date) => {
    const { error } = await supabase_client.from('order_parts').update(
        { part_sent_by_office_date: sentDate }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const updateReceivedByFactoryDateByID = async (orderedpart_id: number, receivedDate: Date | null) => {
    const { error } = await supabase_client.from('order_parts').update(
        { part_received_by_factory_date: receivedDate }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const getOrdersByPartIDAndDateRange = async (partId: number, startDate: Date, endDate: Date) => {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    const startOfstartDateUTC = convertBDTimeToUtc(`${formattedStartDate}T00:00:00`);
    const endOfEndDateUTC = convertBDTimeToUtc(`${formattedEndDate}T23:59:59`);

    const { data, error } = await supabase_client
        .from('order_parts')
        .select('*')
        .eq('part_id', partId)
        .gte('part_purchased_date', startOfstartDateUTC)
        .lte('part_purchased_date', endOfEndDateUTC);

    if (error) {
        toast.error(error.message);
        return [];
    }

    return data as OrderedPart[];
};


export const updateOrderedPartQtyByID =  async (orderedpart_id:number, new_quantity:number) => {
    const { error } = await supabase_client.from('order_parts').update(
        { qty: new_quantity }
    ).eq('id', orderedpart_id)
    
    if (error){
        toast.error(error.message)
    }
}

export const insertOrderedParts = async (
    
    qty: number,
    order_id: number,
    part_id: number,
    is_sample_sent_to_office: boolean,
    note: string | null,
    in_storage: boolean,
    approved_storage_withdrawal: boolean,
    unstable_type?: 'INACTIVE' | 'DEFECTIVE' | 'LESS' | null,
    unit_cost?: number | null
) => {

    const { data, error } = await supabase_client.from('order_parts').insert([{
        qty,
        order_id,
        part_id,
        is_sample_sent_to_office,
        note,
        in_storage,
        approved_storage_withdrawal,
        unstable_type: unstable_type || 'INACTIVE',  // Default to 'INACTIVE' if not provided
        unit_cost: unit_cost ?? null
    }])
    .select();


    if (error) {
        toast.error("Failed to insert order part: " + error.message);
        return null;
    }

    // toast.success("Order part added successfully");
    return data as unknown as OrderedPart[];
};

export const fetchMetricMostFrequentOrderedParts = async () => {
    const { data, error } = await supabase_client
      .from('order_parts')
      .select('part_id, count:part_id.count()')
      .order('count', { ascending: false })
      .limit(10);
  
    if (error) {
      console.error('Error fetching top ordered parts:', error);
      return null;
    }
  
    // Extract part IDs in the correct order
    const partIds = data.map((item) => item.part_id);
  
    // Fetch part details based on the extracted part IDs and create a Map for lookup
    const partsData = await fetchPartsByIDs(partIds);

    const partsMap = new Map(partsData.map(part => [part.id, part]));


    const result = data
    .map(item => {
      const part = partsMap.get(item.part_id);
      return part ? { part, order_count: item.count } : null;
    })
    .filter(Boolean) as { part: Part; order_count: number }[];

    return result;
  };

export const fetchMetricMostFrequentOrderedPartsCurrentMonth = async () => {
    // Define the current month start and end dates
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
  
    // Step 1: Fetch orders from the current month
    const { data: ordersData, error: ordersError } = await supabase_client
      .from('orders')
      .select('id')
      .filter('created_at', 'gte', startOfMonth)
      .filter('created_at', 'lt', startOfNextMonth);
  
    if (ordersError) {
    //   console.error("Couldn't find orders for this month:", ordersError);
      return null;
    }
  
    // Extract order IDs
    const orderIdsForThisMonth = ordersData?.map((order) => order.id);
    if (!orderIdsForThisMonth || orderIdsForThisMonth.length === 0) {
    //   console.log("No orders found for this month.");
      return [];
    }
  
    // Step 2: Fetch most frequent ordered parts in the current month
    const { data: partsData, error: partsError } = await supabase_client
      .from('order_parts')
      .select('part_id, count:part_id.count()')
      .in('order_id', orderIdsForThisMonth)
      .order('count', { ascending: false })
      .limit(10);
    
    if (partsError) {
    //   console.error('Error fetching top ordered parts for current month:', partsError);
      return null;
    }
  
    // Extract part IDs from parts data
    const partIds = partsData.map((item) => item.part_id);
  
    // Step 3: Fetch part details based on part IDs
    const partsDetails = await fetchPartsByIDs(partIds);
    if (!partsDetails) {
    //   console.error('Error fetching part details.');
      return null;
    }
  
    // Map part details by part ID
    const partsMap = new Map(partsDetails.map((part) => [part.id, part]));
  
    // Build the result array with parts in the correct order with their counts
    const result = partsData
    .map(item => {
      const part = partsMap.get(item.part_id);
      return part ? { part, order_count: item.count } : null;
    })
    .filter(Boolean) as { part: Part; order_count: number }[];

  return result;
  };
  
  

export const updateQtyTakenFromStorage = async (orderedpart_id: number, quantity: number) => {
    const { error } = await supabase_client.from('order_parts').update(
        { qty_taken_from_storage: quantity }
    ).eq('id', orderedpart_id)

    if (error) {
        toast.error(error.message)
    }
}


export const getOrderedPartHistory = async (orderedPartList: OrderedPart[], order: Order) => {
    const newHistoryMap: Record<number, PartHistory> = {};

      for (const part of orderedPartList) {
        const part_id = part.part_id;

        const [pastPurchase, lastChange] = await Promise.all([
          fetchLastCostAndPurchaseDate(part_id),
          order.machine_id
            ? fetchLastChangeDate(order.machine_id, part_id)
            : Promise.resolve(null),
        ]);

        newHistoryMap[part_id] = {
          lastUnitCost: pastPurchase?.unit_cost ?? null,
          lastPurchaseDate: pastPurchase?.part_purchase_date ?? null,
          lastVendor: pastPurchase?.vendor ?? null,
          lastChangeDate: lastChange ?? null,
        };
      }

    return newHistoryMap
}


export const calculateTotalCost = (orderPartList:OrderedPart[]) => {
  if (orderPartList.length === 0) {
      return "-"
  }
  let total = 0;
  orderPartList.forEach((part) => {
    if (part.qty && part.unit_cost) {
      const cost = part.qty * part.unit_cost;
      total += cost;
    }
  });

    return total > 0 ? `BDT ${total}` : "-";
};

export const fetchOrderedPartsForBusinessLensByOrderIds = async (
  orderIds: number[]
) => {
  if (!orderIds || orderIds.length === 0) return [];
  const { data, error } = await supabase_client
    .from("order_parts")
    .select("order_id, qty, unit_cost, part_purchased_date")
    .in("order_id", orderIds)
    .not("part_purchased_date", "is", null)

  if (error) {
    toast.error(error.message);
    return [];
  }

  return data as Array<{
    order_id: number;
    qty: number | null;
    unit_cost: number | null;
    part_purchased_date: string | null;
  }>;
};

