// src/pages/businesslens/BusinessLensWizard.tsx
import BusinessLensOrdersReport from "@/components/customui/BusinessLensReports/BusinessLensOrdersReport";
import BusinessLensPartReport from "@/components/customui/BusinessLensReports/BusinessLensPartReport";
import React from "react";
import { useParams, useSearchParams } from "react-router-dom";



const BusinessLensWizard: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [sp] = useSearchParams();

  switch (templateId) {
    case "parts": {
      const partId = sp.get("partId") ?? "";
      const start  = sp.get("start") ?? "";
      const end    = sp.get("end") ?? "";
      return <BusinessLensPartReport partId={partId} start={start} end={end} />;
    }
    case "orders": {
      const start  = sp.get("start") ?? "";
      const end    = sp.get("end") ?? "";
      return <BusinessLensOrdersReport start={start} end={end} />;
    }
    // TODO: add storage/orders/machine/project/factory components
    default:
      return <div className="p-6 text-sm text-muted-foreground">Unknown or unsupported template.</div>;
  }
};

export default BusinessLensWizard;
