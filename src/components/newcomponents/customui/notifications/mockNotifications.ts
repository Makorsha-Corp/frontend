import type { AppNotification } from './notificationTypes';

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-6',
    kind: 'low_stock',
    severity: 'urgent',
    title: 'Widget A below reorder point',
    body: 'On-hand 12 units · reorder at 25 · last movement 2 days ago.',
    href: '/storage',
    createdAt: hoursAgo(12),
    entityRef: 'Widget A',
  },
  {
    id: 'n-7',
    kind: 'project_update',
    severity: 'info',
    title: 'Project Alpha deadline in 3 days',
    body: '2 components still in planning · 1 task overdue.',
    href: '/project',
    createdAt: daysAgo(1),
    entityRef: 'Project Alpha',
  },
  {
    id: 'n-8',
    kind: 'maintenance',
    severity: 'action',
    title: 'CNC-01 maintenance due tomorrow',
    body: 'Scheduled service in Assembly · section Bay 2.',
    href: '/factories',
    createdAt: daysAgo(1),
    entityRef: 'CNC-01',
  },
  {
    id: 'n-10',
    kind: 'system',
    severity: 'info',
    title: 'New workspace member joined',
    body: 'Jordan Lee accepted the invitation and can now access this workspace.',
    href: '/management',
    createdAt: daysAgo(3),
  },
  {
    id: 'n-11',
    kind: 'low_stock',
    severity: 'info',
    title: 'Steel rod 12mm running low',
    body: 'On-hand 48 m · reorder at 50 m.',
    href: '/storage',
    createdAt: daysAgo(4),
  },
];
