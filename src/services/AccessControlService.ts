// src/services/AccessSettingsService.ts
import { supabase_client } from "@/services/SupabaseClient";
import { AccessControl, AccessType, AccessRole } from "@/types";

/* ────────────────────────────────────────────────────────────────────────── */
/* TYPES & CONSTANTS                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

export interface Status { id: number; name: string; }

/** Canonical page targets to show (with spaces) */
export const PAGE_TARGETS = [
  "home",
  "parts",
  "view part",
  "orders",
  "create order",
  "view order",
  "manage order",
  "storage",
  "machine",
  "invoice",
  "management",
  "project",
  "businesslens",
  "businesslens reports",
] as const;
export type PageTarget = (typeof PAGE_TARGETS)[number];

export const ACCESS_ROLES: AccessRole[] = [
  "owner",
  "finance",
  "ground-team",
  "ground-team-manager",
];

const OWNER: AccessRole = "owner";
const ROLE_ORDER: AccessRole[] = ["owner", "finance", "ground-team", "ground-team-manager"];
const sortRoles = (a: AccessRole, b: AccessRole) =>
  ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
const keepOwner = (roles: AccessRole[]) =>
  Array.from(new Set<AccessRole>([OWNER, ...roles]));

/** Feature keys (machine names stored in access_control.target when type='feature') */
export const FEATURE_KEYS = [
  "finance_visibility",
  "storage_instant_add",
  "storage_manual_updates",
  "machine_instant_add",
  "machine_manual_updates",
  "order_delete",
  "order_create",
  "damaged_parts_manual_updates", 
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Shared, human-friendly mapping for consistent UI everywhere */
export const FEATURE_MAPPING: Record<
  FeatureKey,
  { label: string; description?: string; group?: "Storage" | "Machine" | "Order" | "Finance" | "Damaged Parts"}
> = {
  finance_visibility: {
    label: "Finance Visibility",
    description: "See finance-only fields like unit costs.",
    group: "Finance",
  },
  storage_instant_add: {
    label: "Storage - Instant Add",
    description: "Create storage items instantly without review.",
    group: "Storage",
  },
  storage_manual_updates: {
    label: "Storage - Manual Updates",
    description: "Manually edit existing storage records.",
    group: "Storage",
  },
  machine_instant_add: {
    label: "Machine - Instant Add",
    description: "Create machines instantly without review.",
    group: "Machine",
  },
  machine_manual_updates: {
    label: "Machine - Manual Updates",
    description: "Manually edit machine records.",
    group: "Machine",
  },
  order_delete: {
    label: "Order - Delete",
    description: "Delete orders.",
    group: "Order",
  },
  order_create: {
    label: "Order - Create",
    description: "Create new orders (beyond page access).",
    group: "Order",
  },
  damaged_parts_manual_updates: {
    label: "Damaged Parts - Manual Updates",
    description: "Manually edit damaged parts records.",
    group: "Damaged Parts",
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Reference lookups                                                         */
/* ────────────────────────────────────────────────────────────────────────── */
export async function listStatuses(): Promise<Status[]> {
  const { data, error } = await supabase_client
    .from("statuses")
    .select("id,name")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Status[];
}
export function listPages(): PageTarget[] {
  return [...PAGE_TARGETS];
}
export function listRoles(): AccessRole[] {
  return [...ACCESS_ROLES];
}
export function listFeatures(): FeatureKey[] {
  // mutable copy of the readonly tuple
  return [...FEATURE_KEYS];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* PAGE ACCESS (matrix + writers)                                            */
/* ────────────────────────────────────────────────────────────────────────── */
export interface PageAccessRow {
  target: string;
  roles: AccessRole[];
}

export async function fetchPageAccessMatrix(): Promise<PageAccessRow[]> {
  const { data, error } = await supabase_client
    .from("access_control")
    .select("target, role")
    .eq("type", "page" as AccessType);
  if (error) throw error;

  const map = new Map<string, Set<AccessRole>>();
  for (const p of PAGE_TARGETS) map.set(p, new Set<AccessRole>());
  for (const row of (data ?? []) as Pick<AccessControl, "target" | "role">[]) {
    if (!map.has(row.target)) map.set(row.target, new Set<AccessRole>());
    map.get(row.target)!.add(row.role);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([target, set]) => ({ target, roles: Array.from(set).sort(sortRoles) }));
}

export async function grantPageAccess(role: AccessRole, page: string) {
  const { error } = await supabase_client
    .from("access_control")
    .upsert([{ type: "page" as AccessType, target: page, role }], {
      onConflict: "type,target,role",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

export async function revokePageAccess(role: AccessRole, page: string) {
  if (role === OWNER) return;
  const { error } = await supabase_client
    .from("access_control")
    .delete()
    .eq("type", "page" as AccessType)
    .eq("target", page)
    .eq("role", role);
  if (error) throw error;
}

export async function setPageRoles(page: string, roles: AccessRole[]) {
  const next = keepOwner(roles);

  const { data, error } = await supabase_client
    .from("access_control")
    .select("role")
    .eq("type", "page" as AccessType)
    .eq("target", page);
  if (error) throw error;

  const current = new Set<AccessRole>((data ?? []).map((d) => (d as AccessControl).role));
  const nextSet = new Set<AccessRole>(next);

  const toAdd: AccessRole[] = [];
  const toRemove: AccessRole[] = [];

  for (const r of nextSet) if (!current.has(r)) toAdd.push(r);
  for (const r of current) if (!nextSet.has(r) && r !== OWNER) toRemove.push(r);

  if (toAdd.length) {
    const rows = toAdd.map((r) => ({ type: "page" as AccessType, target: page, role: r }));
    const { error: e1 } = await supabase_client
      .from("access_control")
      .upsert(rows, { onConflict: "type,target,role", ignoreDuplicates: true });
    if (e1) throw e1;
  }
  if (toRemove.length) {
    const { error: e2 } = await supabase_client
      .from("access_control")
      .delete()
      .eq("type", "page" as AccessType)
      .eq("target", page)
      .in("role", toRemove);
    if (e2) throw e2;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MANAGE ORDER (matrix + writers)                                           */
/* ────────────────────────────────────────────────────────────────────────── */
export interface ManageOrderAccessRow {
  statusId: number;
  statusName: string;
  roles: AccessRole[];
}

export async function fetchManageOrderAccessMatrix(opts?: { statuses?: Status[] }): Promise<ManageOrderAccessRow[]> {
  const statuses = opts?.statuses ?? (await listStatuses());

  const { data, error } = await supabase_client
    .from("access_control")
    .select("target, role")
    .eq("type", "manage_order" as AccessType);
  if (error) throw error;

  const byId = new Map<number, Set<AccessRole>>();
  for (const s of statuses) byId.set(s.id, new Set<AccessRole>());
  for (const row of (data ?? []) as Pick<AccessControl, "target" | "role">[]) {
    const id = Number(row.target);
    if (!Number.isFinite(id)) continue;
    if (!byId.has(id)) byId.set(id, new Set<AccessRole>());
    byId.get(id)!.add(row.role);
  }

  return statuses.map((s) => ({
    statusId: s.id,
    statusName: s.name,
    roles: Array.from(byId.get(s.id) ?? new Set<AccessRole>()).sort(sortRoles),
  }));
}

export async function grantManageOrder(role: AccessRole, statusId: number) {
  const { error } = await supabase_client
    .from("access_control")
    .upsert([{ type: "manage_order" as AccessType, target: String(statusId), role }], {
      onConflict: "type,target,role",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

export async function revokeManageOrder(role: AccessRole, statusId: number) {
  if (role === OWNER) return;
  const { error } = await supabase_client
    .from("access_control")
    .delete()
    .eq("type", "manage_order" as AccessType)
    .eq("target", String(statusId))
    .eq("role", role);
  if (error) throw error;
}

export async function setManageOrderRoles(statusId: number, roles: AccessRole[]) {
  const next = keepOwner(roles);

  const { data, error } = await supabase_client
    .from("access_control")
    .select("role")
    .eq("type", "manage_order" as AccessType)
    .eq("target", String(statusId));
  if (error) throw error;

  const current = new Set<AccessRole>((data ?? []).map((d) => (d as AccessControl).role));
  const nextSet = new Set<AccessRole>(next);

  const toAdd: AccessRole[] = [];
  const toRemove: AccessRole[] = [];

  for (const r of nextSet) if (!current.has(r)) toAdd.push(r);
  for (const r of current) if (!nextSet.has(r) && r !== OWNER) toRemove.push(r);

  if (toAdd.length) {
    const rows = toAdd.map((r) => ({ type: "manage_order" as AccessType, target: String(statusId), role: r }));
    const { error: e1 } = await supabase_client
      .from("access_control")
      .upsert(rows, { onConflict: "type,target,role", ignoreDuplicates: true });
    if (e1) throw e1;
  }
  if (toRemove.length) {
    const { error: e2 } = await supabase_client
      .from("access_control")
      .delete()
      .eq("type", "manage_order" as AccessType)
      .eq("target", String(statusId))
      .in("role", toRemove);
    if (e2) throw e2;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* FEATURES (matrix + writers)                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export interface FeatureAccessRow {
  key: FeatureKey;
  roles: AccessRole[];
}

/** Matrix for Settings UI: every feature with roles that currently have it */
export async function fetchFeatureAccessMatrix(
  keys: ReadonlyArray<FeatureKey> = FEATURE_KEYS
): Promise<FeatureAccessRow[]> {
  const { data, error } = await supabase_client
    .from("access_control")
    .select("target, role")
    .eq("type", "feature" as AccessType);
  if (error) throw error;

  const map = new Map<string, Set<AccessRole>>();
  for (const k of keys) map.set(k, new Set<AccessRole>());

  for (const row of (data ?? []) as Pick<AccessControl, "target" | "role">[]) {
    if (map.has(row.target)) map.get(row.target)!.add(row.role);
  }

  return keys.map((k) => ({
    key: k as FeatureKey,
    roles: Array.from(map.get(k) ?? new Set<AccessRole>()).sort(sortRoles),
  }));
}

/** List roles for a specific feature key */
export async function fetchFeatureRoles(key: FeatureKey): Promise<AccessRole[]> {
  const { data, error } = await supabase_client
    .from("access_control")
    .select("role")
    .eq("type", "feature" as AccessType)
    .eq("target", key)
    .order("role", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d) => (d as AccessControl).role as AccessRole);
}

/** Grant one role a feature (idempotent) */
export async function grantFeature(role: AccessRole, key: FeatureKey) {
  const { error } = await supabase_client
    .from("access_control")
    .upsert([{ type: "feature" as AccessType, target: key, role }], {
      onConflict: "type,target,role",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

/** Revoke a feature from a role (owner protected) */
export async function revokeFeature(role: AccessRole, key: FeatureKey) {
  if (role === OWNER) return;
  const { error } = await supabase_client
    .from("access_control")
    .delete()
    .eq("type", "feature" as AccessType)
    .eq("target", key)
    .eq("role", role);
  if (error) throw error;
}

/** Replace all roles for a feature key (owner kept/added) */
export async function setFeatureRoles(key: FeatureKey, roles: AccessRole[]) {
  const next = keepOwner(roles);

  const { data, error } = await supabase_client
    .from("access_control")
    .select("role")
    .eq("type", "feature" as AccessType)
    .eq("target", key);
  if (error) throw error;

  const current = new Set<AccessRole>((data ?? []).map((d) => (d as AccessControl).role));
  const nextSet = new Set<AccessRole>(next);

  const toAdd: AccessRole[] = [];
  const toRemove: AccessRole[] = [];

  for (const r of nextSet) if (!current.has(r)) toAdd.push(r);
  for (const r of current) if (!nextSet.has(r) && r !== OWNER) toRemove.push(r);

  if (toAdd.length) {
    const rows = toAdd.map((r) => ({ type: "feature" as AccessType, target: key, role: r }));
    const { error: e1 } = await supabase_client
      .from("access_control")
      .upsert(rows, { onConflict: "type,target,role", ignoreDuplicates: true });
    if (e1) throw e1;
  }
  if (toRemove.length) {
    const { error: e2 } = await supabase_client
      .from("access_control")
      .delete()
      .eq("type", "feature" as AccessType)
      .eq("target", key)
      .in("role", toRemove);
    if (e2) throw e2;
  }
}

/* Convenience wrappers for finance visibility using the feature system */
export const fetchFinanceVisibilityRoles = () => fetchFeatureRoles("finance_visibility");
export const grantFinanceVisibility = (role: AccessRole) => grantFeature(role, "finance_visibility");
export const revokeFinanceVisibility = (role: AccessRole) => revokeFeature(role, "finance_visibility");
export const setFinanceVisibilityRoles = (roles: AccessRole[]) => setFeatureRoles("finance_visibility", roles);

/* ────────────────────────────────────────────────────────────────────────── */
/* ROLE-CENTRIC SNAPSHOT (for AuthContext)                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface RoleAccessSnapshot {
  pagesSet: Set<string>;        // page keys the role can view
  manageOrderSet: Set<number>;  // status ids (numeric) where manage-order is allowed
  featuresSet: Set<FeatureKey>; // feature keys the role has
}

/** Fetch a snapshot of access for a single role */
export async function fetchRoleAccessSnapshot(role: AccessRole): Promise<RoleAccessSnapshot> {
  const [pagesRes, moRes, featRes] = await Promise.all([
    supabase_client
      .from("access_control")
      .select("target")
      .eq("type", "page" as AccessType)
      .eq("role", role),

    supabase_client
      .from("access_control")
      .select("target")
      .eq("type", "manage_order" as AccessType)
      .eq("role", role),

    supabase_client
      .from("access_control")
      .select("target")
      .eq("type", "feature" as AccessType)
      .eq("role", role),
  ]);

  if (pagesRes.error) throw pagesRes.error;
  if (moRes.error) throw moRes.error;
  if (featRes.error) throw featRes.error;

  const pagesSet = new Set<string>((pagesRes.data ?? []).map((d) => (d as AccessControl).target));

  const manageOrderSet = new Set<number>(
    (moRes.data ?? [])
      .map((d) => Number((d as AccessControl).target))
      .filter((n) => Number.isFinite(n)) as number[]
  );

  const validFeatures = new Set<FeatureKey>(FEATURE_KEYS);
  const featuresSet = new Set<FeatureKey>(
    (featRes.data ?? [])
      .map((d) => (d as AccessControl).target)
      .filter((t): t is FeatureKey => validFeatures.has(t as FeatureKey))
  );

  return { pagesSet, manageOrderSet, featuresSet };
}

/** build handy checkers from a snapshot */
export function makeAccessCheckers(s: RoleAccessSnapshot) {
  return {
    canViewPage: (pageKey: string) => s.pagesSet.has(pageKey),
    canAccessManageOrder: (statusId: number) => s.manageOrderSet.has(statusId),
    hasFeature: (key: FeatureKey) => s.featuresSet.has(key),
  };
}
