import React, { useState } from 'react';
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
import { useCreateAccountMutation } from '@/features/accounts/accountsApi';
import { useGetTagsQuery } from '@/features/accounts/accountTagsApi';
import type { CreateAccountRequest } from '@/types/account';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTagCode?: string;  // Pre-select tag when adding from a tab (supplier, vendor, client, etc.)
}

const AddAccountDialog: React.FC<AddAccountDialogProps> = ({
  open,
  onOpenChange,
  defaultTagCode,
}) => {
  const [name, setName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');

  const [createAccount, { isLoading }] = useCreateAccountMutation();
  const { data: tags = [] } = useGetTagsQuery();

  const defaultTag = React.useMemo(
    () => tags.find((t) => t.tag_code === defaultTagCode),
    [tags, defaultTagCode]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }

    const payload: CreateAccountRequest = {
      name: name.trim(),
      account_code: accountCode.trim() || null,
      primary_email: primaryEmail.trim() || null,
      primary_phone: primaryPhone.trim() || null,
      primary_contact_person: primaryContact.trim() || null,
      tag_ids: defaultTag ? [defaultTag.id] : undefined,
    };

    try {
      await createAccount(payload).unwrap();
      toast.success('Account created successfully');
      setName('');
      setAccountCode('');
      setPrimaryEmail('');
      setPrimaryPhone('');
      setPrimaryContact('');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Failed to create account:', error);
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to create account');
    }
  };

  const handleCancel = () => {
    setName('');
    setAccountCode('');
    setPrimaryEmail('');
    setPrimaryPhone('');
    setPrimaryContact('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Add Account</DialogTitle>
            <DialogDescription>
              {defaultTag
                ? `Create a new ${defaultTag.name.toLowerCase()} account.`
                : 'Create a new account.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ABC Supplies Inc."
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-code">Account Code</Label>
              <Input
                id="account-code"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="e.g. ACC-001"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primary-contact">Primary Contact</Label>
              <Input
                id="primary-contact"
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
                placeholder="Contact person name"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primary-email">Email</Label>
              <Input
                id="primary-email"
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primary-phone">Phone</Label>
              <Input
                id="primary-phone"
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
                  Creating...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;
