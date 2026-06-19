import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Users,
  ShoppingCart,
  Package,
  Archive,
  BookOpen,
  FolderKanban,
  FlaskConical,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Moon,
  Sun,
  BarChart3,
  Cog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useLogoutMutation } from '@/features/auth/authApi';
import { useTheme } from '@/context/ThemeContext';
import ThemeTransitionToggle from '@/components/newcomponents/customui/ThemeTransitionToggle';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FactorySelectorDialog from './FactorySelectorDialog';
import NotificationBell from '@/components/newcomponents/customui/notifications/NotificationBell';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const SIDEBAR_COLLAPSED_KEY = 'erp-sidebar-collapsed';
const FACTORIES_EXPANDED_SESSION_KEY = 'erp-navbar-factories-expanded';
const ORDERS_EXPANDED_SESSION_KEY = 'erp-navbar-orders-expanded';

function getNavBackground(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'hsl(var(--nav-background))' : 'hsl(var(--secondary))';
}

interface DashboardNavbarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const HOVER_ZONE_WIDTH = 56; // Wide enough to cover button + easy to trigger

const FACTORIES_SUB_PATHS = ['/factories', '/storage', '/project', '/production'];
const ORDERS_SUB_PATHS = ['/orders', '/orders/purchase', '/orders/transfer', '/orders/expense', '/orders/sales', '/orders/work'];

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onCollapsedChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, factory, workspace } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme, iconAnimating } = useTheme();
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [factoriesExpanded, setFactoriesExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(FACTORIES_EXPANDED_SESSION_KEY) === 'true';
  });
  const [ordersExpanded, setOrdersExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(ORDERS_EXPANDED_SESSION_KEY) === 'true';
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);
  const [isButtonMounted, setIsButtonMounted] = useState(false);

  // Delay visibility:hidden until after hide animation to avoid compositing artifacts
  useEffect(() => {
    if (isHoveringEdge) {
      setIsButtonMounted(true);
    } else {
      const t = setTimeout(() => setIsButtonMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [isHoveringEdge]);

  // Sync parent's content margin on mount (in case we're collapsed from localStorage)
  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only sync initial state on mount

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newCollapsed));
    onCollapsedChange?.(newCollapsed);
  };

  const navItems: NavItem[] = [
    { name: 'Accounts', icon: <Users size={20} />, path: '/accounts' },
    { name: 'BusinessLens', icon: <BarChart3 size={20} />, path: '/businesslens' },
    ...(workspace?.role === 'owner'
      ? [{ name: 'Management', icon: <Settings size={20} />, path: '/management' }]
      : []),
  ];

  const isOrdersActive = ORDERS_SUB_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(ORDERS_EXPANDED_SESSION_KEY, String(ordersExpanded));
  }, [ordersExpanded]);
  const handleOrdersOpenChange = (open: boolean) => {
    setOrdersExpanded(open);
  };

  const isFactoriesActive = FACTORIES_SUB_PATHS.some(
    (p) => location.pathname === p || (p !== '/dashboard' && location.pathname.startsWith(p + '/'))
  );
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(FACTORIES_EXPANDED_SESSION_KEY, String(factoriesExpanded));
  }, [factoriesExpanded]);

  const handleFactoriesOpenChange = (open: boolean) => {
    setFactoriesExpanded(open);
  };

  const [triggerLogout] = useLogoutMutation();

  const handleLogout = async () => {
    // useLogoutMutation revokes the refresh token on the server (best-effort)
    // AND clears local auth state via its queryFn. We still dispatch logout()
    // explicitly as a safety net in case the mutation throws before clearing.
    try {
      // queryFn signature requires an explicit arg even when we don't use it.
      await triggerLogout({}).unwrap();
    } catch {
      dispatch(logout());
    }
    toast.success('Logged out successfully');
    navigate('/login2');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

  const navInactiveClass = 'text-white/75 hover:bg-white/10 hover:text-white';

  const navBackgroundStyle = useMemo((): React.CSSProperties => {
    return { background: getNavBackground(theme) };
  }, [theme]);

  return (
    <div
      ref={sidebarRef}
      className={`relative z-10 flex h-screen shrink-0 flex-col self-start overflow-visible border-r border-border/35 transition-all duration-300 dark:border-border/50 sticky top-0 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={navBackgroundStyle} />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none border-r border-transparent bg-transparent"
      />
      {/* Curved border - follows button shape, only visible when button is shown */}
      <div
        className={`absolute left-full top-1/2 z-[5] w-24 h-32 border-r border-border/35 dark:border-border/50 origin-left pointer-events-none transition-all backface-hidden ${isHoveringEdge ? 'opacity-100 visible duration-200 ease-out' : `opacity-0 scale-0 duration-150 ease-in ${isButtonMounted ? '' : 'invisible'}`
          }`}
        style={{
          ...navBackgroundStyle,
          marginLeft: -1,
          WebkitClipPath: 'ellipse(55% 50% at 0% 50%)',
          clipPath: 'ellipse(55% 50% at 0% 50%)',
          transform: `translateY(-50%) ${isHoveringEdge ? 'scale(0.7)' : 'scale(0)'}`,
        }}
        aria-hidden
      />
      {/* Hover zone - right edge, contains button so hover persists when clicking */}
      <div
        className="absolute top-0 bottom-0 z-20"
        style={{
          left: '100%',
          width: HOVER_ZONE_WIDTH,
          marginLeft: -12, // Overlap sidebar so easier to trigger
        }}
        onMouseEnter={() => setIsHoveringEdge(true)}
        onMouseLeave={() => setIsHoveringEdge(false)}
      >
        {/* Ripple shape = expand/collapse button (appears on hover), starts at navbar edge */}
        <button
          onClick={handleToggleCollapse}
          className={`absolute left-[12px] top-1/2 -translate-y-1/2 z-30 w-24 h-32 flex items-center justify-start pl-3 border-r border-border/35 dark:border-border/50 shadow-md origin-left cursor-pointer transition-all backface-hidden backdrop-blur-md bg-background/15 dark:bg-background/10 hover:bg-brand-primary/15 dark:hover:bg-brand-primary/25 ${isHoveringEdge
              ? 'opacity-100 scale-[0.7] pointer-events-auto visible duration-200 ease-out'
              : `opacity-0 scale-0 pointer-events-none duration-150 ease-in ${isButtonMounted ? '' : 'invisible'}`
            }`}
          style={{
            ...navBackgroundStyle,
            marginLeft: -1,
            WebkitClipPath: 'ellipse(55% 50% at 0% 50%)',
            clipPath: 'ellipse(55% 50% at 0% 50%)',
            filter: 'drop-shadow(0 0 1px hsl(var(--border)))',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="flex items-center justify-center text-white/90">
            {isCollapsed ? <ChevronRight size={26} /> : <ChevronLeft size={26} />}
          </span>
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-brand-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 bg-brand-primary rounded"></div>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold whitespace-nowrap text-white/90">Marker</h1>
              </div>
            )}
          </Link>
          <NotificationBell collapsed={isCollapsed} />
        </div>

        {/* Navigation Items - scrollable when content overflows */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/dashboard')
                    ? 'bg-brand-primary text-white'
                    : navInactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? 'Overview' : ''}
              >
                <LayoutDashboard size={20} />
                {!isCollapsed && <span className="font-medium">Overview</span>}
              </Link>
            </li>

            {/* Items independent section */}
            <li>
              <Link
                to="/items"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/items')
                    ? 'bg-brand-primary text-white'
                    : navInactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? 'Items' : ''}
              >
                <Package size={20} />
                {!isCollapsed && <span className="font-medium">Items</span>}
              </Link>
            </li>


            {/* Factories expandable section */}
            <li>
              {isCollapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className={`flex items-center justify-center w-full px-2 py-3 rounded-lg cursor-pointer ${isFactoriesActive
                          ? 'bg-brand-primary text-white'
                          : navInactiveClass
                        }`}
                      title={factory ? `Factory - ${factory.name}` : 'Factory'}
                    >
                      <Factory size={20} className="shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-56">
                    <DropdownMenuItem
                      onClick={() => setFactoryDialogOpen(true)}
                      className="cursor-pointer"
                    >
                      <ArrowLeftRight size={16} className="mr-2" />
                      Switch factory
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/factories">Factories</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/machines">Machines</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/storage">Storage</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/project">Project</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/production">Production</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/ledgers">Ledgers</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible open={factoriesExpanded} onOpenChange={handleFactoriesOpenChange}>
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all w-full ${isFactoriesActive
                        ? 'bg-brand-primary text-white'
                        : navInactiveClass
                      }`}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        title={factory ? `Factory - ${factory.name}` : 'Factory'}
                      >
                        <Factory size={20} className="shrink-0" />
                        <span className="font-medium flex-1 truncate">
                          {factory ? factory.abbreviation : 'Factory'}
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    {factoriesExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFactoryDialogOpen(true);
                        }}
                        title="Change factory"
                        className="p-1.5 rounded-md shrink-0 hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeftRight size={18} />
                      </button>
                    )}
                    <CollapsibleTrigger asChild>
                      <button className="shrink-0 p-1 text-white/80">
                        {factoriesExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-4 pl-4 border-l border-white/20 dark:border-border space-y-1">
                      <li>
                        <Link
                          to="/factories"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/factories')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Factory size={18} />
                          <span className="text-sm font-medium">Factories</span>
                        </Link>
                      </li>
                      
                      <li>
                        <Link
                          to="/machines"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/machines')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Cog size={18} />
                          <span className="text-sm font-medium">Machines</span>
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/storage"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/storage')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Archive size={18} />
                          <span className="text-sm font-medium">Storage</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/project"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/project')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <FolderKanban size={18} />
                          <span className="text-sm font-medium">Project</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/production"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/production')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <FlaskConical size={18} />
                          <span className="text-sm font-medium">Production</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/ledgers"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/ledgers')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <BookOpen size={18} />
                          <span className="text-sm font-medium">Ledgers</span>
                        </Link>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {/* Orders expandable section */}
            <li>
              {isCollapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className={`flex items-center justify-center w-full px-2 py-3 rounded-lg cursor-pointer ${isOrdersActive
                          ? 'bg-brand-primary text-white'
                          : navInactiveClass
                        }`}
                      title="Orders"
                    >
                      <ShoppingCart size={20} className="shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/orders">Overview</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/purchase">Purchase Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/transfer">Transfer Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/expense">Expense Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/sales">Sales Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/work">Work Orders</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible open={ordersExpanded} onOpenChange={handleOrdersOpenChange}>
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all w-full ${isOrdersActive
                        ? 'bg-brand-primary text-white'
                        : navInactiveClass
                      }`}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-3 flex-1 min-w-0 text-left" title="Orders">
                        <ShoppingCart size={20} className="shrink-0" />
                        <span className="font-medium flex-1 truncate">Orders</span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleTrigger asChild>
                      <button className="shrink-0 p-1 text-white/80">
                        {ordersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-4 pl-4 border-l border-white/20 dark:border-border space-y-1">
                      <li>
                        <Link
                          to="/orders"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders') && location.pathname === '/orders'
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Overview</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders/purchase"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders/purchase')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Purchase</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders/transfer"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders/transfer')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Transfer</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders/expense"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders/expense')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Expense</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders/sales"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders/sales')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Sales</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders/work"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/orders/work')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <span className="text-sm font-medium">Work Orders</span>
                        </Link>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)
                      ? 'bg-brand-primary text-white'
                      : navInactiveClass
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : ''}
                >
                  {item.icon}
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <FactorySelectorDialog open={factoryDialogOpen} onOpenChange={setFactoryDialogOpen} />

        {/* User Profile, Theme Toggle & Logout */}
        <div className="p-4 border-t border-border/30 dark:border-border">
          {/* User Profile Section */}
          {user && !isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85 truncate">{user.name}</p>
                <p className="text-xs text-white/55 truncate">{user.email}</p>
              </div>
            </div>
          )}
          {user && isCollapsed && (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center" title={user.name}>
                <User size={16} className="text-white" />
              </div>
            </div>
          )}

          <div className={cn('mb-2 flex items-center gap-1', isCollapsed && 'justify-center')}>
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              className={cn(
                'flex min-h-[2.5rem] items-center gap-2 rounded-lg px-3 py-2 transition-all',
                navInactiveClass,
                isCollapsed ? 'justify-center' : 'min-w-0 flex-1 justify-center sm:justify-start'
              )}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon
                  size={20}
                  className={cn('shrink-0', iconAnimating && 'theme-toggle-icon--animate')}
                />
              ) : (
                <Sun
                  size={20}
                  className={cn('shrink-0', iconAnimating && 'theme-toggle-icon--animate')}
                />
              )}
              {!isCollapsed && (
                <span className="truncate text-left text-sm font-medium">
                  {theme === 'light' ? 'Dark' : 'Light'}
                </span>
              )}
            </button>
            <ThemeTransitionToggle variant="sidebar" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-4 py-2 w-full rounded-lg transition-all hover:bg-red-500/10 hover:!text-red-300',
              navInactiveClass,
              isCollapsed ? 'justify-center' : ''
            )}
            title={isCollapsed ? 'Log out' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Log out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
