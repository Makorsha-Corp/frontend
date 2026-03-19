import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import BusinessLensItemsReport from '@/components/newcomponents/customui/BusinessLensReports/BusinessLensItemsReport';
import BusinessLensOrdersReport from '@/components/newcomponents/customui/BusinessLensReports/BusinessLensOrdersReport';
import BusinessLensPlaceholderReport from '@/components/newcomponents/customui/BusinessLensReports/BusinessLensPlaceholderReport';

const BusinessLensWizardPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('itemId') ?? '';
  const start = searchParams.get('start') ?? '';
  const end = searchParams.get('end') ?? '';

  switch (templateId) {
    case 'items':
      return <BusinessLensItemsReport itemId={itemId} start={start} end={end} />;
    case 'orders':
      return <BusinessLensOrdersReport start={start} end={end} />;
    case 'storage':
    case 'machine':
    case 'project':
    case 'factory':
      return <BusinessLensPlaceholderReport templateId={templateId} start={start} end={end} />;
    default:
      return <BusinessLensPlaceholderReport templateId="unknown" start="" end="" />;
  }
};

export default BusinessLensWizardPage;
