
import { useEffect, useMemo, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { X, Lock, Plus, RotateCw } from "lucide-react";

import {
  listRoles,
  listFeatures,
  FEATURE_MAPPING,
  fetchFeatureAccessMatrix,
  grantFeature,
  revokeFeature,
} from "@/services/AccessControlService";
import type { FeatureKey, FeatureAccessRow } from "@/services/AccessControlService";
import type { AccessRole } from "@/types";

const OWNER: AccessRole = "owner";

const FeatureAccessControlCard = () => {
  const [rows, setRows] = useState<FeatureAccessRow[]>([]);
  const [allRoles, setAllRoles] = useState<AccessRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // per-feature select state: feature key -> role to add
  const [pendingRoleByFeature, setPendingRoleByFeature] = useState<Record<FeatureKey, AccessRole | "">>({} as any);
  // per-feature busy flags for smoother UX
  const [busyKeys, setBusyKeys] = useState<Record<FeatureKey, boolean>>({} as any);

  const [search, setSearch] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const [keys, roles] = await Promise.all([listFeatures(), listRoles()]);
      const matrix = await fetchFeatureAccessMatrix(keys);
      // sort by label for nice display
      matrix.sort((a, b) => {
        const la = FEATURE_MAPPING[a.key]?.label ?? a.key;
        const lb = FEATURE_MAPPING[b.key]?.label ?? b.key;
        return la.localeCompare(lb);
      });
      setRows(matrix);
      setAllRoles(roles);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load feature access.");
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
    return rows.filter((r) => {
      const meta = FEATURE_MAPPING[r.key];
      const label = meta?.label ?? r.key;
      const desc = meta?.description ?? "";
      return (
        r.key.toLowerCase().includes(q) ||
        label.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const addRole = async (key: FeatureKey) => {
    const role = pendingRoleByFeature[key];
    if (!role) {
      toast.error("Select a role to add.");
      return;
    }
    const row = rows.find((r) => r.key === key);
    if (row?.roles.includes(role)) {
      toast("Role already has this feature.", { icon: "ℹ️" });
      return;
    }
    try {
      setBusyKeys((prev) => ({ ...prev, [key]: true }));
      await grantFeature(role, key);
      setPendingRoleByFeature((prev) => ({ ...prev, [key]: "" }));
      toast.success(`Granted ${role} → ${FEATURE_MAPPING[key]?.label ?? key}.`);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to grant feature.");
    } finally {
      setBusyKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const removeRole = async (key: FeatureKey, role: AccessRole) => {
    if (role === OWNER) {
      toast("Owner cannot be removed.", { icon: "🔒" });
      return;
    }
    try {
      setBusyKeys((prev) => ({ ...prev, [key]: true }));
      await revokeFeature(role, key);
      toast.success(`Revoked ${role} from ${FEATURE_MAPPING[key]?.label ?? key}.`);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke feature.");
    } finally {
      setBusyKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Feature Access Control</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search features…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Manage global feature gates. Use this to control actions like order delete/create, storage & machine edits, and finance visibility.
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="top-0 bg-white shadow-sm z-10">
              <TableRow className="bg-muted">
                <TableHead className="w-[35%]">Feature</TableHead>
                <TableHead className="w-[45%]">Roles with Access</TableHead>
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
                    No features match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const { key, roles } = row;
                  const meta = FEATURE_MAPPING[key];
                  const label = meta?.label ?? key;
                  const desc = meta?.description;
                  const current = new Set(roles);
                  const availableToAdd = allRoles.filter((r) => !current.has(r));
                  const selected = (pendingRoleByFeature[key] ?? "") as string;
                  const busy = !!busyKeys[key];

                  return (
                    <TableRow key={key}>
                      <TableCell className="align-top">
                        <div className="font-medium">{label}</div>
                        {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          {roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No roles yet</span>
                          ) : (
                            roles.map((role) => (
                              <span
                                key={`${key}-${role}`}
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                              >
                                {role}
                                {role === OWNER ? (
                                  <Lock className="w-3.5 h-3.5 opacity-70" />
                                ) : (
                                  <button
                                    className="ml-0.5 hover:text-red-600 disabled:opacity-50"
                                    onClick={() => removeRole(key, role)}
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

                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          <select
                            className="w-44 h-9 rounded-md border px-3 text-sm"
                            value={selected}
                            onChange={(e) =>
                              setPendingRoleByFeature((prev) => ({
                                ...prev,
                                [key]: e.target.value as AccessRole,
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
                                <option key={`${key}-add-${r}`} value={r}>
                                  {r}
                                </option>
                              ))
                            )}
                          </select>

                          <Button
                            className="gap-2"
                            onClick={() => addRole(key)}
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

export default FeatureAccessControlCard;
