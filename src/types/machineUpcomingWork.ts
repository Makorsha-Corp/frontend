/** Upcoming machine work — open and future draft work orders. */

export interface MachineUpcomingWorkItem {
  source_id: number;
  date: string;
  title: string;
  status: string | null;
  work_order_type_name: string | null;
}

export interface MachineUpcomingWorkRow {
  machine_id: number;
  name: string;
  factory_id: number;
  factory_section_id: number | null;
  section_name: string | null;
  earliest_date: string;
  count: number;
  items: MachineUpcomingWorkItem[];
}

export interface ListUpcomingMachineWorkParams {
  within_days?: number;
  factory_id?: number;
  include_overdue?: boolean;
}
