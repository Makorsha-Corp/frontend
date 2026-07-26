import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setFactory } from '@/features/auth/authSlice';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { Loader2 } from 'lucide-react';
import { API_LIMITS } from '@/constants/apiLimits';

const FactoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const factoryId = id ? parseInt(id, 10) : NaN;
  const { data: factories = [], isLoading } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  useEffect(() => {
    if (!Number.isFinite(factoryId)) {
      navigate('/factories', { replace: true });
      return;
    }
    if (isLoading) return;

    const factory = factories.find((item) => item.id === factoryId);
    if (factory) {
      dispatch(setFactory(factory));
    }
    navigate('/factories', { replace: true });
  }, [factoryId, factories, isLoading, dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
};

export default FactoryDetailPage;
