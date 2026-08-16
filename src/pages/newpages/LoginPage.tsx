import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import appToast, { APP_TOAST_DURATIONS, APP_TOAST_IDS } from '@/lib/appToast';
import { BarChart3, Loader2, Moon, Package, Sun, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { apiErrorDetail } from '@/utils/apiError';
import { BRAND_NAME } from '@/constants/brand';
import { LOGIN_LAVENDER_RADIAL } from '@/lib/loginLavenderGradient';
import {
  loginAsideWashClass,
} from '@/lib/loginPanelWash';

interface LoginPageChromeProps {
  theme: string;
  toggleTheme: () => void;
  compact?: boolean;
}

const LoginPageChrome: React.FC<LoginPageChromeProps> = ({
  theme,
  toggleTheme,
  compact = false,
}) => {
  const brandInitial = BRAND_NAME.charAt(0);

  return (
    <div
      className={cn(
        compact ? 'flex w-full min-w-0 items-center justify-between gap-2' : 'contents'
      )}
    >
      <Link
        to="/login"
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
          compact && 'shrink-0'
        )}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 ring-1 ring-brand-primary/25"
          aria-hidden
        >
          <span className="text-sm font-bold text-brand-primary">{brandInitial}</span>
        </div>
        <span
          className={cn(
            'truncate font-semibold tracking-tight text-foreground',
            compact ? 'text-base' : 'text-lg'
          )}
        >
          {BRAND_NAME}
        </span>
      </Link>
      <nav
        className={cn(
          'flex items-center gap-0.5 sm:gap-1',
          compact ? 'shrink-0 flex-nowrap justify-end' : 'flex-wrap justify-end sm:gap-2'
        )}
        aria-label="Marketing"
      >
        <a
          href="#highlights"
          className={cn(
            'rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            compact ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
          )}
        >
          Product
        </a>
        <a
          href="#about"
          className={cn(
            'rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            compact ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
          )}
        >
          About
        </a>
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
    </div>
  );
};

const loginHighlightCardClass =
  'rounded-xl border border-border/80 bg-card p-4 shadow-sm';
const loginHighlightIconWrapClass =
  'mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary';
const loginHighlightTitleClass = 'mb-1 font-semibold text-card-foreground';
const loginHighlightBodyClass = 'text-sm leading-snug text-muted-foreground';

const LoginMarketingSections: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-8 lg:space-y-10', className)}>
    <section id="about" className="space-y-4">
      <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Procurement, inventory, and production in one workspace.
      </h1>
      <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {BRAND_NAME} helps teams run orders, stock, projects, and accounts with clear roles and a single source of
        truth—built for mills and manufacturing operations like yours.
      </p>
    </section>

    <section id="highlights" className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">At a glance</h2>
      <ul className="flex flex-col gap-3">
        <li className={loginHighlightCardClass}>
          <div className={loginHighlightIconWrapClass}>
            <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
          </div>
          <h3 className={loginHighlightTitleClass}>Operations &amp; inventory</h3>
          <p className={loginHighlightBodyClass}>
            Orders, storage, machines, and ledgers connected so you always know what moved where.
          </p>
        </li>
        <li className={loginHighlightCardClass}>
          <div className={loginHighlightIconWrapClass}>
            <Users className="h-4 w-4" strokeWidth={2} aria-hidden />
          </div>
          <h3 className={loginHighlightTitleClass}>Team &amp; workspaces</h3>
          <p className={loginHighlightBodyClass}>
            Multi-tenant workspaces with invitations and roles so finance, floor, and managers see what they need.
          </p>
        </li>
        <li className={loginHighlightCardClass}>
          <div className={loginHighlightIconWrapClass}>
            <BarChart3 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </div>
          <h3 className={loginHighlightTitleClass}>Visibility</h3>
          <p className={loginHighlightBodyClass}>
            Dashboards and structured data for decisions—without digging through spreadsheets.
          </p>
        </li>
      </ul>
    </section>
  </div>
);

const Login2Page: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, workspace } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const expiredToastShownRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('expired') !== '1') return;
    if (expiredToastShownRef.current) return;
    expiredToastShownRef.current = true;

    appToast.error('Your session expired. Please sign in again.', {
      id: APP_TOAST_IDS.sessionExpired,
      duration: APP_TOAST_DURATIONS.auth,
    });

    const next = new URLSearchParams(searchParams);
    next.delete('expired');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPosition, setRegisterPosition] = useState('User');

  const isLgScreen = useIsLgScreen();
  const loginTheme = theme === 'dark' ? 'dark' : 'light';

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (workspace) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/workspace-selector', { replace: true });
    }
  }, [isAuthenticated, workspace, navigate]);

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

  const performLogin = async (email: string, password: string) => {
    const response = await login({ email, password }).unwrap();

    dispatch(
      setCredentials({
        user: response.user,
        token: response.access_token,
        refreshToken: response.refresh_token,
      })
    );

    if (response.messages && response.messages.length > 0) {
      response.messages.forEach((msg: { type?: string; message?: string }) => {
        if (msg.type === 'success' && msg.message) {
          appToast.success(msg.message, {
            id: APP_TOAST_IDS.loginSuccess,
            duration: APP_TOAST_DURATIONS.auth,
          });
        }
      });
    } else {
      appToast.success('Login successful!', {
        id: APP_TOAST_IDS.loginSuccess,
        duration: APP_TOAST_DURATIONS.auth,
      });
    }

    navigate('/workspace-selector');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      appToast.error('Email and password are required');
      return;
    }

    try {
      await performLogin(loginEmail, loginPassword);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { data?: { detail?: string } };
      appToast.error(apiErrorDetail(err, 'Login failed. Please check your credentials.'));
    }
  };

  const handleDevQuickLogin = async () => {
    try {
      await performLogin('shohanc@hotmail.com', 'shohan123');
    } catch (error: unknown) {
      console.error('Dev login error:', error);
      const err = error as { data?: { detail?: string } };
      appToast.error(apiErrorDetail(err, 'Dev quick login failed.'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword) {
      appToast.error('All fields are required');
      return;
    }

    if (registerPassword.length < 8) {
      appToast.error('Password must be at least 8 characters');
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

      appToast.success('Account created! Now set up your workspace.');
      navigate('/workspace-selector');
    } catch (error) {
      console.error('Registration error:', error);
      appToast.error(apiErrorDetail(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <div
      ref={pageRootRef}
      className="relative flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto bg-background transition-colors lg:h-screen lg:min-h-screen lg:flex-row lg:overflow-y-hidden"
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: LOGIN_LAVENDER_RADIAL }}
        aria-hidden
      />
      <header className="sticky top-0 z-20 border-b border-border/70 bg-transparent px-5 py-3 sm:px-8 lg:hidden">
        <LoginPageChrome compact theme={theme} toggleTheme={toggleTheme} />
      </header>

      <aside className="relative z-[1] hidden min-h-0 flex-col border-b border-border/35 lg:order-1 lg:flex lg:min-h-full lg:w-[min(100%,26rem)] lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:border-r-border/20 xl:w-[30rem]">
        <div
          className={cn('pointer-events-none absolute inset-0', loginAsideWashClass(loginTheme))}
          aria-hidden
        />
        <header className="relative z-10 hidden flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-background px-5 py-4 sm:px-8 lg:flex">
          <LoginPageChrome theme={theme} toggleTheme={toggleTheme} />
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12">
          {isLgScreen ? <LoginMarketingSections /> : null}
        </div>
      </aside>

      <main className="relative z-[1] order-1 flex min-h-[calc(100dvh-3.75rem)] shrink-0 flex-col items-center justify-center bg-transparent px-4 py-4 sm:px-8 lg:order-2 lg:min-h-0 lg:flex-1 lg:shrink lg:px-10 lg:py-10 xl:px-16">
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
                    <Button type="submit" className="w-full h-11 text-base bg-brand-primary hover:bg-brand-primary-hover" disabled={isLoggingIn}>
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    {import.meta.env.DEV ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 text-base border-dashed"
                        disabled={isLoggingIn}
                        onClick={() => void handleDevQuickLogin()}
                      >
                        Dev: Quick sign in (Shohan)
                      </Button>
                    ) : null}
                    <p className="text-sm text-center text-card-foreground/60">
                      Don&apos;t have an account?{' '}
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
                    <Button type="submit" className="w-full h-11 text-base bg-brand-primary hover:bg-brand-primary-hover" disabled={isRegistering}>
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

      {!isLgScreen ? (
        <div className="relative z-[1] order-3 shrink-0 px-5 pb-10 pt-4 sm:px-8 lg:hidden">
          <LoginMarketingSections />
        </div>
      ) : null}
    </div>
  );
};

export default Login2Page;
