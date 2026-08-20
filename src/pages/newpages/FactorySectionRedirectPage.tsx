import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { buildMachinesSectionHref } from '@/lib/entityLinks';

/** Legacy bookmark shim: /factories/:id/sections/:sectionId → /machines */
const FactorySectionRedirectPage: React.FC = () => {
  const { sectionId } = useParams<{ id: string; sectionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const sectionIdNum = sectionId ? parseInt(sectionId, 10) : NaN;
    if (!Number.isFinite(sectionIdNum)) {
      navigate('/machines', { replace: true });
      return;
    }

    const machineIdParam = searchParams.get('machineId');
    const machineIdNum = machineIdParam ? parseInt(machineIdParam, 10) : NaN;
    const machineId = Number.isFinite(machineIdNum) ? machineIdNum : undefined;

    navigate(buildMachinesSectionHref(sectionIdNum, machineId), { replace: true });
  }, [sectionId, searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
};

export default FactorySectionRedirectPage;
