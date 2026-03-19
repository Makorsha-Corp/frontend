import React from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

const TEMPLATE_LABELS: Record<string, string> = {
  storage: 'Storage',
  machine: 'Machine',
  project: 'Project',
  factory: 'Factory',
  unknown: 'Unknown',
};

type BusinessLensPlaceholderReportProps = {
  templateId: string;
  start?: string;
  end?: string;
};

const BusinessLensPlaceholderReport: React.FC<BusinessLensPlaceholderReportProps> = ({
  templateId,
  start,
  end,
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const label = TEMPLATE_LABELS[templateId] ?? templateId;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                BusinessLens — {label}
              </h1>
            </div>
            <Link to="/businesslens">
              <Button variant="outline" className="border-border">Back</Button>
            </Link>
          </div>
        </div>

        <div className="p-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Report placeholder</CardTitle>
              <p className="text-sm text-muted-foreground">
                This report template is not yet implemented. Use this space to design the report.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Template</p>
                  <p className="font-medium text-foreground">{label}</p>
                </div>
                {start && (
                  <div>
                    <p className="text-muted-foreground">Start date</p>
                    <p className="font-medium text-foreground">{start}</p>
                  </div>
                )}
                {end && (
                  <div>
                    <p className="text-muted-foreground">End date</p>
                    <p className="font-medium text-foreground">{end}</p>
                  </div>
                )}
              </div>
              <Link to="/businesslens">
                <Button variant="outline" className="border-border">Back to templates</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessLensPlaceholderReport;
