import { useEffect, useMemo, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import { X, Lock, Plus, RotateCw } from "lucide-react";

import {
  fetchManageOrderAccessMatrix,
  grantManageOrder,
  revokeManageOrder,
  listRoles,
  listStatuses, // for id->name map
  type ManageOrderAccessRow,
} from "@/services/AccessControlService";

import { getAllOrderWorkflows } from "@/services/OrderWorkflowService"; // adjust path if needed
import type { AccessRole, OrderWorkflow } from "@/types";

const OWNER: AccessRole = "owner";

const ManageOrderAccessControlCard = () => {
  const [rows, setRows] = useState<ManageOrderAccessRow[]>([]);
  const [allRoles, setAllRoles] = useState<AccessRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const [workflows, setWorkflows] = useState<OrderWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");

  const [busyStatus, setBusyStatus] = useState<number | null>(null);
  const [pendingRoleByStatus, setPendingRoleByStatus] = useState<Record<number, AccessRole | "">>({});

  // reference: all statuses (for names) and a quick lookup
  const [statusNameById, setStatusNameById] = useState<Record<number, string>>({});

  // initial data load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [wf, roles, statuses] = await Promise.all([
          getAllOrderWorkflows(),
          listRoles(),
          listStatuses(),
        ]);

        setAllRoles(roles);

        const statusNameMap: Record<number, string> = {};
        statuses.forEach((s) => (statusNameMap[s.id] = s.name));
        setStatusNameById(statusNameMap);

        if (wf && wf.length > 0) {
          setWorkflows(wf);
          setSelectedWorkflowId(String(wf[0].id)); // default to first workflow
        } else {
          setWorkflows([]);
          setSelectedWorkflowId("");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // re/load matrix whenever workflow changes
  useEffect(() => {
    (async () => {
      if (!selectedWorkflowId) return;
      const wf = workflows.find((w) => String(w.id) === String(selectedWorkflowId));
      if (!wf) return;

      try {
        setLoading(true);
        // Build a statuses array limited to this workflow, with id+name
        const filteredStatuses = wf.status_sequence
          .map((id) => ({ id, name: statusNameById[id] ?? `Status ${id}` }))
          .filter((s) => Number.isFinite(s.id));

        const matrix = await fetchManageOrderAccessMatrix({ statuses: filteredStatuses });
        setRows(matrix);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load access for selected workflow.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedWorkflowId, workflows, statusNameById]);

  // search by status name only (no IDs shown)
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.statusName.toLowerCase().includes(q));
  }, [rows, search]);

  const handleAdd = async (statusId: number) => {
    const role = pendingRoleByStatus[statusId];
    if (!role) {
      toast.error("Select a role to add.");
      return;
    }
    const row = rows.find((r) => r.statusId === statusId);
    if (row?.roles.includes(role)) {
      toast("Role already has access.", { icon: "ℹ️" });
      return;
    }
    try {
      setBusyStatus(statusId);
      await grantManageOrder(role, statusId);
      setPendingRoleByStatus((prev) => ({ ...prev, [statusId]: "" }));
      toast.success(`Granted ${role} for "${statusNameById[statusId] ?? "Status"}".`);
      // reload matrix for current workflow
      const wf = workflows.find((w) => String(w.id) === String(selectedWorkflowId));
      if (wf) {
        const filteredStatuses = wf.status_sequence
          .map((id) => ({ id, name: statusNameById[id] ?? `Status ${id}` }))
          .filter((s) => Number.isFinite(s.id));
        const matrix = await fetchManageOrderAccessMatrix({ statuses: filteredStatuses });
        setRows(matrix);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to grant access.");
    } finally {
      setBusyStatus(null);
    }
  };

  const handleRemove = async (statusId: number, role: AccessRole) => {
    if (role === OWNER) {
      toast("Owner cannot be removed.", { icon: "🔒" });
      return;
    }
    try {
      setBusyStatus(statusId);
      await revokeManageOrder(role, statusId);
      toast.success(`Revoked ${role} for "${statusNameById[statusId] ?? "Status"}".`);
      // reload matrix for current workflow
      const wf = workflows.find((w) => String(w.id) === String(selectedWorkflowId));
      if (wf) {
        const filteredStatuses = wf.status_sequence
          .map((id) => ({ id, name: statusNameById[id] ?? `Status ${id}` }))
          .filter((s) => Number.isFinite(s.id));
        const matrix = await fetchManageOrderAccessMatrix({ statuses: filteredStatuses });
        setRows(matrix);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke access.");
    } finally {
      setBusyStatus(null);
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      // re-fetch workflows and statuses (in case they changed), then reload matrix
      const [wf, statuses] = await Promise.all([getAllOrderWorkflows(), listStatuses()]);
      if (wf) setWorkflows(wf);

      const statusNameMap: Record<number, string> = {};
      statuses.forEach((s) => (statusNameMap[s.id] = s.name));
      setStatusNameById(statusNameMap);

      const stillExists = wf?.some((w) => String(w.id) === String(selectedWorkflowId));
      const activeId = stillExists ? selectedWorkflowId : wf && wf.length ? String(wf[0].id) : "";
      setSelectedWorkflowId(activeId);

      if (activeId) {
        const active = (wf ?? []).find((w) => String(w.id) === String(activeId));
        const filteredStatuses = (active?.status_sequence ?? [])
          .map((id) => ({ id, name: statusNameById[id] ?? `Status ${id}` }))
          .filter((s) => Number.isFinite(s.id));
        const matrix = await fetchManageOrderAccessMatrix({ statuses: filteredStatuses });
        setRows(matrix);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Manage Order Access</h2>
        <div className="flex items-center gap-2">
          {/* Workflow dropdown */}
          <Select value={selectedWorkflowId} onValueChange={(v) => setSelectedWorkflowId(v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No workflows found</div>
              ) : (
                workflows.map((wf) => (
                  <SelectItem key={wf.id} value={String(wf.id)}>
                    {wf.name || wf.type || `Workflow ${wf.id}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search statuses by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="top-0 bg-white shadow-sm z-10">
              <TableRow className="bg-muted">
                <TableHead className="w-[50%]">Status</TableHead>
                <TableHead className="w-[35%]">Roles with Access</TableHead>
                <TableHead className="w-[15%]">Add Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                    No statuses match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const current = new Set(row.roles);
                  const availableToAdd = allRoles.filter((r) => !current.has(r));
                  const selected = pendingRoleByStatus[row.statusId] ?? "";
                  const busy = busyStatus === row.statusId;

                  return (
                    <TableRow key={row.statusId}>
                      <TableCell className="font-medium">{row.statusName}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {row.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles yet</span>
                          ) : (
                            row.roles.map((role) => (
                              <span
                                key={`${row.statusId}-${role}`}
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                              >
                                {role}
                                {role === OWNER ? (
                                  <Lock className="w-3.5 h-3.5 opacity-70" />
                                ) : (
                                  <button
                                    className="ml-0.5 hover:text-red-600 disabled:opacity-50"
                                    onClick={() => handleRemove(row.statusId, role)}
                                    disabled={busy}
                                    aria-label={`Remove ${role}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            className="w-44 h-9 rounded-md border px-3 text-sm"
                            value={selected as string}
                            onChange={(e) =>
                              setPendingRoleByStatus((prev) => ({
                                ...prev,
                                [row.statusId]: e.target.value as AccessRole,
                              }))
                            }
                            disabled={busy}
                          >
                            <option value="" disabled>
                              Select role to add
                            </option>
                            {availableToAdd.length === 0 ? (
                              <option value="" disabled>
                                All roles added
                              </option>
                            ) : (
                              availableToAdd.map((r) => (
                                <option key={`${row.statusId}-${r}`} value={r}>
                                  {r}
                                </option>
                              ))
                            )}
                          </select>

                          <Button
                            className="gap-2"
                            onClick={() => handleAdd(row.statusId)}
                            disabled={busy || !selected || availableToAdd.length === 0}
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ManageOrderAccessControlCard;
