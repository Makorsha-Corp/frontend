import React, { useMemo } from 'react';
import { CalendarClock, Clock, DollarSign, FolderKanban, Loader2 } from 'lucide-react';
import DashboardStatCard from '@/components/newcomponents/customui/dashboard/DashboardStatCard';
import type { Project } from '@/types/project';
import { PROJECT_STATUSES, formatCurrency, formatProjectStatus, getStatusBadge } from './projectsPageUtils';
import { cn } from '@/lib/utils';

const LIST_LIMIT = 10;

interface ProjectsOverviewPanelProps {
  projects: Project[];
  variant?: 'strip' | 'embedded';
  loading?: boolean;
  onProjectSelect?: (project: Project) => void;
  className?: string;
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPriorityLabel(priority: Project['priority'] | null | undefined): string {
  const value = (priority ?? 'MEDIUM').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function projectActivityTimestamp(project: Project): number {
  const raw = project.updated_at ?? project.created_at;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function formatDeadlineHint(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

interface ProjectOverviewRowProps {
  project: Project;
  onProjectSelect?: (project: Project) => void;
  emphasis?: 'deadline' | 'activity';
}

const ProjectOverviewRow: React.FC<ProjectOverviewRowProps> = ({
  project,
  onProjectSelect,
  emphasis = 'activity',
}) => {
  const deadlineHint = formatDeadlineHint(project.deadline);
  const rowClass = cn(
    'flex w-full flex-col gap-2 py-3 text-left transition-colors',
    onProjectSelect &&
      'cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-card-foreground">{project.name}</p>
          {project.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            'shrink-0 rounded px-2 py-0.5 text-xs',
            getStatusBadge(project.status ?? 'PLANNING')
          )}
        >
          {formatProjectStatus(project.status)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {emphasis === 'deadline' && project.deadline ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
            {formatShortDate(project.deadline)}
            {deadlineHint ? ` · ${deadlineHint}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
            Updated {formatShortDate(project.updated_at ?? project.created_at)}
          </span>
        )}
        {project.budget != null && project.budget > 0 ? (
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            {formatCurrency(project.budget)}
          </span>
        ) : null}
        <span>{formatPriorityLabel(project.priority)} priority</span>
        {emphasis === 'activity' && project.deadline ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            Deadline {formatShortDate(project.deadline)}
          </span>
        ) : null}
      </div>
    </>
  );

  if (onProjectSelect) {
    return (
      <button type="button" className={rowClass} onClick={() => onProjectSelect(project)}>
        {content}
      </button>
    );
  }

  return <div className={rowClass}>{content}</div>;
};

const ProjectsOverviewPanel: React.FC<ProjectsOverviewPanelProps> = ({
  projects,
  variant = 'strip',
  loading = false,
  onProjectSelect,
  className,
}) => {
  const stats = useMemo(() => {
    const byStatus = PROJECT_STATUSES.map((status) => ({
      status,
      count: projects.filter((p) => (p.status ?? 'PLANNING') === status).length,
    }));
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const withBudget = projects.filter((p) => (p.budget ?? 0) > 0).length;
    return { byStatus, totalBudget, withBudget, total: projects.length };
  }, [projects]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return projects
      .filter((p) => {
        if (!p.deadline) return false;
        const d = new Date(p.deadline);
        return !Number.isNaN(d.getTime()) && d >= now;
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, LIST_LIMIT);
  }, [projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => projectActivityTimestamp(b) - projectActivityTimestamp(a))
      .slice(0, LIST_LIMIT);
  }, [projects]);

  const statusSummary = stats.byStatus
    .filter(({ count }) => count > 0)
    .map(({ status, count }) => `${formatProjectStatus(status)}: ${count}`)
    .join(' · ');

  const kpiGridClass =
    variant === 'embedded'
      ? 'grid shrink-0 grid-cols-1 gap-5 md:grid-cols-3'
      : 'grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3';

  const kpiGrid = (
    <div className={kpiGridClass}>
      <DashboardStatCard
        variant="primary"
        title="Total projects"
        value={stats.total}
        icon={<FolderKanban size={24} />}
        footer={statusSummary || 'Across current filters'}
        isLoading={loading}
      />
      <DashboardStatCard
        variant="outlined"
        title="Combined budget"
        value={stats.totalBudget > 0 ? formatCurrency(stats.totalBudget) : '—'}
        icon={<DollarSign size={24} />}
        footer={
          stats.withBudget > 0
            ? `${stats.withBudget} project${stats.withBudget === 1 ? '' : 's'} with budget set`
            : 'No budgets set'
        }
        isLoading={loading}
      />
      <DashboardStatCard
        variant="accent"
        title="By status"
        value={stats.byStatus.find((s) => s.status === 'IN_PROGRESS')?.count ?? 0}
        icon={<Clock size={24} />}
        footer={`${stats.byStatus.find((s) => s.status === 'PLANNING')?.count ?? 0} in planning`}
        isLoading={loading}
      />
    </div>
  );

  const listSections = (
    <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="flex min-h-[320px] flex-col rounded-lg border border-border bg-card shadow-sm">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <CalendarClock className="h-4 w-4 text-brand-primary" />
            Upcoming deadlines
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Soonest deadlines in the current filtered list</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {upcomingDeadlines.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No upcoming deadlines in the filtered list.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingDeadlines.map((project) => (
                <li key={project.id}>
                  <ProjectOverviewRow
                    project={project}
                    onProjectSelect={onProjectSelect}
                    emphasis="deadline"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex min-h-[320px] flex-col rounded-lg border border-border bg-card shadow-sm">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Clock className="h-4 w-4 text-brand-primary" />
            Recent projects
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Latest activity across the filtered list</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {recentProjects.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No projects in the filtered list.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <ProjectOverviewRow
                    project={project}
                    onProjectSelect={onProjectSelect}
                    emphasis="activity"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'strip') {
    return <div className={className}>{kpiGrid}</div>;
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {loading ? (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center py-16">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
          {kpiGrid}
          {listSections}
        </div>
      )}
    </div>
  );
};

export default ProjectsOverviewPanel;
