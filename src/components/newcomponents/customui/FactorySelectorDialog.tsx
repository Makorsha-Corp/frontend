import React from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setFactory, clearFactory } from '@/features/auth/authSlice';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Factory } from '@/types/factory';

interface FactorySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FactorySelectorDialog: React.FC<FactorySelectorDialogProps> = ({ open, onOpenChange }) => {
  const dispatch = useAppDispatch();
  const { factory: selectedFactory } = useAppSelector((state) => state.auth);
  const { data: factories, isLoading } = useGetFactoriesQuery(
    { skip: 0, limit: 100 },
    { skip: !open }
  );

  const handleSelect = (factory: Factory) => {
    dispatch(setFactory(factory));
    onOpenChange(false);
  };

  const handleClear = () => {
    dispatch(clearFactory());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Factory</DialogTitle>
          <DialogDescription>
            Choose a factory to use as the default for Sections, Machines, Orders, and Projects. Items and Accounts are not tied to a factory.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : factories && factories.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {selectedFactory && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleClear}
                >
                  Clear selection (show all)
                </Button>
              )}
              {factories.map((factory) => (
                <Button
                  key={factory.id}
                  variant={selectedFactory?.id === factory.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleSelect(factory)}
                >
                  <span className="font-medium">{factory.name}</span>
                  <span className="ml-2 text-muted-foreground">({factory.abbreviation})</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No factories found. Create a factory first from the Factories page.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FactorySelectorDialog;
