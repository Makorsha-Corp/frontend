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
import {
  PROJECT_EVENT_CATEGORY_STYLES,
  type ProjectEventVisualCategory,
} from './projectsPageUtils';

export interface ProjectEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

function visual(icon: LucideIcon, category: ProjectEventVisualCategory): ProjectEventVisual {
  const style = PROJECT_EVENT_CATEGORY_STYLES[category];
  return { icon, wrap: style.wrap, color: style.color };
}

export const PROJECT_EVENT_VISUALS: Record<string, ProjectEventVisual> = {
  created: visual(Plus, 'primary'),
  updated: visual(Edit3, 'neutral'),
  status_updated: visual(Check, 'success'),
  visibility_updated: visual(Eye, 'neutral'),
  member_added: visual(UserPlus, 'success'),
  member_removed: visual(UserMinus, 'neutral'),
  deleted: visual(Trash2, 'destructive'),
  component_created: visual(Layers, 'primary'),
  component_updated: visual(Edit3, 'neutral'),
  component_deleted: visual(Trash2, 'destructive'),
  task_created: visual(ListTodo, 'primary'),
  task_updated: visual(Edit3, 'neutral'),
  task_completed: visual(Check, 'success'),
  task_reopened: visual(ListTodo, 'warning'),
  task_deleted: visual(Trash2, 'destructive'),
  note_created: visual(FileText, 'primary'),
  note_updated: visual(Edit3, 'neutral'),
  note_deleted: visual(Trash2, 'destructive'),
  item_added: visual(PackagePlus, 'success'),
  item_updated: visual(Package, 'neutral'),
  item_removed: visual(PackageMinus, 'destructive'),
  cost_added: visual(DollarSign, 'success'),
  cost_updated: visual(DollarSign, 'neutral'),
  cost_deleted: visual(Trash2, 'destructive'),
  default: visual(Edit3, 'neutral'),
};
