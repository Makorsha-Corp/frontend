import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGetWorkspacesQuery, useLogoutMutation, useValidateInvitationMutation } from '@/features/auth/authApi';
import { useCreateWorkspaceMutation, useAcceptInvitationMutation } from '@/features/workspaces/workspaceApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setWorkspace, logout } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appToast } from '@/lib/appToast';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogOut,
  Moon,
  Sun,
  Ticket,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/constants/brand';
import { LOGIN_LAVENDER_RADIAL } from '@/lib/loginLavenderGradient';
import type { WorkspaceListItem } from '@/types/workspace';

/** Convert a workspace name to a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CreateWorkspaceListTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Create new workspace"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-all',
        'border-border/80 bg-card/50 hover:border-brand-primary hover:bg-brand-primary/5',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Building2 className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-card-foreground">Create workspace</p>
          <p className="text-[11px] text-muted-foreground">Start a new organization</p>
        </div>
      </div>
    </button>
  );
}

function InviteTokenListTile({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Join workspace with invite token"
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-all',
        'border-border/80 bg-card/50 hover:border-brand-primary hover:bg-brand-primary/5',
        expanded && 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Ticket className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold text-card-foreground">Join with invite</p>
          <p className="text-[11px] text-muted-foreground">Paste your token</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </div>
    </button>
  );
}

const WorkspaceSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, workspace, user } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme, iconAnimating } = useTheme();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [ownerPosition, setOwnerPosition] = useState('');

  // Join-with-token state
  const [showJoinToken, setShowJoinToken] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [invitePreview, setInvitePreview] = useState<{
    workspace_id: number;
    workspace_name: string | null;
    role: string;
    email: string;
    expires_at: string;
    position: string | null;
  } | null>(null);
  const [invitePosition, setInvitePosition] = useState('');

  const { data: workspaces, isLoading: isLoadingWorkspaces } =
    useGetWorkspacesQuery(undefined, { skip: !token });
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const [validateInvitation, { isLoading: isValidating }] = useValidateInvitationMutation();
  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    if (workspace) {
      navigate('/dashboard');
    }
  }, [workspace, navigate]);

  // Auto-generate slug from name (unless user has manually edited it)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setNewWorkspaceSlug(toSlug(newWorkspaceName));
    }
  }, [newWorkspaceName, slugManuallyEdited]);

  const pageRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = pageRootRef.current;
    if (!root) return;
    const setOrigin = (clientX: number, clientY: number) => {
      const x = (clientX / Math.max(window.innerWidth, 1)) * 100;
      const y = (clientY / Math.max(window.innerHeight, 1)) * 100;
      root.style.setProperty('--login-grad-x', `${x}%`);
      root.style.setProperty('--login-grad-y', `${y}%`);
    };
    const onMouseMove = (e: MouseEvent) => setOrigin(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setOrigin(t.clientX, t.clientY);
    };
    setOrigin(window.innerWidth * 0.72, window.innerHeight * 0.65);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const [triggerLogout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await triggerLogout({}).unwrap();
    } catch {
      dispatch(logout());
    }
    appToast.success('Signed out');
    navigate('/login');
  };

  const enterWorkspace = (ws: WorkspaceListItem) => {
    dispatch(
      setWorkspace({
        id: ws.id,
        name: ws.name,
        role: ws.role,
        status: ws.subscription_status,
      })
    );
    appToast.success(`Switched to ${ws.name}`);
    navigate('/dashboard');
  };

  const handleWorkspaceSelect = () => {
    if (!selectedWorkspaceId) {
      appToast.error('Please select a workspace');
      return;
    }
    const selected = workspaces?.find((ws) => ws.id === selectedWorkspaceId);
    if (selected) enterWorkspace(selected);
  };

  const handleWorkspaceRowDoubleClick = (ws: WorkspaceListItem) => {
    setSelectedWorkspaceId(ws.id);
    enterWorkspace(ws);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      appToast.error('Workspace name is required');
      return;
    }
    if (!newWorkspaceSlug.trim()) {
      appToast.error('Workspace slug is required');
      return;
    }
    try {
      const result = await createWorkspace({
        name: newWorkspaceName.trim(),
        slug: newWorkspaceSlug.trim(),
        owner_position: ownerPosition.trim() || null,
      }).unwrap();
      dispatch(
        setWorkspace({
          id: result.id,
          name: result.name,
          role: 'owner',
          status: result.subscription_status ?? 'trial',
        })
      );
      appToast.success(`Workspace "${result.name}" created`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to create workspace';
      appToast.error(msg);
    }
  };

  const handleValidateToken = async () => {
    if (!inviteToken.trim()) {
      appToast.error('Please enter an invite token');
      return;
    }
    try {
      const result = await validateInvitation({ invitation_token: inviteToken.trim() }).unwrap();
      setInvitePreview(result.invitation);
      setInvitePosition('');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail ?? 'Invalid or expired invite token';
      appToast.error(msg);
      setInvitePreview(null);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitePreview) return;
    try {
      const resolvedPosition = invitePreview.position ?? (invitePosition.trim() || null);
      await acceptInvitation({
        workspaceId: invitePreview.workspace_id,
        data: { token: inviteToken.trim(), position: resolvedPosition },
      }).unwrap();
      appToast.success(`Joined ${invitePreview.workspace_name ?? 'workspace'} successfully`);
      // Auto-select the joined workspace and go to dashboard
      dispatch(
        setWorkspace({
          id: invitePreview.workspace_id,
          name: invitePreview.workspace_name ?? 'Workspace',
          role: invitePreview.role,
          status: 'trial',
        })
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to join workspace';
      appToast.error(msg);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const blurSwapTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] } as const;
  const createPanelMotion = {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: blurSwapTransition,
  } as const;
  const selectorPanelMotion = {
    initial: false,
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: blurSwapTransition,
  } as const;

  return (
    <div
      ref={pageRootRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-background transition-colors lg:flex-row"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: LOGIN_LAVENDER_RADIAL }}
        aria-hidden
      />
      {/* Side rail */}
      <aside
        className={cn(
          'relative z-[1] flex shrink-0 flex-col gap-4 border-b border-border/35 bg-background/20 px-4 py-3 backdrop-blur-3xl backdrop-saturate-150',
          'dark:border-border/50 dark:bg-background/5 dark:backdrop-saturate-100',
          'lg:w-[min(100%,15rem)] lg:min-h-screen lg:justify-between lg:gap-6 lg:border-b-0 lg:border-r lg:px-4 lg:py-6 xl:w-64'
        )}
      >
        <div className="flex w-full min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 ring-1 ring-brand-primary/25" aria-hidden>
              <span className="text-sm font-bold text-brand-primary">{BRAND_NAME.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{BRAND_NAME}</p>
              <p className="truncate text-xs text-muted-foreground">Choose workspace</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => toggleTheme(e)}
            className="h-9 w-9 shrink-0 rounded-full border-border bg-card"
            type="button"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className={cn('h-4 w-4', iconAnimating && 'theme-toggle-icon--animate')} />
            ) : (
              <Sun className={cn('h-4 w-4', iconAnimating && 'theme-toggle-icon--animate')} />
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-9 w-full gap-2 rounded-full border-border bg-card px-3 text-muted-foreground hover:text-foreground lg:justify-center"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Sign out</span>
        </Button>
      </aside>

      <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-8 sm:px-8 lg:justify-center lg:px-10 lg:py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground sm:text-base">
              Pick a workspace to open the dashboard, or create a new one.
            </p>
          </div>

          {isLoadingWorkspaces ? (
            <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-border/70">
              <CardContent className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary" />
                  <p className="text-muted-foreground">Loading your workspaces…</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              {!showCreateWorkspace ? (
                <motion.div key="workspace-selector" className="space-y-4" {...selectorPanelMotion}>
                  {/* Workspace list */}
                  {workspaces && (
                    <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-border/70">
                      <CardHeader className="border-b border-border/80 pb-4">
                        <CardTitle className="text-xl text-card-foreground">Your workspaces</CardTitle>
                        <CardDescription>
                          {workspaces.length > 0
                            ? `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} available`
                            : 'No workspaces yet'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        {workspaces.map((ws) => (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => setSelectedWorkspaceId(ws.id)}
                            onDoubleClick={() => handleWorkspaceRowDoubleClick(ws)}
                            className={cn(
                              'w-full rounded-2xl border-2 p-4 text-left transition-all',
                              'hover:border-brand-primary-hover hover:shadow-md',
                              selectedWorkspaceId === ws.id
                                ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20'
                                : 'border-border/80 bg-card'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-card-foreground">{ws.name}</h3>
                                  {ws.subscription_status && (
                                    <span
                                      className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                        ws.subscription_status === 'active'
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                          : ws.subscription_status === 'trial'
                                            ? 'bg-brand-primary/15 text-brand-primary'
                                            : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {ws.subscription_status === 'active'
                                        ? 'Active'
                                        : ws.subscription_status === 'trial'
                                          ? 'Trial'
                                          : ws.subscription_status}
                                    </span>
                                  )}
                                  {ws.is_owner && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <p className="mb-2 font-mono text-xs text-muted-foreground">{ws.slug}</p>
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  Role:{' '}
                                  <span className="capitalize text-foreground/80">{ws.role.replace(/-/g, ' ')}</span>
                                </p>
                              </div>
                              {selectedWorkspaceId === ws.id && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-primary-foreground">
                                  ✓
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <CreateWorkspaceListTile onClick={() => setShowCreateWorkspace(true)} />
                          <InviteTokenListTile
                            expanded={showJoinToken}
                            onClick={() => {
                              setShowJoinToken((v) => !v);
                              if (showJoinToken) {
                                setInvitePreview(null);
                                setInviteToken('');
                              }
                            }}
                          />
                        </div>
                        {showJoinToken && (
                          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 px-4 pb-4 pt-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="invite-token" className="text-xs text-muted-foreground">
                                Paste your invite token
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="invite-token"
                                  value={inviteToken}
                                  onChange={(e) => {
                                    setInviteToken(e.target.value);
                                    setInvitePreview(null);
                                  }}
                                  placeholder="e.g. abc123xyz..."
                                  className="h-9 font-mono text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 shrink-0"
                                  onClick={handleValidateToken}
                                  disabled={isValidating || !inviteToken.trim()}
                                >
                                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                                </Button>
                              </div>
                            </div>

                            {invitePreview && (
                              <div className="space-y-2 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3">
                                <p className="text-sm font-medium text-foreground">
                                  Invitation to{' '}
                                  <span className="text-brand-primary">
                                    {invitePreview.workspace_name ?? 'a workspace'}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Role:{' '}
                                  <span className="font-medium capitalize text-foreground/80">
                                    {invitePreview.role.replace(/-/g, ' ')}
                                  </span>
                                  {invitePreview.position && (
                                    <>
                                      {' · '}
                                      Position:{' '}
                                      <span className="font-medium text-foreground/80">{invitePreview.position}</span>
                                    </>
                                  )}
                                  {' · '}
                                  Expires:{' '}
                                  {new Date(invitePreview.expires_at).toLocaleDateString()}
                                </p>
                                {!invitePreview.position && (
                                  <div className="space-y-1">
                                    <Label htmlFor="invite-position" className="text-xs text-muted-foreground">
                                      Your position{' '}
                                      <span className="text-xs">(optional)</span>
                                    </Label>
                                    <Input
                                      id="invite-position"
                                      type="text"
                                      placeholder="e.g. Site Supervisor"
                                      value={invitePosition}
                                      onChange={(e) => setInvitePosition(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  className="h-8 w-full bg-brand-primary text-xs hover:bg-brand-primary-hover"
                                  onClick={handleAcceptInvitation}
                                  disabled={isAccepting}
                                >
                                  {isAccepting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    `Join ${invitePreview.workspace_name ?? 'workspace'}`
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        {workspaces.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground">
                            Create a workspace or join with an invite token.
                          </p>
                        ) : null}
                      </CardContent>
                      <CardFooter className="border-t border-border/80 pt-4">
                        <Button
                          className="h-11 w-full text-base font-semibold bg-brand-primary hover:bg-brand-primary-hover"
                          onClick={handleWorkspaceSelect}
                          disabled={!selectedWorkspaceId}
                        >
                          {selectedWorkspaceId
                            ? `Continue to ${workspaces.find((w) => w.id === selectedWorkspaceId)?.name}`
                            : 'Select a workspace to continue'}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <motion.div key="create-workspace" {...createPanelMotion}>
                  <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-border/70">
                    <CardHeader className="border-b border-border/80 pb-4">
                      <CardTitle className="text-lg text-card-foreground">Create new workspace</CardTitle>
                      <CardDescription>Start a new workspace for your organization</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleCreateWorkspace}>
                      <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-workspace-name">Workspace name</Label>
                          <Input
                            id="new-workspace-name"
                            type="text"
                            placeholder="Acme Corp"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            required
                            className="h-11"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-workspace-slug">
                            Slug{' '}
                            <span className="text-xs font-normal text-muted-foreground">(URL-friendly identifier)</span>
                          </Label>
                          <Input
                            id="new-workspace-slug"
                            type="text"
                            placeholder="acme-corp"
                            value={newWorkspaceSlug}
                            onChange={(e) => {
                              setSlugManuallyEdited(true);
                              setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                            }}
                            required
                            className="h-11 font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="owner-position">
                            Your position{' '}
                            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                          </Label>
                          <Input
                            id="owner-position"
                            type="text"
                            placeholder="e.g. CEO, Operations Manager"
                            value={ownerPosition}
                            onChange={(e) => setOwnerPosition(e.target.value)}
                            className="h-11"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:flex-1"
                          onClick={() => {
                            setShowCreateWorkspace(false);
                            setNewWorkspaceName('');
                            setNewWorkspaceSlug('');
                            setSlugManuallyEdited(false);
                            setOwnerPosition('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="w-full bg-brand-primary hover:bg-brand-primary-hover sm:flex-1"
                          disabled={isCreating || !newWorkspaceName.trim() || !newWorkspaceSlug.trim()}
                        >
                          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create workspace'}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceSelectorPage;
