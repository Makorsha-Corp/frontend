import React, { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';

import AppShellHeader, {
  appShellHeaderLeftGroupClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import AttachmentPanel from '@/components/newcomponents/customui/AttachmentPanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ATTACHMENT_ENTITY_TYPE_LABELS,
  type AttachmentEntityType,
} from '@/types/attachment';

const ENTITY_TYPE_OPTIONS = Object.entries(ATTACHMENT_ENTITY_TYPE_LABELS) as [
  AttachmentEntityType,
  string,
][];

const UploadsPage: React.FC = () => {
  const [entityType, setEntityType] = useState<AttachmentEntityType>('scratch');
  const [entityIdInput, setEntityIdInput] = useState('1');
  const [panelEnabled, setPanelEnabled] = useState(true);

  const entityId = useMemo(() => {
    const parsed = parseInt(entityIdInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [entityIdInput]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <Paperclip className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h1 className={appShellHeaderTitleClass}>Uploads</h1>
                <p className="text-xs text-muted-foreground">
                  Cloudinary signed-upload playground — owner test harness
                </p>
              </div>
            </div>
          </div>
        </AppShellHeader>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Target entity
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Entity type</Label>
                  <Select
                    value={entityType}
                    onValueChange={(value) => setEntityType(value as AttachmentEntityType)}
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPE_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity-id">Entity ID</Label>
                  <Input
                    id="entity-id"
                    inputMode="numeric"
                    value={entityIdInput}
                    onChange={(e) => setEntityIdInput(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Switch
                  id="panel-enabled"
                  checked={panelEnabled}
                  onCheckedChange={setPanelEnabled}
                />
                <Label htmlFor="panel-enabled" className="text-sm font-normal">
                  Load attachments (toggle off to test lazy skip)
                </Label>
              </div>
              {entityId === 0 ? (
                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                  Entity ID must be a positive number.
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Attachments
              </h2>
              <AttachmentPanel
                entityType={entityType}
                entityId={entityId}
                enabled={panelEnabled && entityId > 0}
              />
            </section>

            <section className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Before testing PDFs</p>
              <p className="mt-1">
                In Cloudinary → Settings → Security, enable &quot;Allow delivery of PDF and ZIP
                files&quot;. Set <code className="text-xs">CLOUDINARY_*</code> in backend{' '}
                <code className="text-xs">.env</code>, run migration{' '}
                <code className="text-xs">104_attachments_cloudinary</code>, then restart API.
              </p>
            </section>
          </div>
        </main>
      </div>
  );
};

export default UploadsPage;
