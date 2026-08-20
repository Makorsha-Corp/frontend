import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Factory,
  Users,
  ShoppingCart,
  Package,
  Archive,
  BookOpen,
  FolderKanban,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Moon,
  Sun,
  BarChart3,
  Cog,
  TrendingUp,
  CreditCard,
  Paperclip,
  LifeBuoy,
  Shield,
  Receipt,
  ClipboardList,
  Layers3,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/constants/brand';
import { useAppSelector } from '@/app/hooks';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import FactorySelectorDialog from './FactorySelectorDialog';
import GlobalFactoryHoverPicker from './GlobalFactoryHoverPicker';
import NavCollapsibleTriggerRow, {
  handleNavSectionRowClick,
} from './NavCollapsibleTriggerRow';
import NotificationBell from '@/components/newcomponents/customui/notifications/NotificationBell';
import UserAccountTrigger from '@/components/newcomponents/customui/UserAccountTrigger';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const SIDEBAR_COLLAPSED_KEY = 'erp-sidebar-collapsed';
const FACTORIES_EXPANDED_SESSION_KEY = 'erp-navbar-factories-expanded';
const FACTORIES_LAST_PATH_SESSION_KEY = 'erp-navbar-factories-last-path';
const ORDERS_EXPANDED_SESSION_KEY = 'erp-navbar-orders-expanded';
const SALES_EXPANDED_SESSION_KEY = 'erp-navbar-sales-expanded';
const NAV_SCROLL_SESSION_KEY = 'erp-navbar-scroll-top';

/** In-memory scroll survives route remounts within the same tab. */
let navScrollTopMemory = 0;

function readStoredNavScrollTop(): number {
  if (typeof sessionStorage === 'undefined') return navScrollTopMemory;
  const raw = sessionStorage.getItem(NAV_SCROLL_SESSION_KEY);
  if (raw == null) return navScrollTopMemory;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : navScrollTopMemory;
}

function persistNavScrollTop(value: number) {
  navScrollTopMemory = value;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(NAV_SCROLL_SESSION_KEY, String(value));
  }
}

function getNavBackground(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'hsl(var(--nav-background))' : 'hsl(var(--secondary))';
}

interface DashboardNavbarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const HOVER_ZONE_WIDTH = 56; // Wide enough for button + easy reach once expanded
const HOVER_EDGE_WIDTH = 8; // Narrow strip for hover detect — must not block main content clicks

const FACTORIES_SUB_PATHS = ['/factories', '/machines', '/storage', '/products', '/project', '/production', '/ledgers'];
const ORDERS_SUB_PATHS = ['/orders', '/orders/purchase', '/orders/transfer', '/orders/expense', '/orders/work'];
const SALES_SUB_PATHS = ['/sales', '/sales/overview', '/sales/team'];

function isFactoriesRoute(pathname: string): boolean {
  return FACTORIES_SUB_PATHS.some(
    (p) => pathname === p || (p !== '/dashboard' && pathname.startsWith(p + '/'))
  );
}

function useMobileNavViewport() {
  const [isMobileNav, setIsMobileNav] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobileNav(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobileNav;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onCollapsedChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, factory, workspace } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme, iconAnimating } = useTheme();
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [factoryCompactMenuOpen, setFactoryCompactMenuOpen] = useState(false);
  const [factoriesExpanded, setFactoriesExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(FACTORIES_EXPANDED_SESSION_KEY) === 'true';
  });
  const [ordersExpanded, setOrdersExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(ORDERS_EXPANDED_SESSION_KEY) === 'true';
  });
  const [salesExpanded, setSalesExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SALES_EXPANDED_SESSION_KEY) === 'true';
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);
  const [isButtonMounted, setIsButtonMounted] = useState(false);
  const isMobileNav = useMobileNavViewport();
  const isExpanded = !isCollapsed && !isMobileNav;
  const navInactiveClass = 'text-white/75 hover:bg-white/10 hover:text-white';
  const navIconProps = { size: 20 as const, className: 'shrink-0' };
  const topNavLinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 py-3 rounded-lg transition-all',
      isExpanded ? 'px-4' : 'justify-center px-2',
      active ? 'bg-brand-primary text-white' : navInactiveClass,
    );
  const compactSectionTriggerClass = (active: boolean) =>
    cn(
      'flex w-full cursor-pointer items-center justify-center px-2 py-3 rounded-lg',
      active ? 'bg-brand-primary text-white' : navInactiveClass,
    );

  // Sync parent's content margin on mount (in case we're collapsed from localStorage)
  useEffect(() => {
    onCollapsedChange?.(isMobileNav || isCollapsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only sync initial state on mount

  useEffect(() => {
    onCollapsedChange?.(isMobileNav || isCollapsed);
  }, [isMobileNav, isCollapsed, onCollapsedChange]);

  const handleToggleCollapse = () => {
    if (isMobileNav) return;
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newCollapsed));
    onCollapsedChange?.(newCollapsed);
  };

  // Delay visibility:hidden until after hide animation to avoid compositing artifacts
  useEffect(() => {
    if (isHoveringEdge) {
      setIsButtonMounted(true);
    } else {
      const t = setTimeout(() => setIsButtonMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [isHoveringEdge]);

  const navItems: NavItem[] = [
    { name: 'Help', icon: <LifeBuoy {...navIconProps} />, path: '/help' },
    { name: 'Accounts', icon: <Building2 {...navIconProps} />, path: '/accounts/overview' },
    { name: 'BusinessLens', icon: <BarChart3 {...navIconProps} />, path: '/businesslens' },
    ...(workspace?.role === 'owner'
      ? [
          { name: 'Management', icon: <Settings {...navIconProps} />, path: '/management' },
          { name: 'Billing', icon: <CreditCard {...navIconProps} />, path: '/billing/trial' },
          { name: 'Uploads', icon: <Paperclip {...navIconProps} />, path: '/uploads' },
        ]
      : []),
  ];

  const isPlatformActive =
    location.pathname === '/platform' || location.pathname.startsWith('/platform/');

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

  const isSalesActive = SALES_SUB_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(SALES_EXPANDED_SESSION_KEY, String(salesExpanded));
  }, [salesExpanded]);
  const handleSalesOpenChange = (open: boolean) => {
    setSalesExpanded(open);
  };

  const isFactoriesActive = FACTORIES_SUB_PATHS.some(
    (p) => location.pathname === p || (p !== '/dashboard' && location.pathname.startsWith(p + '/'))
  );
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(FACTORIES_EXPANDED_SESSION_KEY, String(factoriesExpanded));
  }, [factoriesExpanded]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (!isFactoriesRoute(location.pathname)) return;
    sessionStorage.setItem(
      FACTORIES_LAST_PATH_SESSION_KEY,
      `${location.pathname}${location.search}`
    );
  }, [location.pathname, location.search]);

  const handleFactoriesOpenChange = (open: boolean) => {
    setFactoriesExpanded(open);
  };

  useLayoutEffect(() => {
    const nav = navScrollRef.current;
    if (!nav) return;
    nav.scrollTop = readStoredNavScrollTop();
  }, []);

  useEffect(() => {
    const nav = navScrollRef.current;
    if (!nav) return;
    const onScroll = () => persistNavScrollTop(nav.scrollTop);
    nav.addEventListener('scroll', onScroll, { passive: true });
    return () => nav.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isExpanded) setFactoryCompactMenuOpen(false);
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded && factoryCompactMenuOpen && location.pathname !== '/factories') {
      setFactoryCompactMenuOpen(false);
    }
  }, [location.pathname, isExpanded, factoryCompactMenuOpen]);

  const handleFactoryHeaderClick = () => {
    handleNavSectionRowClick(isFactoriesActive, factoriesExpanded, setFactoriesExpanded, () => {
      navigate('/factories');
    });
  };

  const handleOrdersHeaderClick = () => {
    handleNavSectionRowClick(isOrdersActive, ordersExpanded, setOrdersExpanded, () => {
      navigate('/orders');
    });
  };

  const handleSalesHeaderClick = () => {
    handleNavSectionRowClick(isSalesActive, salesExpanded, setSalesExpanded, () => {
      navigate('/sales/overview');
    });
  };

  const handleFactoryCompactMenuOpenChange = (open: boolean) => {
    if (open && location.pathname !== '/factories') {
      return;
    }
    setFactoryCompactMenuOpen(open);
  };

  const handleCompactFactoryTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (location.pathname !== '/factories') {
      event.preventDefault();
    }
  };

  const handleCompactFactoryTriggerClick = () => {
    if (location.pathname !== '/factories') {
      navigate('/factories');
    }
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

  const navBackgroundStyle = useMemo((): React.CSSProperties => {
    return { background: getNavBackground(theme) };
  }, [theme]);

  return (
    <div
      ref={sidebarRef}
      className={`relative z-10 flex h-screen shrink-0 flex-col self-start overflow-visible border-r border-border/35 transition-all duration-300 dark:border-border/50 sticky top-0 ${isExpanded ? 'w-64' : 'w-20'
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
      {!isMobileNav ? (
        <>
          {/* Narrow edge — hover detect only; avoids blocking clicks in main content (e.g. detail Back). */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-auto"
            style={{
              left: '100%',
              width: HOVER_EDGE_WIDTH,
              marginLeft: -Math.floor(HOVER_EDGE_WIDTH / 2),
            }}
            onMouseEnter={() => setIsHoveringEdge(true)}
          />
          <div
            className={cn(
              'absolute top-0 bottom-0 z-20',
              isHoveringEdge ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            style={{
              left: '100%',
              width: HOVER_ZONE_WIDTH,
              marginLeft: -12,
            }}
            onMouseLeave={() => setIsHoveringEdge(false)}
          >
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
              title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="flex items-center justify-center text-white/90">
                {isExpanded ? <ChevronLeft size={26} /> : <ChevronRight size={26} />}
              </span>
            </button>
          </div>
        </>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Logo Section */}
        <div
          className={cn(
            'flex',
            isExpanded
              ? 'items-center justify-between p-6'
              : 'flex-col items-center gap-2 px-3 pt-4 pb-2'
          )}
        >
          <Link
            to="/dashboard"
            className={cn('flex items-center gap-3', !isExpanded && 'justify-center')}
          >
            <div className="w-10 h-10 bg-white dark:bg-brand-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 bg-brand-primary rounded"></div>
            </div>
            {isExpanded && (
              <div>
                <h1 className="text-xl font-bold whitespace-nowrap text-white/90">{BRAND_NAME}</h1>
              </div>
            )}
          </Link>
          <NotificationBell collapsed={!isExpanded} />
        </div>

        {/* Navigation Items - scrollable when content overflows */}
        <nav
          ref={navScrollRef}
          className="flex-1 min-h-0 overflow-y-auto py-6 px-3 [scrollbar-gutter:stable]"
        >
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard"
                className={topNavLinkClass(isActive('/dashboard'))}
                title={!isExpanded ? 'Overview' : ''}
              >
                <LayoutDashboard {...navIconProps} />
                {isExpanded && <span className="font-medium">Overview</span>}
              </Link>
            </li>

            <li>
              <Link
                to="/calendar"
                className={topNavLinkClass(isActive('/calendar'))}
                title={!isExpanded ? 'Calendar' : ''}
              >
                <CalendarDays {...navIconProps} />
                {isExpanded && <span className="font-medium">Calendar</span>}
              </Link>
            </li>

            {/* Items independent section */}
            <li>
              <Link
                to="/items"
                className={topNavLinkClass(isActive('/items'))}
                title={!isExpanded ? 'Items' : ''}
              >
                <Package {...navIconProps} />
                {isExpanded && <span className="font-medium">Items</span>}
              </Link>
            </li>


            {/* Factories expandable section */}
            <li>
              {!isExpanded ? (
                <DropdownMenu open={factoryCompactMenuOpen} onOpenChange={handleFactoryCompactMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={compactSectionTriggerClass(isFactoriesActive)}
                      title={factory ? `Factory - ${factory.name}` : 'Factory'}
                      onPointerDown={handleCompactFactoryTriggerPointerDown}
                      onClick={handleCompactFactoryTriggerClick}
                    >
                      <Factory {...navIconProps} />
                    </button>
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
                      <Link to="/factories">Overview</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/machines">Machines</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/storage">Storage</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/products">Products</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/production">Production</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/project">Project</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/ledgers">Ledgers</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible open={factoriesExpanded} onOpenChange={handleFactoriesOpenChange}>
                  <NavCollapsibleTriggerRow
                    expanded={factoriesExpanded}
                    isActive={isFactoriesActive}
                    title={factory ? `Factory - ${factory.name}` : 'Factory'}
                    label={factory ? factory.abbreviation : 'Factory'}
                    icon={<Factory {...navIconProps} />}
                    onToggle={handleFactoryHeaderClick}
                    inactiveClass={navInactiveClass}
                    trailing={<GlobalFactoryHoverPicker />}
                  />
                  <CollapsibleContent>
                    <ul className="mt-1 ml-4 pl-4 border-l border-white/20 dark:border-border space-y-1">
                      <li>
                        <Link
                          to="/factories"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${location.pathname === '/factories'
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <LayoutDashboard size={18} />
                          <span className="text-sm font-medium">Overview</span>
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
                          to="/products"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/products')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Package size={18} />
                          <span className="text-sm font-medium">Products</span>
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
              {!isExpanded ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={compactSectionTriggerClass(isOrdersActive)} title="Orders">
                      <Layers3 {...navIconProps} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2">
                        <LayoutDashboard size={16} />
                        Overview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/purchase" className="flex items-center gap-2">
                        <ShoppingCart size={16} />
                        Purchase Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/transfer" className="flex items-center gap-2">
                        <ArrowLeftRight size={16} />
                        Transfer Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders/expense" className="flex items-center gap-2">
                        <Receipt size={16} />
                        Expense Orders
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible open={ordersExpanded} onOpenChange={handleOrdersOpenChange}>
                  <NavCollapsibleTriggerRow
                    expanded={ordersExpanded}
                    isActive={isOrdersActive}
                    title="Orders"
                    label="Orders"
                    icon={<Layers3 {...navIconProps} />}
                    onToggle={handleOrdersHeaderClick}
                    inactiveClass={navInactiveClass}
                  />
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
                          <LayoutDashboard size={18} />
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
                          <ShoppingCart size={18} />
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
                          <ArrowLeftRight size={18} />
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
                          <Receipt size={18} />
                          <span className="text-sm font-medium">Expense</span>
                        </Link>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {/* Sales expandable section */}
            <li>
              {!isExpanded ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={compactSectionTriggerClass(isSalesActive)} title="Sales">
                      <TrendingUp {...navIconProps} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/sales/overview" className="flex items-center gap-2">
                        <ClipboardList size={16} />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/sales/team" className="flex items-center gap-2">
                        <Users size={16} />
                        Team
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Collapsible open={salesExpanded} onOpenChange={handleSalesOpenChange}>
                  <NavCollapsibleTriggerRow
                    expanded={salesExpanded}
                    isActive={isSalesActive}
                    title="Sales"
                    label="Sales"
                    icon={<TrendingUp {...navIconProps} />}
                    onToggle={handleSalesHeaderClick}
                    inactiveClass={navInactiveClass}
                  />
                  <CollapsibleContent>
                    <ul className="mt-1 ml-4 pl-4 border-l border-white/20 dark:border-border space-y-1">
                      <li>
                        <Link
                          to="/sales/overview"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/sales/overview')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <ClipboardList size={18} />
                          <span className="text-sm font-medium">Orders</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/sales/team"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/sales/team')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Users size={18} />
                          <span className="text-sm font-medium">Team</span>
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
                  className={topNavLinkClass(isActive(item.path))}
                  title={!isExpanded ? item.name : ''}
                >
                  {item.icon}
                  {isExpanded && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            ))}

            {user?.is_platform_admin ? (
              <li>
                <Link
                  to="/platform/support"
                  className={topNavLinkClass(isPlatformActive)}
                  title={!isExpanded ? 'Platform' : ''}
                >
                  <Shield {...navIconProps} />
                  {isExpanded && <span className="font-medium">Platform</span>}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <FactorySelectorDialog open={factoryDialogOpen} onOpenChange={setFactoryDialogOpen} />

        {/* User account + theme */}
        <div className="border-t border-border/30 p-4 dark:border-border">
          {user && (
            <UserAccountTrigger user={user} isExpanded={isExpanded} />
          )}

          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className={cn(
              'flex min-h-[2.5rem] w-full items-center gap-2 rounded-lg px-3 py-2 transition-all',
              navInactiveClass,
              !isExpanded ? 'justify-center' : 'justify-center sm:justify-start'
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
            {isExpanded && (
              <span className="truncate text-left text-sm font-medium">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
