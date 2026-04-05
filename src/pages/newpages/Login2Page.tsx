import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { BarChart3, Loader2, Moon, MousePointer2, Package, Sun, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Login2Page: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, workspace } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  // Toggle between login and register
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerWorkspaceName, setRegisterWorkspaceName] = useState('');
  const [registerPosition, setRegisterPosition] = useState('User');

  /** false = static linear gradient (original); true = radial follows cursor */
  const [gradientFollowsMouse, setGradientFollowsMouse] = useState(true);

  // RTK Query hooks
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  // Already signed in: skip login (avoid redirect loop with "/" → /login2)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (workspace) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/workspace-selector', { replace: true });
    }
  }, [isAuthenticated, workspace, navigate]);

  const pageRootRef = useRef<HTMLDivElement>(null);

  // Radial gradient spotlight follows pointer (CSS vars — no React re-renders per move).
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

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error('Email and password are required');
      return;
    }

    try {
      const response = await login({
        email: loginEmail,
        password: loginPassword,
      }).unwrap();

      // Save credentials to Redux
      dispatch(
        setCredentials({
          user: response.user,
          token: response.access_token,
        })
      );

      // Show success message
      if (response.messages && response.messages.length > 0) {
        response.messages.forEach((msg: any) => {
          if (msg.type === 'success') {
            toast.success(msg.message);
          }
        });
      } else {
        toast.success('Login successful!');
      }

      // Navigate to workspace selector
      navigate('/workspace-selector');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword || !registerWorkspaceName) {
      toast.error('All fields are required');
      return;
    }

    if (registerPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      const response = await register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        position: registerPosition,
        workspace_name: registerWorkspaceName,
      }).unwrap();

      // Save credentials to Redux
      dispatch(
        setCredentials({
          user: response.user,
          token: response.access_token,
          workspace: response.workspace,
        })
      );

      // Show success messages
      if (response.messages && response.messages.length > 0) {
        response.messages.forEach((msg: any) => {
          if (msg.type === 'success') {
            toast.success(msg.message);
          }
        });
      } else {
        toast.success('Registration successful!');
      }

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      ref={pageRootRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-background transition-colors lg:flex-row"
    >
      {/* Full-page wash: mouse-follow radial vs static linear (toggle in header). */}
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

      <aside className="relative z-[1] flex min-h-0 flex-col overflow-hidden border-b border-border/35 bg-background/20 backdrop-blur-3xl backdrop-saturate-150 dark:border-border/50 dark:bg-background/5 dark:backdrop-saturate-100 lg:w-[min(100%,26rem)] xl:w-[30rem] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background px-5 py-4 sm:px-8">
          <Link
            to="/login2"
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 ring-1 ring-brand-primary/25"
              aria-hidden
            >
              <span className="text-sm font-bold text-brand-primary">M</span>
            </div>
            <span className="truncate text-lg font-semibold tracking-tight">
              <span className="text-brand-primary">M</span>
              <span className="text-foreground">arker</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Marketing">
            <a
              href="#highlights"
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Product
            </a>
            <a
              href="#about"
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              About
            </a>
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
                gradientFollowsMouse ? 'Background gradient follows cursor; click for fixed gradient' : 'Fixed background gradient; click to follow cursor'
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
          </nav>
        </header>

        <div className="relative z-10 flex-1 space-y-10 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
          <section id="about" className="space-y-4">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Procurement, inventory, and production in one workspace.
            </h1>
            <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Marker helps teams run orders, stock, projects, and accounts with clear roles and a single source of
              truth—built for mills and manufacturing operations like yours.
            </p>
          </section>

          <section id="highlights" className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">At a glance</h2>
            <ul className="flex flex-col gap-4">
              <li className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                  <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mb-1.5 font-semibold text-card-foreground">Operations &amp; inventory</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Orders, storage, machines, and ledgers connected so you always know what moved where.
                </p>
              </li>
              <li className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                  <Users className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mb-1.5 font-semibold text-card-foreground">Team &amp; workspaces</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Multi-tenant workspaces with invitations and roles so finance, floor, and managers see what they need.
                </p>
              </li>
              <li className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                  <BarChart3 className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mb-1.5 font-semibold text-card-foreground">Visibility</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Dashboards and structured data for decisions—without digging through spreadsheets.
                </p>
              </li>
            </ul>
          </section>
        </div>
      </aside>

      <main className="relative z-[1] flex flex-1 flex-col items-center justify-center bg-transparent px-4 py-10 sm:px-8 lg:px-10 xl:px-16">
        <div className="w-full max-w-[420px]">
          <Card
            className={cn(
              'border-0 bg-card shadow-2xl ring-1 ring-border/70',
              'overflow-hidden rounded-3xl'
            )}
          >
          <div className="flex border-b border-border/80">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-4 text-center text-sm font-semibold transition-colors sm:text-base',
                mode === 'login'
                  ? 'bg-brand-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-4 text-center text-sm font-semibold transition-colors sm:text-base',
                mode === 'register'
                  ? 'bg-brand-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <>
              <CardHeader className="space-y-1 pb-4 pt-6">
                <CardTitle className="text-2xl font-bold text-center text-card-foreground">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Sign in to access your workspace
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full h-11 text-base bg-brand-secondary hover:bg-brand-secondary/90" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  <p className="text-sm text-center text-card-foreground/60">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-brand-primary hover:text-brand-primary-hover font-semibold"
                    >
                      Create one
                    </button>
                  </p>
                </CardFooter>
              </form>
            </>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <>
              <CardHeader className="space-y-1 pb-4 pt-6">
                <CardTitle className="text-2xl font-bold text-center text-card-foreground">Create Account</CardTitle>
                <CardDescription className="text-center">
                  Get started with your new workspace
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-position">Your Position</Label>
                    <Input
                      id="register-position"
                      type="text"
                      placeholder="e.g., CEO, Manager, Developer"
                      value={registerPosition}
                      onChange={(e) => setRegisterPosition(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-workspace">Company/Workspace Name</Label>
                    <Input
                      id="register-workspace"
                      type="text"
                      placeholder="Your Company Name"
                      value={registerWorkspaceName}
                      onChange={(e) => setRegisterWorkspaceName(e.target.value)}
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-card-foreground/60 flex items-start gap-1">
                      <span className="text-brand-primary font-semibold">✓</span>
                      Creates your own workspace with full admin access
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full h-11 text-base bg-brand-secondary hover:bg-brand-secondary/90" disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Your Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  <p className="text-xs text-center text-card-foreground/60">
                    By creating an account, you agree to our Terms of Service
                  </p>
                  <p className="text-sm text-center text-card-foreground/60">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-brand-primary hover:text-brand-primary-hover font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
        </div>
      </main>
    </div>
  );
};

export default Login2Page;
