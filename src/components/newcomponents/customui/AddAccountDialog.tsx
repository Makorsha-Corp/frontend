import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Loader2, Search, X } from 'lucide-react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTagCode?: string;  // Pre-select tag when adding from a tab (supplier, vendor, client, etc..)
}

const AddAccountDialog: React.FC<AddAccountDialogProps> = ({
  open,
  onOpenChange,
  defaultTagCode,
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

  const [createAccount, { isLoading }] = useCreateAccountMutation();
  const { data: tags = [] } = useGetTagsQuery();

  const defaultTag = React.useMemo(
    () => tags.find((t) => t.tag_code === defaultTagCode),
    [tags, defaultTagCode]
  );

  React.useEffect(() => {
    if (!open) return;
    if (!defaultTag) return;
    setSelectedTagIds((prev) => (prev.includes(defaultTag.id) ? prev : [defaultTag.id, ...prev]));
  }, [open, defaultTag]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }

    const payload: CreateAccountRequest = {
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
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };

    try {
      await createAccount(payload).unwrap();
      toast.success('Account created successfully');
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
      setSelectedTagIds(defaultTag ? [defaultTag.id] : []);
      setTagSearch('');
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
    setPrimaryContactPerson('');
    setPrimaryEmail('');
    setPrimaryPhone('');
    setAddress('');
    setCity('');
    setCountry('');
    setPostalCode('');
    setPaymentPreferences('');
    setBankDetails('');
    setSelectedTagIds(defaultTag ? [defaultTag.id] : []);
    setTagSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(68rem,96vw)] max-w-none sm:max-w-none h-[68vh] max-h-[68vh] flex flex-col overflow-hidden gap-0 pb-4 pt-6 px-6">
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <DialogHeader className="shrink-0 space-y-0 pb-4">
            <DialogTitle className="text-card-foreground text-xl font-semibold tracking-tight">
              Add Account
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pt-1 pb-2 px-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                <div className="grid gap-2 md:col-span-2">
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
                  <Label htmlFor="primary-contact-person">Primary Contact Person</Label>
                  <Input
                    id="primary-contact-person"
                    value={primaryContactPerson}
                    onChange={(e) => setPrimaryContactPerson(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="primary-email">Primary Email</Label>
                  <Input
                    id="primary-email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="primary-phone">Primary Phone</Label>
                  <Input id="primary-phone" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input id="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment-preferences">Payment Preferences</Label>
                  <Input id="payment-preferences" value={paymentPreferences} onChange={(e) => setPaymentPreferences(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="bank-details">Bank Details</Label>
                  <Input id="bank-details" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} className="bg-background" />
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

          <DialogFooter className="shrink-0 gap-1.5 pt-1.5 sm:space-x-0 sm:gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading}
            >
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
