import React, { useEffect, useMemo, useState } from 'react';
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
import { Search, Loader2, Save } from 'lucide-react';
import { useGetAccountsQuery, useUpdateAccountMutation } from '@/features/accounts/accountsApi';
import { useGetTagsQuery } from '@/features/accounts/accountTagsApi';
import type { UpdateAccountRequest } from '@/types/account';
import toast from 'react-hot-toast';

interface ManageAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageAccountsDialog: React.FC<ManageAccountsDialogProps> = ({ open, onOpenChange }) => {
  const [accountsSearch, setAccountsSearch] = useState('');
  const [tagsSearch, setTagsSearch] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [primaryContactPerson, setPrimaryContactPerson] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentPreferences, setPaymentPreferences] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useGetAccountsQuery({
    skip: 0,
    limit: 100,
    search: accountsSearch || undefined,
  });
  const { data: tags = [], isLoading: isLoadingTags } = useGetTagsQuery();
  const [updateAccount, { isLoading: isSaving }] = useUpdateAccountMutation();

  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const activeTags = useMemo(() => tags.filter((t) => t.is_active !== false), [tags]);

  const selectedTags = useMemo(
    () => activeTags.filter((t) => selectedTagIds.includes(t.id)),
    [activeTags, selectedTagIds]
  );

  const availableTags = useMemo(
    () =>
      activeTags.filter((t) => {
        if (selectedTagIds.includes(t.id)) return false;
        const q = tagsSearch.trim().toLowerCase();
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          t.tag_code.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
        );
      }),
    [activeTags, selectedTagIds, tagsSearch]
  );

  useEffect(() => {
    if (!open) return;
    if (selectedAccountId !== null) return;
    if (accounts.length === 0) return;
    setSelectedAccountId(accounts[0].id);
  }, [open, selectedAccountId, accounts]);

  useEffect(() => {
    if (!selectedAccount) {
      setName('');
      setAccountCode('');
      setPrimaryContactPerson('');
      setPrimaryEmail('');
      setPrimaryPhone('');
      setAddress('');
      setCity('');
      setCountry('');
      setPostalCode('');
      setPaymentPreferences('');
      setBankDetails('');
      setSelectedTagIds([]);
      return;
    }
    setName(selectedAccount.name || '');
    setAccountCode(selectedAccount.account_code || '');
    setPrimaryContactPerson(selectedAccount.primary_contact_person || '');
    setPrimaryEmail(selectedAccount.primary_email || '');
    setPrimaryPhone(selectedAccount.primary_phone || '');
    setAddress(selectedAccount.address || '');
    setCity(selectedAccount.city || '');
    setCountry(selectedAccount.country || '');
    setPostalCode(selectedAccount.postal_code || '');
    setPaymentPreferences(selectedAccount.payment_preferences || '');
    setBankDetails(selectedAccount.bank_details || '');
    setSelectedTagIds((selectedAccount.account_tags || []).map((t) => t.id));
    setTagsSearch('');
  }, [selectedAccount]);

  const addTag = (tagId: number) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  };

  const removeTag = (tagId: number) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }

    const payload: UpdateAccountRequest = {
      name: name.trim(),
      account_code: accountCode.trim() || null,
      primary_contact_person: primaryContactPerson.trim() || null,
      primary_email: primaryEmail.trim() || null,
      primary_phone: primaryPhone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      postal_code: postalCode.trim() || null,
      payment_preferences: paymentPreferences.trim() || null,
      bank_details: bankDetails.trim() || null,
      tag_ids: selectedTagIds,
    };

    try {
      await updateAccount({ id: selectedAccount.id, data: payload }).unwrap();
      toast.success('Account updated');
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to update account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(72rem,96vw)] max-w-none sm:max-w-none h-[66vh] max-h-[66vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Manage Accounts</DialogTitle>
          <DialogDescription>
            Search all accounts, update account details, and manage tags in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
          <div className="flex flex-col min-h-0 border border-border rounded-lg">
            <div className="p-3 border-b border-border shrink-0">
              <Label htmlFor="accounts-search" className="sr-only">
                Search accounts
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accounts-search"
                  value={accountsSearch}
                  onChange={(e) => setAccountsSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {isLoadingAccounts ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No accounts found.</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => {
                    const isSelected = acc.id === selectedAccountId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`w-full text-left p-2 rounded-md border transition-colors ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-transparent hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <p className="font-medium truncate">{acc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {acc.account_code || `#${acc.id}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(acc.account_tags || []).length === 0 ? (
                            <span className="text-[11px] text-muted-foreground">No tags</span>
                          ) : (
                            (acc.account_tags || []).map((tag) => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                                style={{
                                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                  color: tag.color || undefined,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col min-h-0 border border-border rounded-lg">
            {!selectedAccount ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                Select an account from the left to edit details and tags.
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="manage-account-name">Name *</Label>
                    <Input
                      id="manage-account-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-code">Account Code</Label>
                    <Input
                      id="manage-account-code"
                      value={accountCode}
                      onChange={(e) => setAccountCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-contact">Primary Contact Person</Label>
                    <Input
                      id="manage-account-contact"
                      value={primaryContactPerson}
                      onChange={(e) => setPrimaryContactPerson(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-email">Primary Email</Label>
                    <Input
                      id="manage-account-email"
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-phone">Primary Phone</Label>
                    <Input
                      id="manage-account-phone"
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-address">Address</Label>
                    <Input
                      id="manage-account-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-city">City</Label>
                    <Input
                      id="manage-account-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-country">Country</Label>
                    <Input
                      id="manage-account-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-postal-code">Postal Code</Label>
                    <Input
                      id="manage-account-postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-payment-preferences">Payment Preferences</Label>
                    <Input
                      id="manage-account-payment-preferences"
                      value={paymentPreferences}
                      onChange={(e) => setPaymentPreferences(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-account-bank-details">Bank Details</Label>
                    <Input
                      id="manage-account-bank-details"
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    {isLoadingTags ? (
                      <span className="text-xs text-muted-foreground">Loading tags...</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedTags.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No tags selected.</p>
                    ) : (
                      selectedTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-muted/50 text-sm"
                          title="Click to remove"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color || '#9067c6' }}
                          />
                          <span>{tag.name}</span>
                          <span className="text-muted-foreground">x</span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={tagsSearch}
                      onChange={(e) => setTagsSearch(e.target.value)}
                      placeholder="Search tags..."
                      className="pl-9"
                    />
                  </div>

                  <div className="border border-border rounded-md max-h-36 overflow-y-auto p-2 space-y-1">
                    {availableTags.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-1">
                        No matching tags to add.
                      </p>
                    ) : (
                      availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => addTag(tag.id)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 text-sm flex items-center gap-2"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color || '#9067c6' }}
                          />
                          <span className="truncate">{tag.name}</span>
                          <span className="text-xs text-muted-foreground truncate">({tag.tag_code})</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Close
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleSave}
            disabled={!selectedAccount || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAccountsDialog;
