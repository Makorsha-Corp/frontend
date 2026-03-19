import { useEffect, useMemo, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { X, Lock, Plus, RotateCw } from "lucide-react";

import {
  fetchPageAccessMatrix,
  grantPageAccess,
  revokePageAccess,
  listRoles,
  PageAccessRow,
} from "@/services/AccessControlService";
import { AccessRole } from "@/types";

const OWNER: AccessRole = "owner";

const PageAccessControlCard = () => {
  const [rows, setRows] = useState<PageAccessRow[]>([]);
  const [allRoles, setAllRoles] = useState<AccessRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  // per-row select state: page target -> role to add
  const [pendingRoleByPage, setPendingRoleByPage] = useState<Record<string, AccessRole | "">>({});

  const load = async () => {
    try {
      setLoading(true);
      const [matrix, roles] = await Promise.all([fetchPageAccessMatrix(), listRoles()]);
      setRows(matrix);
      setAllRoles(roles);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load page access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.target.toLowerCase().includes(q));
  }, [rows, search]);

  const handleAdd = async (page: string) => {
    const role = pendingRoleByPage[page];
    if (!role) {
      toast.error("Select a role to add.");
      return;
    }
    const row = rows.find((r) => r.target === page);
    if (row?.roles.includes(role)) {
      toast("Role already has access.", { icon: "ℹ️" });
      return;
    }
    try {
      await grantPageAccess(role, page);
      setPendingRoleByPage((prev) => ({ ...prev, [page]: "" }));
      toast.success(`Granted ${role} access to "${page}".`);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to grant access.");
    }
  };

  const handleRemove = async (page: string, role: AccessRole) => {
    if (role === OWNER) {
      toast("Owner cannot be removed.", { icon: "🔒" });
      return;
    }
    try {
      await revokePageAccess(role, page);
      toast.success(`Revoked ${role} from "${page}".`);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke access.");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Page Access Control</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
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
                <TableHead className="w-[30%]">Page</TableHead>
                <TableHead className="w-[50%]">Roles with Access</TableHead>
                <TableHead className="w-[20%]">Add Role</TableHead>
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
                    No pages match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const current = new Set(row.roles);
                  const availableToAdd = allRoles.filter((r) => !current.has(r));
                  const selected = pendingRoleByPage[row.target] ?? "";

                  return (
                    <TableRow key={row.target}>
                      <TableCell className="font-medium">{row.target}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {row.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles yet</span>
                          ) : (
                            row.roles.map((role) => (
                              <span
                                key={`${row.target}-${role}`}
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                              >
                                {role}
                                {role === OWNER ? (
                                  <Lock className="w-3.5 h-3.5 opacity-70" />
                                ) : (
                                  <button
                                    className="ml-0.5 hover:text-red-600"
                                    onClick={() => handleRemove(row.target, role)}
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
                              setPendingRoleByPage((prev) => ({
                                ...prev,
                                [row.target]: e.target.value as AccessRole,
                              }))
                            }
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
                                <option key={`${row.target}-${r}`} value={r}>
                                  {r}
                                </option>
                              ))
                            )}
                          </select>

                          <Button
                            className="gap-2"
                            onClick={() => handleAdd(row.target)}
                            disabled={!selected || availableToAdd.length === 0}
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

export default PageAccessControlCard;
