import {
  Plus,
  Edit3,
  Check,
  Eye,
  UserPlus,
  UserMinus,
  Trash2,
  Layers,
  ListTodo,
  FileText,
  Package,
  PackagePlus,
  PackageMinus,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

export interface ProjectEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const PROJECT_EVENT_VISUALS: Record<string, ProjectEventVisual> = {
  created: { icon: Plus, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  updated: { icon: Edit3, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  status_updated: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  visibility_updated: { icon: Eye, wrap: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
  member_added: { icon: UserPlus, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  member_removed: { icon: UserMinus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  deleted: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  component_created: { icon: Layers, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  component_updated: { icon: Edit3, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  component_deleted: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  task_created: { icon: ListTodo, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  task_updated: { icon: Edit3, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  task_completed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  task_reopened: { icon: ListTodo, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  task_deleted: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  note_created: { icon: FileText, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  note_updated: { icon: Edit3, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  note_deleted: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  item_added: { icon: PackagePlus, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  item_updated: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  item_removed: { icon: PackageMinus, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  cost_added: { icon: DollarSign, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  cost_updated: { icon: DollarSign, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  cost_deleted: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  default: { icon: Edit3, wrap: 'bg-muted', color: 'text-muted-foreground' },
};
