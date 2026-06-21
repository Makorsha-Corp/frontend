import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { BarChart3, Loader2, Moon, MousePointer2, Package, Palette, Sun, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginTheme = 'light' | 'dark';

/** Page-only gradient accents; light presets stay close to current look, dark variants are softer / alternate hues. */
const LOGIN_GRADIENT_PRESETS: {
  id: string;
  /** Short name in hover list */
  label: string;
  /** Longer description for screen readers */
  title: string;
  radial: (t: LoginTheme) => string;
  linear: (t: LoginTheme) => string;
}[] = [
    {
      id: 'lavender',
      label: 'Lavender (default)',
      title: 'Lavender — brand purple (default)',
      radial: (_t) =>
        'radial-gradient(ellipse 320% 280% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(var(--primary) / 0.32) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 48%, hsl(var(--primary) / 0.28) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 45%, hsl(var(--primary) / 0.28) 100%)',
    },
    {
      id: 'moonlight',
      label: 'Moonlight',
      title: 'Moonlight — cool blue-violet (calmer in dark)',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 340% 300% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(228 42% 58% / 0.2) 0%, hsl(var(--background)) 52%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 300% 260% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(230 45% 62% / 0.22) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 50%, hsl(228 40% 55% / 0.22) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(230 48% 58% / 0.2) 100%)',
    },
    {
      id: 'dusk',
      label: 'Dusk',
      title: 'Dusk — soft mauve / rose smoke',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 310% 275% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(292 32% 52% / 0.18) 0%, hsl(var(--background)) 50%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 300% 265% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(285 36% 58% / 0.18) 0%, hsl(var(--background)) 45%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 48%, hsl(292 30% 50% / 0.2) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(285 34% 55% / 0.16) 100%)',
    },
    {
      id: 'aurora',
      label: 'Aurora',
      title: 'Aurora — teal accent (low contrast wash)',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 350% 295% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(172 36% 42% / 0.14) 0%, hsl(var(--background)) 52%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 290% 255% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(175 38% 44% / 0.12) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 50%, hsl(172 34% 40% / 0.16) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(175 36% 42% / 0.14) 100%)',
    },
    {
      id: 'ember',
      label: 'Ember',
      title: 'Ember — warm amber / copper glow',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 318% 288% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(32 48% 52% / 0.16) 0%, hsl(var(--background)) 50%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 298% 262% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(28 52% 58% / 0.14) 0%, hsl(var(--background)) 45%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 48%, hsl(32 46% 50% / 0.18) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(28 50% 54% / 0.14) 100%)',
    },
    {
      id: 'forest',
      label: 'Forest',
      title: 'Forest — deep sage / emerald',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 328% 292% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(152 34% 40% / 0.15) 0%, hsl(var(--background)) 51%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 292% 258% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(155 36% 42% / 0.12) 0%, hsl(var(--background)) 45%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 49%, hsl(152 32% 38% / 0.17) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(155 34% 40% / 0.13) 100%)',
    },
    {
      id: 'slate',
      label: 'Slate',
      title: 'Slate — cool neutral graphite',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 335% 298% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(215 22% 48% / 0.14) 0%, hsl(var(--background)) 52%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 288% 252% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(218 24% 52% / 0.12) 0%, hsl(var(--background)) 46%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 50%, hsl(215 20% 46% / 0.16) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(218 22% 50% / 0.12) 100%)',
    },
    {
      id: 'sunset',
      label: 'Sunset',
      title: 'Sunset — soft coral / peach',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 322% 286% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(16 58% 56% / 0.15) 0%, hsl(var(--background)) 50%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 296% 260% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(18 62% 62% / 0.12) 0%, hsl(var(--background)) 45%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 48%, hsl(16 55% 54% / 0.17) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 44%, hsl(18 58% 58% / 0.13) 100%)',
    },
    {
      id: 'noir',
      label: 'Noir',
      title: 'Noir — minimal wash, almost monochrome',
      radial: (t) =>
        t === 'dark'
          ? 'radial-gradient(ellipse 380% 320% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(250 18% 38% / 0.1) 0%, hsl(var(--background)) 55%, hsl(var(--background)) 100%)'
          : 'radial-gradient(ellipse 310% 270% at var(--login-grad-x, 72%) var(--login-grad-y, 65%), hsl(260 15% 45% / 0.08) 0%, hsl(var(--background)) 48%, hsl(var(--background)) 100%)',
      linear: (t) =>
        t === 'dark'
          ? 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 52%, hsl(250 16% 36% / 0.12) 100%)'
          : 'linear-gradient(to bottom right, hsl(var(--background)) 8%, hsl(var(--background)) 46%, hsl(260 12% 42% / 0.09) 100%)',
    },
  ];

const Login2Page: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, workspace } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  // Refresh-token flow bails out here with ?expired=1 when /auth/refresh/
  // fails (refresh token revoked, expired, or reuse-detected). Show a single
  // toast and strip the query param so a hard reload doesn't re-show it.
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      toast.error('Your session expired. Please sign in again.');
      const next = new URLSearchParams(searchParams);
      next.delete('expired');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Toggle between login and register
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPosition, setRegisterPosition] = useState('User');

  /** false = static linear gradient (original); true = radial follows cursor */
  const [gradientFollowsMouse, setGradientFollowsMouse] = useState(true);

  /** LOGIN_GRADIENT_PRESETS index — click icon to cycle, hover for list to pick */
  const [gradientPresetIndex, setGradientPresetIndex] = useState(0);

  // RTK Query hooks
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  // Already signed in: skip login (avoid redirect loop with "/" → /login)
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

  const loginTheme: LoginTheme = theme === 'dark' ? 'dark' : 'light';
  const gradientPreset = LOGIN_GRADIENT_PRESETS[gradientPresetIndex] ?? LOGIN_GRADIENT_PRESETS[0];

  const gradientLayerStyle = useMemo(() => {
    const bg = gradientFollowsMouse
      ? gradientPreset.radial(loginTheme)
      : gradientPreset.linear(loginTheme);
    return { background: bg } as React.CSSProperties;
  }, [gradientFollowsMouse, gradientPreset, loginTheme]);

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

      // Save credentials to Redux (both tokens — refresh token enables
      // transparent re-auth from baseQueryWithReauth when access expires).
      dispatch(
        setCredentials({
          user: response.user,
          token: response.access_token,
          refreshToken: response.refresh_token,
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

    if (!registerName || !registerEmail || !registerPassword) {
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
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.access_token,
          refreshToken: response.refresh_token,
        })
      );

      toast.success('Account created! Now set up your workspace.');
      navigate('/workspace-selector');
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
      {/* Full-page wash: preset + mouse-follow radial vs static linear (header toggles). */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-500 ease-out"
        style={gradientLayerStyle}
        aria-hidden
      />
      <Toaster position="top-right" />

      <aside className="relative z-[1] flex min-h-0 flex-col overflow-hidden border-b border-border/35 bg-background/20 backdrop-blur-3xl backdrop-saturate-150 dark:border-border/50 dark:bg-background/5 dark:backdrop-saturate-100 lg:w-[min(100%,26rem)] xl:w-[30rem] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
        <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background px-5 py-4 sm:px-8">
          <Link
            to="/login"
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
            <HoverCard openDelay={140} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-9 w-9 shrink-0 rounded-full border-border bg-card',
                    gradientPresetIndex > 0 && 'ring-2 ring-brand-primary/25 ring-offset-2 ring-offset-background'
                  )}
                  title={`Click: next palette (${gradientPresetIndex + 1}/${LOGIN_GRADIENT_PRESETS.length}). Hover: pick from list.`}
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Background gradient: ${gradientPreset.title}. Click to cycle; hover to open palette list.`}
                  onClick={() =>
                    setGradientPresetIndex((i) => (i + 1) % LOGIN_GRADIENT_PRESETS.length)
                  }
                >
                  <Palette className="h-4 w-4" aria-hidden />
                </Button>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[300] w-[min(17rem,calc(100vw-1.5rem))] border-border bg-popover p-0 text-popover-foreground shadow-xl"
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground">Background palettes</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      Click a row to apply. Icon click still cycles.
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Current: <span className="text-foreground">{gradientPreset.label}</span>
                    </p>
                    <ul
                      className="mt-2 max-h-[min(18rem,50vh)] space-y-0.5 overflow-y-auto border-t border-border/60 pt-2"
                      role="listbox"
                      aria-label="Gradient palettes"
                    >
                      {LOGIN_GRADIENT_PRESETS.map((p, i) => (
                        <li key={p.id} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === gradientPresetIndex}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                              'hover:bg-accent hover:text-accent-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              i === gradientPresetIndex && 'bg-accent/80 font-medium text-foreground'
                            )}
                            onClick={() => setGradientPresetIndex(i)}
                          >
                            <span className="w-4 shrink-0 tabular-nums opacity-70">{i + 1}.</span>
                            <span className="min-w-0 flex-1">{p.label}</span>
                            {i === gradientPresetIndex ? (
                              <span className="shrink-0 text-brand-primary" aria-hidden>
                                ✓
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
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

        <div className="relative z-0 flex-1 space-y-10 overflow-y-auto px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12">
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
                <CardHeader className="space-y-1 px-8 pb-4 pt-6 sm:px-10">
                  <CardTitle className="text-2xl font-bold text-center text-card-foreground">Welcome Back</CardTitle>
                  <CardDescription className="text-center">
                    Sign in to access your workspace
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 px-8 pb-6 pt-0 sm:px-10">
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
                  <CardFooter className="flex flex-col space-y-4 px-8 pb-6 pt-0 sm:px-10">
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
                <CardHeader className="space-y-1 px-8 pb-4 pt-6 sm:px-10">
                  <CardTitle className="text-2xl font-bold text-center text-card-foreground">Create Account</CardTitle>
                  <CardDescription className="text-center">
                    Create your account, then set up or join a workspace
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4 px-8 pb-6 pt-0 sm:px-10">
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
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 px-8 pb-6 pt-0 sm:px-10">
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
