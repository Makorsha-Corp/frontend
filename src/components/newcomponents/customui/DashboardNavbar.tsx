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
  MousePointer2,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';
import FactorySelectorDialog from './FactorySelectorDialog';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const SIDEBAR_COLLAPSED_KEY = 'erp-sidebar-collapsed';
/** @deprecated Legacy single key; still read for migration. Prefer LIGHT/DARK keys. */
export const NAV_GRADIENT_PRESET_KEY = 'erp-navbar-gradient-preset';
export const NAV_GRADIENT_PRESET_KEY_LIGHT = 'erp-navbar-gradient-preset-light';
export const NAV_GRADIENT_PRESET_KEY_DARK = 'erp-navbar-gradient-preset-dark';
const NAV_GRADIENT_PRESET_SCHEMA_KEY = 'erp-navbar-gradient-schema';
/** `3` = current; `2` → run +8 for indices ≥3 (deep purple 3–10 inserted). Older → run legacy +1 then +8. */
const NAV_GRADIENT_PRESET_SCHEMA_VERSION = '3';
const FACTORIES_EXPANDED_SESSION_KEY = 'erp-navbar-factories-expanded';
const ORDERS_EXPANDED_SESSION_KEY = 'erp-navbar-orders-expanded';

/** Presets: follow = radial (cursor position via --nav-grad-x/y); fixed = linear. “No gradient” = flat `hsl(var(--secondary))` / `hsl(var(--nav-background))` (pre-frosted-wash sidebar). */
const NAV_GRADIENT_PRESETS = [
  {
    id: 'brand',
    label: 'Brand',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(var(--primary) / 0.5) 0%, hsl(var(--secondary)) 38%, hsl(250 27% 11%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(var(--primary) / 0.32) 0%, hsl(var(--nav-background)) 46%, hsl(var(--nav-background)) 100%)`,
    },
    fixed: {
      light: `linear-gradient(168deg, hsl(250 27% 11%) 0%, hsl(var(--secondary)) 35%, hsl(252 28% 19%) 65%, hsl(266 48% 52% / 0.42) 100%)`,
      dark: `linear-gradient(to bottom right, hsl(var(--background)) 0%, hsl(var(--background)) 48%, hsl(var(--primary) / 0.28) 100%)`,
    },
  },
  {
    id: 'deep-purple',
    label: 'Deep purple',
    follow: {
      /* Rich violet, a bit lighter than near-black; modest L spread keeps it subtle */
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(268 50% 22%) 0%, hsl(262 46% 17%) 50%, hsl(256 44% 13%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(270 46% 20%) 0%, hsl(264 44% 15%) 50%, hsl(258 40% 11%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(172deg, hsl(256 46% 14%) 0%, hsl(262 48% 18%) 48%, hsl(268 46% 21%) 100%)`,
      dark: `linear-gradient(168deg, hsl(262 42% 12%) 0%, hsl(266 44% 16%) 50%, hsl(260 42% 10%) 100%)`,
    },
  },
  {
    id: 'deep-purple-2',
    label: 'Deep purple 2',
    follow: {
      /* Darker + lower chroma than Deep purple — dim, muted violet */
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(268 36% 16%) 0%, hsl(262 34% 10%) 50%, hsl(256 32% 6%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(270 34% 13%) 0%, hsl(264 32% 8%) 50%, hsl(258 30% 5%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(172deg, hsl(256 34% 7%) 0%, hsl(262 36% 12%) 48%, hsl(268 34% 15%) 100%)`,
      dark: `linear-gradient(168deg, hsl(262 32% 5.5%) 0%, hsl(266 34% 10%) 50%, hsl(260 32% 4%) 100%)`,
    },
  },
  {
    id: 'deep-purple-3',
    label: 'Deep purple 3 · Royal',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(272 52% 24%) 0%, hsl(266 48% 16%) 50%, hsl(260 46% 11%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(274 48% 19%) 0%, hsl(268 46% 12%) 50%, hsl(262 44% 7%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(168deg, hsl(260 50% 12%) 0%, hsl(268 52% 19%) 50%, hsl(274 48% 23%) 100%)`,
      dark: `linear-gradient(168deg, hsl(268 46% 8%) 0%, hsl(272 50% 13%) 50%, hsl(266 48% 6%) 100%)`,
    },
  },
  {
    id: 'deep-purple-4',
    label: 'Deep purple 4 · Periwinkle',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(258 48% 26%) 0%, hsl(252 44% 17%) 50%, hsl(248 42% 12%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(256 44% 20%) 0%, hsl(250 40% 13%) 50%, hsl(245 38% 8%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(165deg, hsl(248 44% 13%) 0%, hsl(256 48% 19%) 50%, hsl(262 46% 24%) 100%)`,
      dark: `linear-gradient(165deg, hsl(252 42% 9%) 0%, hsl(256 46% 14%) 50%, hsl(248 40% 6%) 100%)`,
    },
  },
  {
    id: 'deep-purple-5',
    label: 'Deep purple 5 · Mauve',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(286 42% 23%) 0%, hsl(280 40% 15%) 50%, hsl(275 38% 10%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(288 38% 18%) 0%, hsl(282 36% 11%) 50%, hsl(276 34% 7%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(170deg, hsl(278 40% 11%) 0%, hsl(284 42% 17%) 50%, hsl(290 40% 21%) 100%)`,
      dark: `linear-gradient(170deg, hsl(282 36% 7%) 0%, hsl(286 38% 12%) 50%, hsl(280 36% 5%) 100%)`,
    },
  },
  {
    id: 'deep-purple-6',
    label: 'Deep purple 6 · Indigo',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(252 50% 22%) 0%, hsl(248 46% 15%) 50%, hsl(244 44% 10%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(250 46% 17%) 0%, hsl(246 44% 11%) 50%, hsl(242 42% 6%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(168deg, hsl(244 46% 11%) 0%, hsl(250 50% 17%) 50%, hsl(254 48% 21%) 100%)`,
      dark: `linear-gradient(168deg, hsl(246 44% 7%) 0%, hsl(250 48% 12%) 50%, hsl(244 46% 5%) 100%)`,
    },
  },
  {
    id: 'deep-purple-7',
    label: 'Deep purple 7 · Lilac',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(268 44% 28%) 0%, hsl(264 42% 20%) 50%, hsl(260 40% 14%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(270 40% 22%) 0%, hsl(266 38% 15%) 50%, hsl(262 36% 10%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(172deg, hsl(262 42% 15%) 0%, hsl(268 44% 22%) 50%, hsl(272 42% 27%) 100%)`,
      dark: `linear-gradient(172deg, hsl(266 38% 10%) 0%, hsl(270 40% 16%) 50%, hsl(264 38% 8%) 100%)`,
    },
  },
  {
    id: 'deep-purple-8',
    label: 'Deep purple 8 · Blue violet',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(248 46% 24%) 0%, hsl(242 42% 16%) 50%, hsl(238 40% 11%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(246 42% 18%) 0%, hsl(240 38% 12%) 50%, hsl(235 36% 7%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(160deg, hsl(238 42% 12%) 0%, hsl(246 46% 18%) 50%, hsl(252 44% 22%) 100%)`,
      dark: `linear-gradient(160deg, hsl(240 40% 8%) 0%, hsl(244 44% 13%) 50%, hsl(238 38% 5%) 100%)`,
    },
  },
  {
    id: 'deep-purple-9',
    label: 'Deep purple 9 · Wine',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(292 40% 21%) 0%, hsl(286 38% 14%) 50%, hsl(280 36% 9%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(294 36% 16%) 0%, hsl(288 34% 10%) 50%, hsl(282 32% 6%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(175deg, hsl(284 38% 10%) 0%, hsl(290 40% 16%) 50%, hsl(296 38% 20%) 100%)`,
      dark: `linear-gradient(175deg, hsl(288 34% 6%) 0%, hsl(292 36% 11%) 50%, hsl(286 34% 4%) 100%)`,
    },
  },
  {
    id: 'deep-purple-10',
    label: 'Deep purple 10 · Dusty',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(265 32% 20%) 0%, hsl(262 30% 14%) 50%, hsl(258 28% 9%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(266 28% 15%) 0%, hsl(263 26% 10%) 50%, hsl(260 24% 6%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(168deg, hsl(260 30% 9%) 0%, hsl(264 32% 14%) 50%, hsl(268 30% 18%) 100%)`,
      dark: `linear-gradient(168deg, hsl(262 26% 6%) 0%, hsl(266 28% 10%) 50%, hsl(260 26% 4%) 100%)`,
    },
  },
  {
    id: 'twilight',
    label: 'Twilight',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(250 55% 50% / 0.58) 0%, hsl(232 48% 30% / 0.92) 46%, hsl(238 42% 17%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(248 50% 42% / 0.52) 0%, hsl(225 44% 20%) 48%, hsl(222 45% 11%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(145deg, hsl(235 50% 20%) 0%, hsl(255 44% 34%) 55%, hsl(240 46% 17%) 100%)`,
      dark: `linear-gradient(145deg, hsl(225 48% 12%) 0%, hsl(248 40% 22%) 55%, hsl(230 44% 9%) 100%)`,
    },
  },
  {
    id: 'plum',
    label: 'Plum',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(310 48% 44% / 0.68) 0%, hsl(292 42% 26% / 0.94) 45%, hsl(282 40% 15%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(305 48% 36% / 0.58) 0%, hsl(285 44% 19%) 46%, hsl(275 42% 11%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(180deg, hsl(290 44% 20%) 0%, hsl(305 40% 32%) 50%, hsl(280 46% 15%) 100%)`,
      dark: `linear-gradient(180deg, hsl(285 42% 12%) 0%, hsl(300 38% 20%) 50%, hsl(275 40% 9%) 100%)`,
    },
  },
  {
    id: 'noir',
    label: 'Noir',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(265 40% 38% / 0.35) 0%, hsl(220 28% 20%) 50%, hsl(220 24% 12%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(258 28% 28% / 0.32) 0%, hsl(222 26% 11%) 46%, hsl(220 24% 5%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(to bottom right, hsl(220 24% 15%) 0%, hsl(228 22% 22%) 58%, hsl(218 20% 11%) 100%)`,
      dark: `linear-gradient(155deg, hsl(222 26% 6%) 0%, hsl(220 22% 10%) 45%, hsl(218 28% 4%) 100%)`,
    },
  },
  {
    id: 'noir-light',
    label: 'Noir light',
    follow: {
      light: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(258 28% 28% / 0.32) 0%, hsl(222 26% 11%) 46%, hsl(220 24% 5%) 100%)`,
      dark: `radial-gradient(ellipse 320% 280% at var(--nav-grad-x, 78%) var(--nav-grad-y, 42%), hsl(258 28% 28% / 0.32) 0%, hsl(222 26% 11%) 46%, hsl(220 24% 5%) 100%)`,
    },
    fixed: {
      light: `linear-gradient(155deg, hsl(222 26% 6%) 0%, hsl(220 22% 10%) 45%, hsl(218 28% 4%) 100%)`,
      dark: `linear-gradient(155deg, hsl(222 26% 6%) 0%, hsl(220 22% 10%) 45%, hsl(218 28% 4%) 100%)`,
    },
  },
  {
    id: 'no-gradient',
    label: 'No gradient',
    follow: {
      light: `hsl(var(--secondary))`,
      dark: `hsl(var(--nav-background))`,
    },
    fixed: {
      light: `hsl(var(--secondary))`,
      dark: `hsl(var(--nav-background))`,
    },
  },
] as const;

const NAV_GRADIENT_PRESET_COUNT = NAV_GRADIENT_PRESETS.length;
const _noirIdx = NAV_GRADIENT_PRESETS.findIndex((p) => p.id === 'noir');
const NOIR_PRESET_INDEX = _noirIdx >= 0 ? _noirIdx : NAV_GRADIENT_PRESET_COUNT - 1;

function parseGradientPresetIndex(raw: string | null): number {
  const n = parseInt(raw ?? '0', 10);
  if (!Number.isFinite(n) || n < 0 || n >= NAV_GRADIENT_PRESET_COUNT) return 0;
  return n;
}

/** Legacy v2: indices ≥2 +1. v3: indices ≥3 +8 (deep purple 3–10 block). */
function migrateGradientPresetStorageIfNeeded(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(NAV_GRADIENT_PRESET_SCHEMA_KEY) === NAV_GRADIENT_PRESET_SCHEMA_VERSION) return;

  const ver = localStorage.getItem(NAV_GRADIENT_PRESET_SCHEMA_KEY);

  const bumpKeyV2 = (key: string) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 2) return;
    localStorage.setItem(key, String(n + 1));
  };

  const bumpKeyV3 = (key: string) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 3) return;
    localStorage.setItem(
      key,
      String(Math.min(n + 8, NAV_GRADIENT_PRESET_COUNT - 1))
    );
  };

  if (ver !== '2') {
    bumpKeyV2(NAV_GRADIENT_PRESET_KEY_LIGHT);
    bumpKeyV2(NAV_GRADIENT_PRESET_KEY_DARK);
    bumpKeyV2(NAV_GRADIENT_PRESET_KEY);
  }

  bumpKeyV3(NAV_GRADIENT_PRESET_KEY_LIGHT);
  bumpKeyV3(NAV_GRADIENT_PRESET_KEY_DARK);
  bumpKeyV3(NAV_GRADIENT_PRESET_KEY);

  localStorage.setItem(NAV_GRADIENT_PRESET_SCHEMA_KEY, NAV_GRADIENT_PRESET_SCHEMA_VERSION);
}

/** Per-theme preset: dark defaults to Noir; light defaults to Brand. Migrates legacy `erp-navbar-gradient-preset` when per-theme keys are absent. */
function loadGradientPresetForTheme(theme: 'light' | 'dark'): number {
  if (typeof localStorage === 'undefined') {
    return theme === 'dark' ? NOIR_PRESET_INDEX : 0;
  }
  migrateGradientPresetStorageIfNeeded();
  const lightRaw = localStorage.getItem(NAV_GRADIENT_PRESET_KEY_LIGHT);
  const darkRaw = localStorage.getItem(NAV_GRADIENT_PRESET_KEY_DARK);
  const legacyRaw = localStorage.getItem(NAV_GRADIENT_PRESET_KEY);

  if (theme === 'light') {
    if (lightRaw !== null) return parseGradientPresetIndex(lightRaw);
    if (legacyRaw !== null) return parseGradientPresetIndex(legacyRaw);
    return 0;
  }
  if (darkRaw !== null) return parseGradientPresetIndex(darkRaw);
  if (legacyRaw !== null) return parseGradientPresetIndex(legacyRaw);
  return NOIR_PRESET_INDEX;
}

function persistGradientPresetForTheme(theme: 'light' | 'dark', index: number): void {
  if (typeof localStorage === 'undefined') return;
  const key = theme === 'dark' ? NAV_GRADIENT_PRESET_KEY_DARK : NAV_GRADIENT_PRESET_KEY_LIGHT;
  localStorage.setItem(key, String(index));
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
  const { user, factory } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
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
  const [gradientFollowsMouse, setGradientFollowsMouse] = useState(() =>
    localStorage.getItem('erp-navbar-gradient-follow') !== 'false'
  );
  const [gradientPresetIndex, setGradientPresetIndex] = useState(() =>
    loadGradientPresetForTheme(theme)
  );

  useEffect(() => {
    setGradientPresetIndex(loadGradientPresetForTheme(theme));
  }, [theme]);

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

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    el.style.setProperty('--nav-grad-x', '78%');
    el.style.setProperty('--nav-grad-y', '42%');
  }, []);

  const persistGradientFollow = (v: boolean) => {
    setGradientFollowsMouse(v);
    localStorage.setItem('erp-navbar-gradient-follow', String(v));
  };

  const cycleGradientPreset = () => {
    setGradientPresetIndex((i) => {
      const next = (i + 1) % NAV_GRADIENT_PRESET_COUNT;
      persistGradientPresetForTheme(theme, next);
      return next;
    });
  };

  const selectGradientPreset = (index: number) => {
    const next =
      ((index % NAV_GRADIENT_PRESET_COUNT) + NAV_GRADIENT_PRESET_COUNT) %
      NAV_GRADIENT_PRESET_COUNT;
    setGradientPresetIndex(next);
    persistGradientPresetForTheme(theme, next);
  };

  const safePresetIndex =
    Number.isFinite(gradientPresetIndex) &&
      gradientPresetIndex >= 0 &&
      gradientPresetIndex < NAV_GRADIENT_PRESET_COUNT
      ? gradientPresetIndex
      : 0;
  const gradientPreset = NAV_GRADIENT_PRESETS[safePresetIndex];
  const isNoGradientNav = gradientPreset.id === 'no-gradient';
  const navInactiveClass = 'text-white/75 hover:bg-white/10 hover:text-white';

  useEffect(() => {
    if (!gradientFollowsMouse || isNoGradientNav) return;
    const el = sidebarRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100;
      const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100;
      el.style.setProperty('--nav-grad-x', `${x}%`);
      el.style.setProperty('--nav-grad-y', `${y}%`);
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, [gradientFollowsMouse, isNoGradientNav]);

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

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login2');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

  /** Navbar-only background (no page chrome). Cursor mode uses CSS vars on `sidebarRef`. */
  const navGradientLayerStyle = useMemo((): React.CSSProperties => {
    const preset = NAV_GRADIENT_PRESETS[safePresetIndex];
    const mode = gradientFollowsMouse ? 'follow' : 'fixed';
    const tone = theme === 'dark' ? 'dark' : 'light';
    return {
      background: preset[mode][tone],
    };
  }, [gradientFollowsMouse, theme, safePresetIndex]);

  return (
    <div
      ref={sidebarRef}
      className={`relative z-10 flex h-screen shrink-0 flex-col self-start overflow-visible border-r border-border/35 transition-all duration-300 dark:border-border/50 sticky top-0 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={navGradientLayerStyle} />
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 z-[1] pointer-events-none border-r border-transparent',
          isNoGradientNav
            ? 'bg-transparent'
            : 'bg-background/20 backdrop-blur-3xl backdrop-saturate-150 dark:bg-background/5 dark:backdrop-saturate-100'
        )}
      />
      {/* Curved border - follows button shape, only visible when button is shown */}
      <div
        className={`absolute left-full top-1/2 z-[5] w-24 h-32 border-r border-border/35 dark:border-border/50 origin-left pointer-events-none transition-all backface-hidden ${isHoveringEdge ? 'opacity-100 visible duration-200 ease-out' : `opacity-0 scale-0 duration-150 ease-in ${isButtonMounted ? '' : 'invisible'}`
          }`}
        style={{
          ...navGradientLayerStyle,
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
            ...navGradientLayerStyle,
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
                    : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-muted hover:text-white dark:hover:text-foreground'
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
                      <Link to={factory ? `/factories/${factory.id}` : '/factories'}>Factories</Link>
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
                          to={factory ? `/factories/${factory.id}` : '/factories'}
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
                          to="/items"
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive('/items')
                              ? 'bg-brand-primary text-white'
                              : navInactiveClass
                            }`}
                        >
                          <Package size={18} />
                          <span className="text-sm font-medium">Items</span>
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

          <div className="mb-2 flex flex-col gap-2">
            <div
              className={cn(
                'flex gap-2',
                isCollapsed ? 'flex-col' : 'flex-row'
              )}
            >
              <button
                type="button"
                onClick={() => persistGradientFollow(!gradientFollowsMouse)}
                className={cn(
                  'flex min-h-[2.5rem] flex-1 items-center gap-2 rounded-lg px-3 py-2 transition-all',
                  navInactiveClass,
                  isCollapsed ? 'w-full justify-center' : 'min-w-0 justify-center sm:justify-start',
                  gradientFollowsMouse && 'ring-2 ring-brand-primary/35 ring-offset-2 ring-offset-transparent'
                )}
                title={
                  gradientFollowsMouse
                    ? 'Navbar gradient follows pointer inside sidebar; click for fixed gradient'
                    : 'Fixed navbar gradient; click to follow pointer'
                }
                aria-pressed={gradientFollowsMouse}
              >
                <MousePointer2 size={20} className="shrink-0" />
                {!isCollapsed && (
                  <span className="truncate text-left text-sm font-medium">
                    {gradientFollowsMouse ? 'Follow' : 'Fixed'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  'flex min-h-[2.5rem] flex-1 items-center gap-2 rounded-lg px-3 py-2 transition-all',
                  navInactiveClass,
                  isCollapsed ? 'w-full justify-center' : 'min-w-0 justify-center sm:justify-start'
                )}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
                {!isCollapsed && (
                  <span className="truncate text-left text-sm font-medium">
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </span>
                )}
              </button>
            </div>

            <HoverCard openDelay={140} closeDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  onClick={cycleGradientPreset}
                  aria-haspopup="dialog"
                  aria-label={`Navbar gradient: ${gradientPreset.label}. Click to cycle; hover for list.`}
                  title={`Click: next style (${safePresetIndex + 1}/${NAV_GRADIENT_PRESET_COUNT}). Hover: pick from list.`}
                  className={cn(
                    'flex min-h-[2.5rem] w-full items-center gap-2 rounded-lg px-3 py-2 transition-all',
                    navInactiveClass,
                    isCollapsed ? 'justify-center' : 'justify-center sm:justify-start',
                    safePresetIndex > 0 &&
                    'ring-2 ring-brand-primary/25 ring-offset-2 ring-offset-transparent'
                  )}
                >
                  <Palette size={20} className="shrink-0" aria-hidden />
                  {!isCollapsed && (
                    <span className="truncate text-left text-sm font-medium">{gradientPreset.label}</span>
                  )}
                </button>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent
                  align="start"
                  side="right"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[300] w-[min(18rem,calc(100vw-1.5rem))] border-border bg-popover p-0 text-popover-foreground shadow-xl"
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground">Navbar gradients</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      Click a row to apply. Button click still cycles.
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Current: <span className="text-foreground">{gradientPreset.label}</span>
                    </p>
                    <ul
                      className="mt-2 max-h-[min(18rem,50vh)] space-y-0.5 overflow-y-auto border-t border-border/60 pt-2"
                      role="listbox"
                      aria-label="Navbar gradient presets"
                    >
                      {NAV_GRADIENT_PRESETS.map((p, i) => (
                        <li key={p.id} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === safePresetIndex}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                              'hover:bg-accent hover:text-accent-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              i === safePresetIndex && 'bg-accent/80 font-medium text-foreground'
                            )}
                            onClick={() => selectGradientPreset(i)}
                          >
                            <span className="w-4 shrink-0 tabular-nums opacity-70">{i + 1}.</span>
                            <span className="min-w-0 flex-1 leading-snug">{p.label}</span>
                            {i === safePresetIndex ? (
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
