import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Moon, Sun } from 'lucide-react';

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

  // RTK Query hooks
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  // Redirect if already authenticated and has workspace
  useEffect(() => {
    if (isAuthenticated && workspace) {
      navigate('/');
    }
  }, [isAuthenticated, workspace, navigate]);

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
    <div className="min-h-screen bg-background transition-colors">
      <Toaster position="top-right" />
      
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-10 h-10 bg-card hover:bg-accent"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      {/* Header Section */}
      <div className="pt-12 pb-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3 drop-shadow-sm">
            Welcome to <span className="text-brand-primary">ERP Solution</span>
          </h1>
          <p className="text-lg text-foreground/80 drop-shadow-sm">
            Your Complete Enterprise Resource Planning Tool
          </p>
        </div>
      </div>

      {/* Login/Register Card Section */}
      <div className="max-w-md mx-auto px-4 pb-12">
        <Card className="shadow-2xl border-border bg-card">
          {/* Toggle Switch */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-4 text-center font-semibold transition-all ${
                mode === 'login'
                  ? 'text-primary-foreground bg-brand-primary'
                  : 'text-card-foreground/60 hover:text-card-foreground hover:bg-accent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-4 text-center font-semibold transition-all ${
                mode === 'register'
                  ? 'text-primary-foreground bg-brand-primary'
                  : 'text-card-foreground/60 hover:text-card-foreground hover:bg-accent'
              }`}
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

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-brand-primary rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-primary-foreground mb-2">Complete Management</h3>
            <p className="text-sm text-primary-foreground/90">Manage orders, inventory, projects, and finances all in one place</p>
          </div>
          <div className="p-6 bg-brand-primary rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-primary-foreground mb-2">Team Collaboration</h3>
            <p className="text-sm text-primary-foreground/90">Work together with your team with role-based access control</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-semibold text-card-foreground mb-2">Real-time Insights</h3>
            <p className="text-sm text-card-foreground/60">Get instant reports and analytics to make informed decisions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login2Page;
