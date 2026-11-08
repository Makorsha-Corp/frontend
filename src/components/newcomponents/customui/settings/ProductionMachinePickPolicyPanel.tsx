import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { appToast } from '@/lib/appToast';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { setWorkspace } from '@/features/auth/authSlice';
import { cn } from '@/lib/utils';
import { useUpdateWorkspaceMutation } from '@/features/workspaces/workspaceApi';
import {
  parseProductionMachinePickPolicy,
  type ProductionMachinePickPolicy,
} from '@/lib/productionMachinePickPolicy';

const OPTIONS: { value: ProductionMachinePickPolicy; title: string; description: string }[] = [
  {
    value: 'soft',
    title: 'Soft warnings (default)',
    description:
      'Always allow picks. Warn for off, maintenance, another in-progress step on the machine, or overlapping planned windows.',
  },
  {
    value: 'block_unavailable',
    title: 'Block unavailable',
    description:
      'Refuse off or maintenance. A second live step and plan overlap only warn.',
  },
  {
    value: 'block_overlap',
    title: 'Block live overlap',
    description:
      'Refuse off, maintenance, or a machine that already has another in-progress step. Planned window overlap still only warns.',
  },
];

const ProductionMachinePickPolicyPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.auth.workspace);
  const isOwner = workspace?.role === 'owner';
  const [policy, setPolicy] = useState<ProductionMachinePickPolicy>('soft');
  const [updateWorkspace, { isLoading: isSaving }] = useUpdateWorkspaceMutation();

  useEffect(() => {
    setPolicy(parseProductionMachinePickPolicy(workspace?.settings));
  }, [workspace?.settings]);

  const handleSave = async () => {
    if (!workspace?.id || !isOwner) return;
    try {
      const patch = { production_machine_pick_policy: policy };
      const updated = await updateWorkspace({
        id: workspace.id,
        data: { settings: patch },
      }).unwrap();
      dispatch(
        setWorkspace({
          ...workspace,
          settings: {
            ...(workspace.settings ?? {}),
            ...(updated.settings ?? patch),
          },
        }),
      );
      appToast.success('Production machine pick policy saved');
    } catch {
      appToast.error('Could not save policy');
    }
  };

  if (!workspace) {
    return <p className="text-sm text-muted-foreground">No workspace loaded.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3" role="radiogroup" aria-label="Production machine pick policy">
        {OPTIONS.map((opt) => {
          const selected = policy === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!isOwner}
              onClick={() => setPolicy(opt.value)}
              className={cn(
                'w-full rounded-md border border-border p-3 text-left transition-colors',
                selected && 'border-brand-primary/50 bg-brand-primary/[0.06] ring-1 ring-brand-primary/25',
                !isOwner && 'cursor-default opacity-90',
              )}
            >
              <p className="font-medium text-foreground">{opt.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {!isOwner ? (
        <p className="text-xs text-muted-foreground">Only the workspace owner can change this policy.</p>
      ) : (
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save policy'
          )}
        </Button>
      )}
    </div>
  );
};

export default ProductionMachinePickPolicyPanel;
