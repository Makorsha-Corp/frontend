import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderLeftGroupClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { useAppSelector } from '@/app/hooks';
import {
  useGetWorkspaceMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetWorkspaceInvitationsQuery,
  useSendInvitationMutation,
  useCancelInvitationMutation,
} from '@/features/workspaces/workspaceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast, { Toaster } from 'react-hot-toast';
import { Check, Copy, Loader2, Mail, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ASSIGNABLE_ROLES = ['manager', 'member', 'viewer', 'ground-team'] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-brand-primary/15 text-brand-primary';
    case 'manager':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'member':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
    case 'viewer':
      return 'bg-muted text-muted-foreground';
    case 'ground-team':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/* =========================================================================
   Page root — owner gate
   ========================================================================= */

const ManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspace, user } = useAppSelector((state) => state.auth);

  if (!workspace || workspace.role !== 'owner') {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-card-foreground">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">Only workspace owners can access this page.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className={appShellHeaderLeftGroupClass}>
            <div className={appShellHeaderIconTileClass}>
              <UserPlus size={18} />
            </div>
            <h1 className={appShellHeaderTitleClass}>Workspace Management</h1>
          </div>
        </AppShellHeader>

        <div className="p-6 lg:p-8">
          <Tabs defaultValue="members">
            <TabsList className="mb-6">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <MembersTab workspaceId={workspace.id} currentUserId={user?.id ?? 0} />
            </TabsContent>

            <TabsContent value="invitations">
              <InvitationsTab workspaceId={workspace.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   Members Tab
   ========================================================================= */

interface ConfirmRemoveState {
  userId: number;
  name: string;
}

const MembersTab: React.FC<{ workspaceId: number; currentUserId: number }> = ({
  workspaceId,
  currentUserId,
}) => {
  const { data: members, isLoading } = useGetWorkspaceMembersQuery(workspaceId);
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [confirmRemove, setConfirmRemove] = useState<ConfirmRemoveState | null>(null);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateRole({ workspaceId, userId, data: { new_role: newRole } }).unwrap();
      toast.success('Role updated');
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to update role';
      toast.error(msg);
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!confirmRemove) return;
    try {
      await removeMember({ workspaceId, userId: confirmRemove.userId }).unwrap();
      toast.success(`${confirmRemove.name} removed`);
      setConfirmRemove(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to remove member';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Confirm-remove dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Remove <strong>{confirmRemove?.name}</strong> from the workspace? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirmed}
              disabled={isRemoving}
            >
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!members || members.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No members found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_160px_80px] gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Member</span>
            <span>Email</span>
            <span>Role</span>
            <span className="text-right">Remove</span>
          </div>

          <div className="divide-y divide-border">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const isOwner = member.role === 'owner';

              return (
                <div
                  key={member.id}
                  className="grid grid-cols-[1fr_1fr_160px_80px] items-center gap-4 px-6 py-4"
                >
                  {/* Name */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.user_name ?? '—'}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                      )}
                    </p>
                    {member.user_position && (
                      <p className="truncate text-xs text-muted-foreground">{member.user_position}</p>
                    )}
                  </div>

                  {/* Email */}
                  <p className="truncate text-sm text-muted-foreground">{member.user_email ?? '—'}</p>

                  {/* Role */}
                  {isOwner || isSelf ? (
                    <span
                      className={cn(
                        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                        roleBadgeClass(member.role)
                      )}
                    >
                      {member.role.replace(/-/g, ' ')}
                    </span>
                  ) : (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(val) => handleRoleChange(member.user_id, val)}
                      disabled={isUpdatingRole}
                    >
                      <SelectTrigger className="h-8 w-[150px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize text-xs">
                            {r.replace(/-/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove */}
                  <div className="flex justify-end">
                    {!isOwner && !isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Remove from workspace"
                        onClick={() =>
                          setConfirmRemove({
                            userId: member.user_id,
                            name: member.user_name ?? member.user_email ?? 'Member',
                          })
                        }
                      >
                        <UserMinus size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

/* =========================================================================
   Invitations Tab
   ========================================================================= */

interface ConfirmCancelState {
  invitationId: number;
  email: string;
}

const InvitationsTab: React.FC<{ workspaceId: number }> = ({ workspaceId }) => {
  const [includeExpired, setIncludeExpired] = useState(false);
  const { data: invitations, isLoading } = useGetWorkspaceInvitationsQuery({
    workspaceId,
    includeExpired,
  });
  const [sendInvitation, { isLoading: isSending }] = useSendInvitationMutation();
  const [cancelInvitation, { isLoading: isCancelling }] = useCancelInvitationMutation();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('member');
  const [invitePosition, setInvitePosition] = useState('');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<ConfirmCancelState | null>(null);

  const closeSendDialog = () => {
    setSendDialogOpen(false);
    setCreatedToken(null);
    setInviteEmail('');
    setInviteRole('member');
    setInvitePosition('');
    setCopied(false);
  };

  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const result = await sendInvitation({
        workspaceId,
        data: {
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          position: invitePosition.trim() || null,
        },
      }).unwrap();
      setCreatedToken(result.token);
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to send invitation';
      toast.error(msg);
    }
  };

  const handleCancelConfirmed = async () => {
    if (!confirmCancel) return;
    try {
      await cancelInvitation({
        workspaceId,
        invitationId: confirmCancel.invitationId,
      }).unwrap();
      toast.success(`Invitation to ${confirmCancel.email} cancelled`);
      setConfirmCancel(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to cancel invitation';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Send invitation dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={(open) => !open && closeSendDialog()}>
        <DialogContent>
          {createdToken ? (
            <>
              <DialogHeader>
                <DialogTitle>Invitation created</DialogTitle>
                <DialogDescription>
                  Share this token with <strong>{inviteEmail}</strong> so they can join the workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Label className="text-xs text-muted-foreground">Invite token</Label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <code className="flex-1 truncate text-sm font-mono text-foreground select-all">
                    {createdToken}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopyToken(createdToken)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The token expires in 7 days. The recipient pastes it on the workspace selector page.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={closeSendDialog} className="bg-brand-primary hover:bg-brand-primary-hover">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Send workspace invitation</DialogTitle>
                <DialogDescription>
                  An invite token will be generated. Share it with the recipient to let them join.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AssignableRole)}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r.replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-position">
                    Position{' '}
                    <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="invite-position"
                    type="text"
                    placeholder="e.g. Site Supervisor, Driver"
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeSendDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSending}
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel invitation dialog */}
      <Dialog open={!!confirmCancel} onOpenChange={(open) => !open && setConfirmCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel invitation</DialogTitle>
            <DialogDescription>
              Cancel the invitation to <strong>{confirmCancel?.email}</strong>? They will no longer be able to join using this invite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirmed}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand-primary"
          />
          Show expired / cancelled
        </label>

        <Button
          onClick={() => setSendDialogOpen(true)}
          className="gap-2 bg-brand-primary hover:bg-brand-primary-hover"
        >
          <UserPlus size={16} />
          Send Invitation
        </Button>
      </div>

      {/* Invitation list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No invitations yet. Send one above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_140px_110px_40px_80px] gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Email</span>
            <span>Role</span>
            <span>Invited by</span>
            <span>Expires</span>
            <span>Token</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="grid grid-cols-[1fr_120px_140px_110px_40px_80px] items-center gap-4 px-6 py-4"
              >
                {/* Email + status badge */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
                  {inv.position && (
                    <p className="truncate text-xs text-muted-foreground">{inv.position}</p>
                  )}
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      inv.status === 'pending'
                        ? 'bg-brand-primary/15 text-brand-primary'
                        : inv.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {inv.status}
                  </span>
                </div>

                {/* Role */}
                <span
                  className={cn(
                    'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                    roleBadgeClass(inv.role)
                  )}
                >
                  {inv.role.replace(/-/g, ' ')}
                </span>

                {/* Invited by */}
                <p className="truncate text-xs text-muted-foreground">
                  {inv.invited_by_name ?? '—'}
                </p>

                {/* Expires */}
                <p className="text-xs text-muted-foreground">
                  {new Date(inv.expires_at).toLocaleDateString()}
                </p>

                {/* Copy token */}
                <div>
                  {inv.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy invite token"
                      onClick={() => handleCopyToken(inv.token)}
                    >
                      <Copy size={13} />
                    </Button>
                  )}
                </div>

                {/* Cancel */}
                <div className="flex justify-end">
                  {inv.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setConfirmCancel({ invitationId: inv.id, email: inv.email })
                      }
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
