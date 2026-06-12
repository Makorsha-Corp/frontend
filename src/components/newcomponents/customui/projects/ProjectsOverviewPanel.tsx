import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Clock, DollarSign, FolderKanban, Loader2 } from 'lucide-react';
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
    'flex w-full flex-col gap-2.5 rounded-lg border border-border/80 bg-muted/20 p-4 text-left transition-colors',
    onProjectSelect &&
      'cursor-pointer hover:border-brand-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
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
          <>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
              {formatShortDate(project.deadline)}
              {deadlineHint ? ` · ${deadlineHint}` : ''}
            </span>
          </>
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

  const kpiGridClass =
    variant === 'embedded'
      ? 'grid shrink-0 grid-cols-1 gap-5 md:grid-cols-3'
      : 'grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3';

  const kpiGrid = (
    <div className={kpiGridClass}>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/25">
              <FolderKanban className="h-4 w-4 text-brand-primary" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total projects</p>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-card-foreground">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Combined budget</p>
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">
            {stats.totalBudget > 0 ? formatCurrency(stats.totalBudget) : '—'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.withBudget} project{stats.withBudget === 1 ? '' : 's'} with budget set
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">By status</p>
          <div className="space-y-2 text-sm">
            {stats.byStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between gap-2">
                <span className={cn('rounded px-2 py-0.5 text-xs', getStatusBadge(status))}>
                  {formatProjectStatus(status)}
                </span>
                <span className="font-medium tabular-nums text-card-foreground">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const listSections = (
    <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="flex min-h-[320px] flex-col border-border bg-card shadow-sm">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="h-4 w-4 text-brand-primary" />
            Upcoming deadlines
          </CardTitle>
          <p className="text-xs text-muted-foreground">Soonest deadlines in the current filtered list</p>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines in the filtered list.</p>
          ) : (
            <ul className="space-y-3">
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
        </CardContent>
      </Card>

      <Card className="flex min-h-[320px] flex-col border-border bg-card shadow-sm">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-brand-primary" />
            Recent projects
          </CardTitle>
          <p className="text-xs text-muted-foreground">Latest activity across the filtered list</p>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
          {recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects in the filtered list.</p>
          ) : (
            <ul className="space-y-3">
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
        </CardContent>
      </Card>
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
