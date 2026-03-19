import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Users,
  ShoppingCart,
  Package,
  Archive,
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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useTheme } from '@/context/ThemeContext';
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

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const SIDEBAR_COLLAPSED_KEY = 'erp-sidebar-collapsed';

interface DashboardNavbarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const HOVER_ZONE_WIDTH = 56; // Wide enough to cover button + easy to trigger

const FACTORIES_SUB_PATHS = ['/factories', '/items', '/storage', '/project', '/production'];
const ORDERS_SUB_PATHS = ['/orders', '/orders/purchase', '/orders/transfer', '/orders/expense', '/orders/sales', '/orders/work'];

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onCollapsedChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, factory } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [factoriesExpanded, setFactoriesExpanded] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);
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
    { name: 'Management', icon: <Settings size={20} />, path: '/management' },
  ];

  const isOrdersActive = ORDERS_SUB_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  const ordersUserCollapsedRef = useRef(false);
  useEffect(() => {
    if (isOrdersActive && !ordersUserCollapsedRef.current) {
      setOrdersExpanded(true);
    }
  }, [isOrdersActive]);
  useEffect(() => {
    if (!isOrdersActive) ordersUserCollapsedRef.current = false;
  }, [isOrdersActive]);
  const handleOrdersOpenChange = (open: boolean) => {
    if (!open) ordersUserCollapsedRef.current = true;
    setOrdersExpanded(open);
  };

  const isFactoriesActive = FACTORIES_SUB_PATHS.some(
    (p) => location.pathname === p || (p !== '/dashboard' && location.pathname.startsWith(p + '/'))
  );
  const userCollapsedRef = useRef(false);

  // Auto-expand when navigating TO a factories path, but respect manual collapse
  useEffect(() => {
    if (isFactoriesActive && !userCollapsedRef.current) {
      setFactoriesExpanded(true);
    }
  }, [isFactoriesActive]);

  // Reset "user collapsed" when navigating away from factories path
  useEffect(() => {
    if (!isFactoriesActive) userCollapsedRef.current = false;
  }, [isFactoriesActive]);

  const handleFactoriesOpenChange = (open: boolean) => {
    if (!open) userCollapsedRef.current = true;
    setFactoriesExpanded(open);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login2');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

  return (
    <div
      ref={sidebarRef}
      className={`h-screen bg-brand-secondary dark:bg-[hsl(var(--nav-background))] dark:border-r dark:border-border flex flex-col fixed left-0 top-0 transition-all duration-300 overflow-visible ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Curved border - follows button shape, only visible when button is shown */}
      <div
        className={`absolute left-full top-1/2 z-[5] w-24 h-32 bg-brand-secondary dark:bg-[hsl(var(--nav-background))] border-r border-border origin-left pointer-events-none transition-all backface-hidden ${
          isHoveringEdge ? 'opacity-100 visible duration-200 ease-out' : `opacity-0 scale-0 duration-150 ease-in ${isButtonMounted ? '' : 'invisible'}`
        }`}
        style={{
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
          className={`absolute left-[12px] top-1/2 -translate-y-1/2 z-30 w-24 h-32 flex items-center justify-start pl-3 bg-brand-secondary dark:bg-[hsl(var(--nav-background))] border-r border-border shadow-md origin-left cursor-pointer hover:bg-brand-primary/20 dark:hover:bg-brand-primary/20 transition-all backface-hidden ${
            isHoveringEdge
              ? 'opacity-100 scale-[0.7] pointer-events-auto visible duration-200 ease-out'
              : `opacity-0 scale-0 pointer-events-none duration-150 ease-in ${isButtonMounted ? '' : 'invisible'}`
          }`}
          style={{
            marginLeft: -1,
            WebkitClipPath: 'ellipse(55% 50% at 0% 50%)',
            clipPath: 'ellipse(55% 50% at 0% 50%)',
            filter: 'drop-shadow(0 0 1px hsl(var(--border)))',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-white dark:text-foreground flex items-center justify-center">
            {isCollapsed ? <ChevronRight size={26} /> : <ChevronLeft size={26} />}
          </span>
        </button>
      </div>

      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-brand-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <div className="w-6 h-6 bg-brand-primary rounded"></div>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white dark:text-foreground text-xl font-bold whitespace-nowrap">ERP Solution</h1>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Items - scrollable when content overflows */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-6 px-3">
        <ul className="space-y-1">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive('/dashboard')
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Overview' : ''}
            >
              <LayoutDashboard size={20} />
              {!isCollapsed && <span className="font-medium">Overview</span>}
            </Link>
          </li>

          {/* Factories expandable section */}
          <li>
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    className={`flex items-center justify-center w-full px-2 py-3 rounded-lg cursor-pointer ${
                      isFactoriesActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
                    <Link to={factory ? `/factories/${factory.id}` : '/factories'}>Factories</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/items">Items</Link>
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
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Collapsible open={factoriesExpanded} onOpenChange={handleFactoriesOpenChange}>
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all w-full ${
                    isFactoriesActive
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
                    <button className="shrink-0 p-1">
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
                        to={factory ? `/factories/${factory.id}` : '/factories'}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/factories')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <Factory size={18} />
                        <span className="text-sm font-medium">Factories</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/items"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/items')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <Package size={18} />
                        <span className="text-sm font-medium">Items</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/storage"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/storage')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <Archive size={18} />
                        <span className="text-sm font-medium">Storage</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/project"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/project')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <FolderKanban size={18} />
                        <span className="text-sm font-medium">Project</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/production"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/production')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <FlaskConical size={18} />
                        <span className="text-sm font-medium">Production</span>
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
                    className={`flex items-center justify-center w-full px-2 py-3 rounded-lg cursor-pointer ${
                      isOrdersActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all w-full ${
                    isOrdersActive
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                  }`}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 flex-1 min-w-0 text-left" title="Orders">
                      <ShoppingCart size={20} className="shrink-0" />
                      <span className="font-medium flex-1 truncate">Orders</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleTrigger asChild>
                    <button className="shrink-0 p-1">
                      {ordersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <ul className="mt-1 ml-4 pl-4 border-l border-white/20 dark:border-border space-y-1">
                    <li>
                      <Link
                        to="/orders"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders') && location.pathname === '/orders'
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">Overview</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders/purchase"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders/purchase')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">Purchase</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders/transfer"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders/transfer')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">Transfer</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders/expense"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders/expense')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">Expense</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders/sales"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders/sales')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">Sales</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders/work"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive('/orders/work')
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
      <div className="p-4 border-t border-white/10 dark:border-border">
        {/* User Profile Section */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-3 text-muted-foreground">
            <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white dark:text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-4 py-2 w-full rounded-lg text-muted-foreground hover:bg-brand-primary/10 hover:text-brand-primary transition-all mb-2 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? (theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode') : ''}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {!isCollapsed && (
            <span className="font-medium">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-2 w-full rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Log out' : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium">Log out</span>}
        </button>
      </div>
    </div>
  );
};

export default DashboardNavbar;
