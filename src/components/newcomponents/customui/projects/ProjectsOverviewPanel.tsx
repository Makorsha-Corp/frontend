import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/types/project';
import { PROJECT_STATUSES, formatCurrency, formatProjectStatus, getStatusBadge } from './projectsPageUtils';
import { cn } from '@/lib/utils';

interface ProjectsOverviewPanelProps {
  projects: Project[];
}

const ProjectsOverviewPanel: React.FC<ProjectsOverviewPanelProps> = ({ projects }) => {
  const stats = useMemo(() => {
    const byStatus = PROJECT_STATUSES.map((status) => ({
      status,
      count: projects.filter((p) => (p.status ?? 'PLANNING') === status).length,
    }));
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const withDeadline = projects.filter((p) => p.deadline).length;
    return { byStatus, totalBudget, withDeadline, total: projects.length };
  }, [projects]);

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/25">
              <FolderKanban className="h-4 w-4 text-brand-primary" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total projects</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Combined budget</p>
          <p className="text-xl font-semibold tabular-nums text-card-foreground">
            {stats.totalBudget > 0 ? formatCurrency(stats.totalBudget) : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">From loaded project list</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">With deadline</p>
          <p className="text-2xl font-semibold tabular-nums text-card-foreground">{stats.withDeadline}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card shadow-sm md:col-span-2 xl:col-span-1">
        <CardContent className="p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">By status</p>
          <div className="space-y-1.5 text-sm">
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
};

export default ProjectsOverviewPanel;
