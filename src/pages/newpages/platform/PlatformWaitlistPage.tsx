import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';

import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useListWaitlistSignupsQuery,
  useUpdateWaitlistSignupStatusMutation,
  type WaitlistStatus,
} from '@/features/waitlist/waitlistApi';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { appToast } from '@/lib/appToast';

const STATUS_FILTER_ALL = 'all';

const STATUS_OPTIONS: { value: WaitlistStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
];

const PlatformWaitlistPage: React.FC = () => {
  const formatDateTime = useFormatDateTimeFromApi();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | typeof STATUS_FILTER_ALL>(
    STATUS_FILTER_ALL,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listArgs = useMemo(
    () => ({
      limit: 200,
      ...(searchDebounced ? { search: searchDebounced } : {}),
      ...(statusFilter === STATUS_FILTER_ALL ? {} : { status: statusFilter }),
    }),
    [searchDebounced, statusFilter],
  );

  const { data, isLoading, isError, error } = useListWaitlistSignupsQuery(listArgs);
  const [updateStatus] = useUpdateWaitlistSignupStatusMutation();

  const handleStatusChange = async (signupId: number, status: WaitlistStatus) => {
    try {
      await updateStatus({ signupId, status }).unwrap();
      appToast.success('Waitlist status updated.');
    } catch {
      appToast.error('Could not update waitlist status.');
    }
  };

  const forbidden =
    isError &&
    typeof error === 'object' &&
    error != null &&
    'status' in error &&
    (error as { status?: number }).status === 403;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppShellHeader sticky>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={appShellHeaderLeftGroupClass}>
            <div className={appShellHeaderIconTileClass}>
              <ClipboardList className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h1 className={appShellHeaderTitleClass}>Waitlist</h1>
              <p className="text-xs text-muted-foreground">
                Landing signups — platform admin access
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or name…"
              className="w-[220px]"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as WaitlistStatus | typeof STATUS_FILTER_ALL)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AppShellHeader>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {forbidden ? (
          <p className="text-sm text-muted-foreground">
            You need <code className="rounded bg-muted px-1 py-0.5 text-xs">is_platform_admin</code>{' '}
            on your profile, or your email on the legacy{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">WAITLIST_ADMIN_EMAILS</code>{' '}
            allowlist. See backend{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/PLATFORM_ADMIN.md</code>.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Could not load waitlist signups.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updates</TableHead>
                  <TableHead>Signed up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell className="font-medium">
                      {[signup.first_name, signup.last_name].filter(Boolean).join(' ') || '—'}
                    </TableCell>
                    <TableCell>{signup.email}</TableCell>
                    <TableCell>{signup.company_name || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={signup.status}
                        onValueChange={(value) =>
                          handleStatusChange(signup.id, value as WaitlistStatus)
                        }
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {signup.wants_product_updates ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(signup.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.items.length ?? 0) === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No signups found.</p>
            ) : null}
            {data && data.total > data.items.length ? (
              <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                Showing {data.items.length} of {data.total}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformWaitlistPage;
