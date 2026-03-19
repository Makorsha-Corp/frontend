// src/services/OrdersService.ts
import { ExpenseByFactory, Order, OrdersTypeCount } from "@/types";
import { supabase_client } from "./SupabaseClient";
import { convertBDTimeToUtc, isManagebleOrder } from "./helper.ts";
import toast from "react-hot-toast";
import { fetchFactoriesByIds, fetchFactorySectionsByIds } from "./FactoriesService.ts";
import { getOrderTypeLastStatusMap } from "./OrderWorkflowService.ts";

const ORDER_TYPE_LABELS: Record<string, string> = {
  PFM: "Purchase for Machine",
  PFP: "Purchase for Project",
  PFS: "Purchase for Storage",
  STM: "Storage to Machine Transfer",
  STP: "Storage to Project Transfer",
  PTP: "Project Component to Project Component Transfer"
};

const labelForType = (codeRaw: string | null | undefined) => {
  const code = (codeRaw ?? "").toUpperCase().trim();
  return ORDER_TYPE_LABELS[code] ?? "Unknown";
};

export const fetchOrders = async ({
  page = 1,
  limit = 10,
  showCompleted,
  filters = {},
}: {
  page: number;
  limit: number;
  showCompleted: boolean;
  filters?: {
    searchQuery?: string;
    reqNumQuery?: string;
    selectedDate?: Date;
    dateFilterType?: number;
    selectedStatusId?: number;
    selectedDepartmentId?: number;
    selectedFactoryId?: number;
    selectedFactorySectionId?: number;
    selectedMachineId?: number;
    selectedOrderType?: string;
  };
}) => {
  console.log(`Fetching orders with parameters: Page: ${page}, Limit: ${limit}, Filters:`, filters);
  console.log("ID   ", filters.searchQuery);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let queryBuilder = supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      project_id,
      project_component_id,
      order_type,
      order_workflow_id,
      src_factory,
      src_project_component_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
      `,
      { count: "exact" }
    )
    .range(from, to)
    .order("id", { ascending: false });

  if (filters.searchQuery) {
    console.log("ID SEARCH");
    console.log(queryBuilder);
    queryBuilder = queryBuilder.eq("id", filters.searchQuery);
  }

  if (filters.reqNumQuery) {
    queryBuilder = queryBuilder.eq("req_num", filters.reqNumQuery);
  }

  if (!showCompleted) {
    queryBuilder = queryBuilder
      .neq('current_status_id', 8)
      .neq('current_status_id', 9);
  }
  if (showCompleted) {
    queryBuilder = queryBuilder.in("current_status_id", [8,9]);
  }

  if (filters.selectedDate && filters.dateFilterType) {
    const searchDateStr = filters.selectedDate.toISOString().split("T")[0];

    // Convert to Bangladesh time for start and end of the day
    const startOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T00:00:00`);
    const endOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T23:59:59`);

    // Apply date range based on the filter type
    if (filters.dateFilterType === 1) {
      // "on" date
      queryBuilder = queryBuilder.gte("created_at", startOfDayUTC).lte("created_at", endOfDayUTC);
    } else if (filters.dateFilterType === 2) {
      // "before" the date
      queryBuilder = queryBuilder.lte("created_at", startOfDayUTC);
    } else if (filters.dateFilterType === 3) {
      // "after" the date
      queryBuilder = queryBuilder.gte("created_at", endOfDayUTC);
    }

    console.log("Fetching orders with filterType:", filters.dateFilterType, "search date:", startOfDayUTC, "to", endOfDayUTC);
  }

  if (filters.selectedStatusId) {
    queryBuilder = queryBuilder.eq("current_status_id", filters.selectedStatusId);
  }

  if (filters.selectedDepartmentId) {
    console.log("Fetching orders with deptID ", filters.selectedDepartmentId);
    queryBuilder = queryBuilder.eq("department_id", filters.selectedDepartmentId);
  }

  if (filters.selectedFactoryId) {
    console.log("Fetching orders with factoryID ", filters.selectedFactoryId);
    queryBuilder = queryBuilder.eq("factory_id", filters.selectedFactoryId);
  }

  if (filters.selectedFactorySectionId) {
    console.log("Fetching orders with factorySectionID ", filters.selectedFactorySectionId);
    queryBuilder = queryBuilder.eq("factory_section_id", filters.selectedFactorySectionId);
  }

  if (filters.selectedMachineId) {
    console.log("Fetching orders with machineID ", filters.selectedMachineId);
    queryBuilder = queryBuilder.eq("machine_id", filters.selectedMachineId);
  }

  if (filters.selectedOrderType && filters.selectedOrderType !== "all") {
    console.log("Fetching orders with orderType", filters.selectedOrderType);
    queryBuilder = queryBuilder.eq("order_type", filters.selectedOrderType);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    toast.error(error.message);
    return { data: [], count: 0 };
  }
  return { data: data as unknown as Order[], count };
};

export const fetchOrderByID = async (order_id: number) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
        id,
        req_num,
        created_at,
        order_note,
        created_by_user_id,
        department_id,
        current_status_id,
        factory_id,
        machine_id,
        factory_section_id,
        project_id,
        project_component_id,
        order_type,
        order_workflow_id,
        src_factory,
        src_project_component_id,
        order_workflows(*),
        departments(*),
        profiles(*),
        statuses(*),
        factory_sections(*),
        factories(*),
        machines(*),
        src_factory
      `
    )
    .eq("id", order_id)
    .single();
  if (error) {
    return null;
  }
  console.log(data);
  return data as unknown as Order;
};

export const fetchOrderByReqNum = async (reqNum: string) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      project_id,
      project_component_id,
      order_type,
      src_factory,
      src_project_component_id,
      order_workflow_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
    `
    )
    .eq("req_num", reqNum);
  if (error) {
    return null;
  }
  return data ?? [];
};

export const fetchOrderByReqNumandFactory = async (reqNum: string, factoryId: number) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      project_id,
      project_component_id,
      src_factory,
      src_project_component_id,
      order_type,
      order_workflow_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
    `
    )
    .ilike("req_num", reqNum)
    .eq("factory_id", factoryId);
  if (error) {
    return null;
  }
  return data ?? [];
};

export const UpdateStatusByID = async (orderid: number, status_id: number) => {
  const { error } = await supabase_client.from("orders").update({ current_status_id: status_id }).eq("id", orderid);

  if (error) {
    toast.error(error.message);
  }
};

export const deleteOrderByID = async (orderid: number) => {
  const { error } = await supabase_client.from("orders").delete().eq("id", orderid);

  if (error) {
    toast.error(error.message);
  }
};

export const insertOrder = async (
  req_num: string,
  order_note: string,
  created_by_user_id: number,
  department_id: number,
  factory_id: number,
  factory_section_id: number,
  machine_id: number,
  current_status_id: number,
  order_type: string
) => {
  const { data, error } = await supabase_client
    .from("orders")
    .insert([
      {
        req_num,
        order_note,
        created_by_user_id,
        department_id,
        factory_id,
        factory_section_id,
        machine_id,
        current_status_id,
        order_type,
      },
    ])
    .select();

  if (error) {
    toast.error("Failed to create order: " + error.message);
  }
  return { data: data as Order[], error };
};

export const insertOrderStorage = async (
  req_num: string,
  order_note: string,
  created_by_user_id: number,
  department_id: number,
  factory_id: number,
  current_status_id: number,
  order_type: string
) => {
  const { data, error } = await supabase_client
    .from("orders")
    .insert([
      {
        req_num,
        order_note,
        created_by_user_id,
        department_id,
        factory_id,
        current_status_id,
        order_type,
      },
    ])
    .select();

  if (error) {
    toast.error("Failed to create order: " + error.message);
  }
  return { data: data as Order[], error };
};

export const insertOrderStorageSTM = async (
  req_num: string,
  order_note: string,
  created_by_user_id: number,
  department_id: number,
  factory_id: number,
  factory_section_id: number,
  machine_id: number,
  current_status_id: number,
  order_type: string,
  src_factory: number
) => {
  const { data, error } = await supabase_client
    .from("orders")
    .insert([
      {
        req_num,
        order_note,
        created_by_user_id,
        department_id,
        factory_id,
        factory_section_id,
        machine_id,
        current_status_id,
        order_type,
        src_factory,
      },
    ])
    .select();
  if (error) {
    toast.error("Failed to create order: " + error.message);
  }
  return { data: data as Order[], error };
};

export const insertOrderPFP = async (
  req_num: string,
  order_note: string,
  created_by_user_id: number,
  department_id: number,
  factory_id: number,
  current_status_id: number,
  order_type: string,
  project_id: number,
  project_component_id: number
) => {
  const { data, error } = await supabase_client
    .from("orders")
    .insert([
      {
        req_num,
        order_note,
        created_by_user_id,
        department_id,
        factory_id,
        factory_section_id: null,
        machine_id: null,
        current_status_id,
        order_type,
        project_id,
        project_component_id,
      },
    ])
    .select();
  if (error) {
    toast.error("Failed to create order: " + error.message);
  }
  return { data: data as Order[], error };
};

export const insertOrderSTP = async (
  req_num: string,
  order_note: string,
  created_by_user_id: number,
  department_id: number,
  factory_id: number,
  current_status_id: number,
  order_type: string,
  project_id: number,
  project_component_id: number,
  src_factory: number
) => {
  const { data, error } = await supabase_client
    .from("orders")
    .insert([
      {
        req_num,
        order_note,
        created_by_user_id,
        department_id,
        factory_id,
        factory_section_id: null,
        machine_id: null,
        current_status_id,
        order_type,
        project_id,
        project_component_id,
        src_factory,
      },
    ])
    .select();
  if (error) {
    toast.error("Failed to create order: " + error.message);
  }
  return { data: data as Order[], error };
};

export const fetchRunningOrdersByMachineId = async (machine_id: number) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      project_id,
      project_component_id,
      order_type,
      src_factory,
      src_project_component_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
      `
    )
    .eq("machine_id", machine_id)
    .eq("order_type", "PFM");

  if (error) {
    toast.error(error.message);
    return [] as unknown as Order[];
  }

  const orders = (data || []) as Array<any>;
  if (orders.length === 0) {
    return orders as unknown as Order[];
  }

  const typeLastMap = await getOrderTypeLastStatusMap();
  const activeOrders = orders.filter((o: any) => {
    const lastId = (typeLastMap as any)[o.order_type];
    if (typeof lastId !== "number") return true;
    return o.current_status_id !== lastId;
  });

  return activeOrders as unknown as Order[];
};

export const fetchRunningOrdersByFactoryId = async (factory_id: number) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      project_id,
      project_component_id,
      order_type,
      src_factory,
      src_project_component_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
      `
    )
    .eq("factory_id", factory_id)
    .eq("order_type", "PFS");

  if (error) {
    toast.error(error.message);
    return [] as unknown as Order[];
  }

  const orders = (data || []) as Array<any>;
  if (orders.length === 0) {
    return orders as unknown as Order[];
  }

  const typeLastMap = await getOrderTypeLastStatusMap();
  const activeOrders = orders.filter((o: any) => {
    const lastId = (typeLastMap as any)[o.order_type];
    if (typeof lastId !== "number") return true;
    return o.current_status_id !== lastId;
  });

  return activeOrders as unknown as Order[];
};

export const fetchRunningOrdersByProjectComponentId = async (project_component_id: number) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      src_factory,
      src_project_component_id,
      project_id,
      project_component_id,
      order_type,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
      `
    )
    .eq("project_component_id", project_component_id)
    .in("order_type", ["PFP", "STP"]);

  if (error) {
    toast.error(error.message);
    return [] as unknown as Order[];
  }

  const orders = (data || []) as Array<any>;
  if (orders.length === 0) {
    return orders as unknown as Order[];
  }

  const typeLastMap = await getOrderTypeLastStatusMap();
  const activeOrders = orders.filter((o: any) => {
    const lastId = (typeLastMap as any)[o.order_type];
    if (typeof lastId !== "number") return true;
    return o.current_status_id !== lastId;
  });

  return activeOrders as unknown as Order[];
};


export const fetchMetricActiveOrders = async () => {
  const { count, error } = await supabase_client
    .from("orders")
    .select("*", { count: "exact", head: true })
    .neq("current_status_id", 8);
  if (error) {
    toast.error(error.message);
  }
  return count;
};

export const fetchManagableOrders = async (role: string) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
        id,
        current_status_id,
        statuses(*)
      `
    )
    .neq("current_status_id", 8);

  if (error) {
    toast.error(error.message);
  }

  if (!data) {
    return 0;
  }

  const manageableOrders = data.filter((order: any) => {
    const statusName = order.statuses?.name;
    return isManagebleOrder(statusName, role);
  });

  return manageableOrders.length;
};

export const fetchMetricsHighMaintenanceFactorySections = async () => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(`factory_section_id, count: factory_section_id.count()`)
    .order("count", { ascending: false })
    .limit(10);

  if (error) {
    toast.error(error.message);
    return null;
  }

  const filteredData = data.filter((item) => item.factory_section_id !== null);
  const sectionIds = filteredData.map((item) => item.factory_section_id);

  const sectionData = await fetchFactorySectionsByIds(sectionIds);
  if (!sectionData) return null;
  const sectionMap = new Map(sectionData.map((section) => [section.id, section]));

  const factoryIds = sectionData.map((section) => section.factory_id);
  const factoryData = await fetchFactoriesByIds(factoryIds);
  if (!factoryData) return null;
  const factoryMap = new Map(factoryData.map((factory) => [factory.id, factory]));

  const result = filteredData
    .map((item) => {
      const section = sectionMap.get(item.factory_section_id);
      const factory = section ? factoryMap.get(section.factory_id) : null;

      return section && factory
        ? {
            section: `${factory.abbreviation} - ${section.name}`,
            order_count: item.count,
          }
        : null;
    })
    .filter(Boolean) as { section: string; order_count: number }[];

  return result;
};

export const fetchMetricsHighMaintenanceFactorySectionsCurrentMonth = async () => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

  const { data, error } = await supabase_client
    .from("orders")
    .select(`factory_section_id, count: factory_section_id.count()`)
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth)
    .order("count", { ascending: false })
    .limit(10);

  if (error) {
    toast.error(error.message);
    return null;
  }

  const filteredData = data.filter((item) => item.factory_section_id !== null);
  const sectionIds = filteredData.map((item) => item.factory_section_id);

  const sectionData = await fetchFactorySectionsByIds(sectionIds);
  if (!sectionData) return null;
  const sectionMap = new Map(sectionData.map((section) => [section.id, section]));

  const factoryIds = sectionData.map((section) => section.factory_id);
  const factoryData = await fetchFactoriesByIds(factoryIds);
  if (!factoryData) return null;
  const factoryMap = new Map(factoryData.map((factory) => [factory.id, factory]));

  const result = filteredData
    .map((item) => {
      const section = sectionMap.get(item.factory_section_id);
      const factory = section ? factoryMap.get(section.factory_id) : null;

      return section && factory
        ? {
            section: `${factory.abbreviation} - ${section.name}`,
            order_count: item.count,
          }
        : null;
    })
    .filter(Boolean) as { section: string; order_count: number }[];

  return result;
};

export const getOrdersByDateRange = async (start: Date, end: Date) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select(
      `
      id,
      req_num,
      created_at,
      order_note,
      created_by_user_id,
      department_id,
      current_status_id,
      factory_id,
      machine_id,
      factory_section_id,
      order_type,
      order_workflow_id,
      src_factory,
      src_project_component_id,
      project_id,
      project_component_id,
      order_workflows(*),
      departments(*),
      profiles(*),
      statuses(*),
      factory_sections(*),
      factories(*),
      machines(*)
      `
    )
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as Order[];
};

export const getOrdersTotalInRange = async (start: Date, end: Date) => {
  const { count, error } = await supabase_client
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const getOrdersTypeCountsClient = async (start: Date, end: Date) => {
  const { data, error } = await supabase_client
    .from("orders")
    .select("order_type")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) throw new Error(error.message);

  const countsByCode = ((data as { order_type: string | null }[]) ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      const code = (row.order_type ?? "").toUpperCase().trim();
      const key = code || "UNKNOWN";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return Object.entries(countsByCode).map(([code, total]) => ({
    code: code === "UNKNOWN" ? "" : code,
    label: labelForType(code),
    total,
  })) as OrdersTypeCount[];
};

// Type-aware open/closed counts in a date range
export const getOpenClosedCountsSmart = async (start: Date, end: Date) => {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const [pfmPfsOpen, pfmPfsDone, stmOpen, stmDone] = await Promise.all([
    supabase_client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("order_type", ["PFM", "PFS"])
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .neq("current_status_id", 8),

    supabase_client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("order_type", ["PFM", "PFS"])
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .eq("current_status_id", 8),

    supabase_client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_type", "STM")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .neq("current_status_id", 9),

    supabase_client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_type", "STM")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .eq("current_status_id", 9),
  ]);

  const open = (pfmPfsOpen.count ?? 0) + (stmOpen.count ?? 0);
  const completed = (pfmPfsDone.count ?? 0) + (stmDone.count ?? 0);

  const breakdown = {
    PFM_PFS: {
      open: pfmPfsOpen.count ?? 0,
      completed: pfmPfsDone.count ?? 0,
    },
    STM: {
      open: stmOpen.count ?? 0,
      completed: stmDone.count ?? 0,
    },
  };

  return { open, completed, breakdown };
};

const toISO = (d: Date) => d.toISOString();

/** GRAND TOTAL purchase expense across order_parts (qty * unit_cost) for purchase orders in range */
export const getPurchaseExpenseTotalInRange = async (start: Date, end: Date) => {
  const { data, error } = await supabase_client
    .from("order_parts")
    .select("qty, unit_cost, orders!inner(order_type, created_at)")
    .in("orders.order_type", ["PFM", "PFP", "PFS"])
    .gte("orders.created_at", toISO(start))
    .lte("orders.created_at", toISO(end));

  if (error) throw new Error(error.message);

  let total = 0;
  (data as { qty: number | null; unit_cost: number | null }[]).forEach((r) => {
    total += (r.qty ?? 0) * (r.unit_cost ?? 0);
  });
  return total;
};

/** EXPENSE by Factory (label: "ABB - Name") */
export const getPurchaseExpenseByFactoryClient = async (
  start: Date,
  end: Date
): Promise<ExpenseByFactory[]> => {
  const { data, error } = await supabase_client
    .from("order_parts")
    .select("qty, unit_cost, orders!inner(order_type, created_at, factory_id)")
    .in("orders.order_type", ["PFM", "PFP", "PFS"])
    .gte("orders.created_at", toISO(start))
    .lte("orders.created_at", toISO(end));

  if (error) throw new Error(error.message);

  const byFactory = new Map<number | null, number>();
  (data as any[]).forEach((r) => {
    const fid = (r.orders?.factory_id ?? null) as number | null;
    const qty = r.qty ?? 0;
    const cost = r.unit_cost ?? 0;
    byFactory.set(fid, (byFactory.get(fid) ?? 0) + qty * cost);
  });

  const ids = [...byFactory.keys()].filter((k): k is number => typeof k === "number");
  let factoryMap = new Map<number, { name: string; abbreviation?: string | null }>();
  if (ids.length) {
    const factories = await fetchFactoriesByIds(ids);
    if (factories) {
      factoryMap = new Map(
        factories.map((f) => [f.id, { name: f.name, abbreviation: (f as any).abbreviation ?? null }])
      );
    }
  }

  const result: ExpenseByFactory[] = [];
  byFactory.forEach((total, fid) => {
    if (fid === null) {
      // keep a null bucket for completeness; your UI can choose to hide it
      result.push({ factory_id: null, label: "Unassigned factory", total });
    } else {
      const f = factoryMap.get(fid);
      const label = f ? (f.abbreviation ? `${f.abbreviation} - ${f.name}` : f.name) : `Factory #${fid}`;
      result.push({ factory_id: fid, label, total });
    }
  });

  result.sort((a, b) => b.total - a.total);
  return result;
};
