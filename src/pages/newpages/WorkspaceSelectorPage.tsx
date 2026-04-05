import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetWorkspacesQuery } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setWorkspace, logout } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Loader2, LogOut, Moon, MousePointer2, Sun, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const WorkspaceSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, workspace, user } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [gradientFollowsMouse, setGradientFollowsMouse] = useState(true);

  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login2');
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    if (workspace) {
      navigate('/dashboard');
    }
  }, [workspace, navigate]);

  const pageRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gradientFollowsMouse) return;

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
  }, [gradientFollowsMouse]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Signed out');
    navigate('/login2');
  };

  const handleWorkspaceSelect = () => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }

    const selected = workspaces?.find((ws) => ws.id === selectedWorkspaceId);
    if (selected) {
      dispatch(
        setWorkspace({
          id: selected.id,
          name: selected.name,
          role: selected.role,
          status: selected.subscription_status,
        })
      );
      toast.success(`Switched to workspace: ${selected.name}`);
      navigate('/dashboard');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWorkspaceName) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      toast.error('Create workspace feature coming soon! Please contact admin to create a workspace.');
      setNewWorkspaceName('');
      setShowCreateWorkspace(false);
    } catch (error: unknown) {
      toast.error('Failed to create workspace');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div
      ref={pageRootRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-background transition-colors lg:flex-row"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          !gradientFollowsMouse &&
            'bg-gradient-to-br from-background from-[8%] via-background via-[45%] to-brand-primary/[0.28] dark:from-background dark:via-background dark:via-[48%] dark:to-brand-primary/[0.28]'
        )}
        style={
          gradientFollowsMouse
            ? {
                background:
                  'radial-gradient(ellipse 320% 280% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(var(--primary) / 0.32) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)',
              }
            : undefined
        }
        aria-hidden
      />
      <Toaster position="top-right" />

      {/* Narrow rail: brand + account (option 2) */}
      <aside
        className={cn(
          'relative z-[1] flex shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-b border-border/35 bg-background/20 px-4 py-3 backdrop-blur-3xl backdrop-saturate-150',
          'dark:border-border/50 dark:bg-background/5 dark:backdrop-saturate-100',
          'lg:w-[min(100%,15rem)] lg:flex-col lg:items-stretch lg:justify-between lg:gap-6 lg:border-b-0 lg:border-r lg:px-4 lg:py-6 xl:w-64'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:flex-none">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 ring-1 ring-brand-primary/25"
            aria-hidden
          >
            <span className="text-sm font-bold text-brand-primary">M</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-brand-primary">Marker</p>
            <p className="truncate text-xs text-muted-foreground">Choose workspace</p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-1 sm:gap-2 lg:flex-col lg:items-stretch">
          <div className="flex justify-end gap-1 sm:gap-2 lg:justify-stretch">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGradientFollowsMouse((v) => !v)}
              className={cn(
                'h-9 w-9 shrink-0 rounded-full border-border bg-card',
                gradientFollowsMouse && 'ring-2 ring-brand-primary/35 ring-offset-2 ring-offset-background'
              )}
              title={
                gradientFollowsMouse
                  ? 'Use fixed background gradient (turn off cursor follow)'
                  : 'Make background gradient follow cursor'
              }
              type="button"
              aria-pressed={gradientFollowsMouse}
              aria-label={
                gradientFollowsMouse
                  ? 'Background gradient follows cursor; click for fixed gradient'
                  : 'Fixed background gradient; click to follow cursor'
              }
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 shrink-0 rounded-full border-border bg-card"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              type="button"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-full border-border bg-card px-3 text-muted-foreground hover:text-foreground lg:w-full lg:justify-center"
            type="button"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Sign out</span>
          </Button>
        </div>
      </aside>

      <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-8 sm:px-8 lg:justify-center lg:px-10 lg:py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground sm:text-base">
              Pick a workspace to open the dashboard, or create a new one when available.
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
            <div className="space-y-6">
              {workspaces && workspaces.length > 0 && (
                <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-border/70">
                  <CardHeader className="border-b border-border/80 pb-4">
                    <CardTitle className="text-xl text-card-foreground">Your workspaces</CardTitle>
                    <CardDescription>
                      {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} available to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => setSelectedWorkspaceId(ws.id)}
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
                              Role: <span className="capitalize text-foreground/80">{ws.role.replace(/-/g, ' ')}</span>
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
                  </CardContent>
                  <CardFooter className="flex flex-col border-t border-border/80 pt-4">
                    <Button
                      className="h-11 w-full text-base font-semibold bg-brand-secondary hover:bg-brand-secondary/90"
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

              {!showCreateWorkspace ? (
                <div className="text-center">
                  <Button
                    variant="outline"
                    className="border-2 border-dashed border-border bg-card/80 text-muted-foreground hover:border-brand-primary hover:bg-brand-primary/5 hover:text-foreground"
                    onClick={() => setShowCreateWorkspace(true)}
                  >
                    <span className="mr-2 text-lg leading-none">+</span>
                    Create new workspace
                  </Button>
                </div>
              ) : (
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
                          placeholder="My company name"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          required
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
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover sm:flex-1">
                        Create
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}

              {(!workspaces || workspaces.length === 0) && !isLoadingWorkspaces && (
                <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-2xl ring-1 ring-border/70">
                  <CardContent className="py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/12 text-brand-primary">
                      <Building2 className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-card-foreground">No workspaces yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      You don&apos;t have access to any workspace yet. Ask an admin for an invite, or create one when
                      that option is enabled.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceSelectorPage;
