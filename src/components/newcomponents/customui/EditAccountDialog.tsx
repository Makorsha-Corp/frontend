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
import { Loader2, Search, X } from 'lucide-react';

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
  const [tagSearch, setTagSearch] = useState('');

  const [updateAccount, { isLoading }] = useUpdateAccountMutation();
  const { data: tags = [] } = useGetTagsQuery();

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const visibleTags = React.useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    return tags
      .filter((t) => t.is_active !== false)
      .filter((t) => {
        if (!query) return true;
        return (
          t.name.toLowerCase().includes(query) ||
          t.tag_code.toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query)
        );
      });
  }, [tags, tagSearch]);

  const selectedTags = React.useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds]
  );

  const unselectedFilteredTags = React.useMemo(
    () => visibleTags.filter((t) => !selectedTagIds.includes(t.id)),
    [visibleTags, selectedTagIds]
  );

  const removeTag = (tagId: number) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAccountCode(account.account_code || '');
      setPrimaryContactPerson(account.primary_contact_person || '');
      setPrimaryEmail(account.primary_email || '');
      setPrimaryPhone(account.primary_phone || '');
      setAddress(account.address || '');
      setCity(account.city || '');
      setCountry(account.country || '');
      setPostalCode(account.postal_code || '');
      setPaymentPreferences(account.payment_preferences || '');
      setBankDetails(account.bank_details || '');
      setSelectedTagIds((account.account_tags || []).map((tag) => tag.id));
      setTagSearch('');
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
      setPrimaryContactPerson(account.primary_contact_person || '');
      setPrimaryEmail(account.primary_email || '');
      setPrimaryPhone(account.primary_phone || '');
      setAddress(account.address || '');
      setCity(account.city || '');
      setCountry(account.country || '');
      setPostalCode(account.postal_code || '');
      setPaymentPreferences(account.payment_preferences || '');
      setBankDetails(account.bank_details || '');
      setSelectedTagIds((account.account_tags || []).map((tag) => tag.id));
      setTagSearch('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(68rem,96vw)] max-w-none sm:max-w-none h-[66vh] max-h-[66vh] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-card-foreground">Edit Account</DialogTitle>
            <DialogDescription>Update account details.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto py-4 pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                <div className="grid gap-2 md:col-span-2">
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
                  <Label htmlFor="edit-primary-contact-person">Primary Contact Person</Label>
                  <Input
                    id="edit-primary-contact-person"
                    value={primaryContactPerson}
                    onChange={(e) => setPrimaryContactPerson(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-primary-email">Primary Email</Label>
                  <Input
                    id="edit-primary-email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-primary-phone">Primary Phone</Label>
                  <Input
                    id="edit-primary-phone"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input id="edit-country" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-postal-code">Postal Code</Label>
                  <Input id="edit-postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-payment-preferences">Payment Preferences</Label>
                  <Input id="edit-payment-preferences" value={paymentPreferences} onChange={(e) => setPaymentPreferences(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="edit-bank-details">Bank Details</Label>
                  <Input id="edit-bank-details" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} className="bg-background" />
                </div>
              </div>

              <div className="min-w-0 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <Label>Tags (Optional)</Label>
                  <div
                    className={`min-h-[2.5rem] rounded-md border border-dashed border-border bg-background px-2 py-2 ${
                      selectedTags.length ? 'flex flex-wrap gap-2' : 'flex items-center'
                    }`}
                  >
                    {selectedTags.length === 0 ? (
                      <span className="text-xs text-muted-foreground px-1">No tags selected</span>
                    ) : (
                      selectedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color || '#9067c6' }}
                          />
                          <span className="truncate">{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            aria-label={`Remove ${tag.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Search tags by name, code, or description..."
                      className="pl-9 h-9 bg-background"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-background">
                    {unselectedFilteredTags.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                        {tags.length > 0 && selectedTagIds.length === tags.length
                          ? 'All tags are selected'
                          : tagSearch.trim()
                            ? 'No tags match your search'
                            : 'No tags to show'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {unselectedFilteredTags.map((tag) => (
                          <li key={tag.id}>
                            <button
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                            >
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: tag.color || '#9067c6' }}
                              />
                              <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                              {tag.is_system_tag && (
                                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  System
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0">
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
