import React, { useState, useMemo } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader from '@/components/newcomponents/customui/AppShellHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useAppSelector } from '@/app/hooks';
import { Users, Search, Loader2, DollarSign, FileSpreadsheet, Mail } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { getSalesOrderKanbanColumn } from '@/components/newcomponents/customui/orders/salesOrderStatusConstants';
import { API_LIMITS } from '@/constants/apiLimits';

// Helper to assign a pleasant gradient based on user id/initials
const getAvatarStyle = (userId: number) => {
  const gradients = [
    'from-pink-500 to-rose-500 text-white',
    'from-purple-500 to-indigo-500 text-white',
    'from-blue-500 to-cyan-500 text-white',
    'from-teal-500 to-emerald-500 text-white',
    'from-amber-500 to-orange-500 text-white',
  ];
  return gradients[userId % gradients.length];
};

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-brand-primary/15 text-brand-primary border-brand-primary/30';
    case 'manager':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case 'member':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
    case 'viewer':
      return 'bg-muted text-muted-foreground border-border';
    case 'ground-team':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

const SalesTeamPage: React.FC = () => {
  const { workspace } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const { data: members = [], isLoading: membersLoading } = useGetWorkspaceMembersQuery(
    workspace?.id ?? 0,
    { skip: !workspace?.id }
  );
  const { data: orders = [], isLoading: ordersLoading } = useGetSalesOrdersQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: statuses = [] } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });

  const isLoading = membersLoading || ordersLoading;

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.user_name ?? '').toLowerCase().includes(q) ||
        (m.user_email ?? '').toLowerCase().includes(q) ||
        (m.user_position ?? '').toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // Compute sales metrics per member
  const memberStats = useMemo(() => {
    const stats: Record<number, { count: number; closedValue: number }> = {};

    // Initialize stats for each member
    members.forEach((m) => {
      stats[m.user_id] = { count: 0, closedValue: 0 };
    });

    // Populate stats from sales orders
    orders.forEach((o) => {
      const creatorId = o.created_by;
      if (creatorId && stats[creatorId] !== undefined) {
        stats[creatorId].count += 1;
        const isClosed = getSalesOrderKanbanColumn(o.current_status_id, statuses) === 'completed';
        if (isClosed) {
          stats[creatorId].closedValue += o.total_amount || 0;
        }
      }
    });

    return stats;
  }, [members, orders, statuses]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Sales Team</h1>
            </div>
            <div className="relative w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border focus-visible:ring-brand-primary"
              />
            </div>
          </div>
        </AppShellHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
              <p className="text-sm">Loading team directory...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No team members match your search.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => {
                const stats = memberStats[member.user_id] || { count: 0, closedValue: 0 };
                const initials = (member.user_name ?? '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'U';

                return (
                  <Card key={member.id} className="border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-brand-primary/45 transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarStyle(member.user_id)} flex items-center justify-center text-sm font-bold shadow-inner shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-card-foreground text-base truncate">{member.user_name || 'Unnamed User'}</h3>
                            <Badge variant="outline" className={`${roleBadgeClass(member.role)} uppercase text-[10px] tracking-wider px-1.5 py-0`}>
                              {member.role}
                            </Badge>
                          </div>
                          {member.user_position && (
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{member.user_position}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 truncate">
                            <Mail className="h-3 w-3 shrink-0 text-muted-foreground/75" />
                            <span className="truncate">{member.user_email || 'No email provided'}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="border-t border-border/50 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/40 rounded-lg p-2.5 flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Sales Closed</span>
                          </div>
                          <span className="text-lg font-bold text-card-foreground mt-1.5">{formatCurrency(stats.closedValue)}</span>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                            <span>Deals Created</span>
                          </div>
                          <span className="text-lg font-bold text-card-foreground mt-1.5">{stats.count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTeamPage;
