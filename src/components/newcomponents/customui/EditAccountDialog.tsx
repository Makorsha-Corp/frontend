import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAccountMutation } from '@/features/accounts/accountsApi';
import { useGetTagsQuery } from '@/features/accounts/accountTagsApi';
import type { Account, UpdateAccountRequest } from '@/types/account';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
  open,
  onOpenChange,
  account,
}) => {
  const [name, setName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');

  const [updateAccount, { isLoading }] = useUpdateAccountMutation();
  const { data: tags = [] } = useGetTagsQuery();

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAccountCode(account.account_code || '');
      setPrimaryEmail(account.primary_email || '');
      setPrimaryPhone(account.primary_phone || '');
      setPrimaryContact(account.primary_contact_person || '');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }

    const payload: UpdateAccountRequest = {
      name: name.trim(),
      account_code: accountCode.trim() || null,
      primary_email: primaryEmail.trim() || null,
      primary_phone: primaryPhone.trim() || null,
      primary_contact_person: primaryContact.trim() || null,
    };

    try {
      await updateAccount({ id: account.id, data: payload }).unwrap();
      toast.success('Account updated successfully');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Failed to update account:', error);
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to update account');
    }
  };

  const handleCancel = () => {
    if (account) {
      setName(account.name);
      setAccountCode(account.account_code || '');
      setPrimaryEmail(account.primary_email || '');
      setPrimaryPhone(account.primary_phone || '');
      setPrimaryContact(account.primary_contact_person || '');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Account</DialogTitle>
            <DialogDescription>Update account details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-account-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ABC Supplies Inc."
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-account-code">Account Code</Label>
              <Input
                id="edit-account-code"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="e.g. ACC-001"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-primary-contact">Primary Contact</Label>
              <Input
                id="edit-primary-contact"
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
                placeholder="Contact person name"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-primary-email">Email</Label>
              <Input
                id="edit-primary-email"
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-primary-phone">Phone</Label>
              <Input
                id="edit-primary-phone"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountDialog;
