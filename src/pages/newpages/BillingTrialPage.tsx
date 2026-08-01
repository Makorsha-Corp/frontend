import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderLeftGroupClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import toast, { Toaster } from 'react-hot-toast';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetPaymentByTranIdQuery,
  useInitiatePaymentMutation,
  useListPaymentsQuery,
  useResolveRiskMutation,
} from '@/features/payments/paymentsApi';
import type { PaymentTransaction, PaymentTransactionStatus } from '@/types/payment';

function statusBadgeClass(status: PaymentTransactionStatus): string {
  switch (status) {
    case 'INITIATED':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
    case 'VALIDATED_SUCCESS':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'VALIDATED_FAILED':
      return 'bg-destructive/15 text-destructive';
    case 'CANCELLED':
      return 'bg-muted text-muted-foreground';
    case 'EXPIRED':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
    case 'RISK_HOLD':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/** A labeled callout explaining what the backend is about to do / just did. */
const BackendNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
    <Terminal size={14} className="mt-0.5 shrink-0 text-brand-primary" />
    <div>{children}</div>
  </div>
);

/* =========================================================================
   Page root — owner gate (mirrors ManagementPage; billing is owner-only)
   ========================================================================= */

const BillingTrialPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspace } = useAppSelector((state) => state.auth);

  if (!workspace || workspace.role !== 'owner') {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-card-foreground">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">Only workspace owners can access billing.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className={appShellHeaderLeftGroupClass}>
            <div className={appShellHeaderIconTileClass}>
              <CreditCard size={18} />
            </div>
            <h1 className={appShellHeaderTitleClass}>Billing — Payment Flow (Trial)</h1>
          </div>
        </AppShellHeader>

        <div className="space-y-6 p-6 lg:p-8">
          <IntroCard />
          <CheckoutCard />
          <LedgerTable />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   Intro — explains the dual-channel concept and the mock gateway controls
   ========================================================================= */

const IntroCard: React.FC = () => (
  <div className="rounded-2xl border border-border bg-card p-6">
    <h2 className="mb-2 text-lg font-semibold text-card-foreground">How this works</h2>
    <p className="mb-4 text-sm text-muted-foreground">
      This page drives the real SSLCommerz checkout engine — the same code that will run in
      production — against a mocked gateway. Every action below shows what the backend actually
      did, pulled straight from its audit trail, not canned copy.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      <BackendNote>
        <strong className="text-foreground">Two independent channels</strong> resolve every
        payment: your browser gets redirected back with a result, and SSLCommerz's server calls
        our backend directly (the IPN webhook) — whichever arrives first wins, the other is
        recorded as a no-op duplicate.
      </BackendNote>
      <BackendNote>
        On the mock gateway page you can simulate <strong className="text-foreground">success</strong>,{' '}
        <strong className="text-foreground">fail</strong>, or <strong className="text-foreground">cancel</strong>,
        flag a transaction as <strong className="text-foreground">high-risk</strong> (held for
        manual review), or <strong className="text-foreground">drop the browser redirect</strong>{' '}
        entirely to watch the transaction sit at INITIATED until the async IPN alone resolves it.
      </BackendNote>
    </div>
  </div>
);

/* =========================================================================
   Checkout — Step 1 (initiate) + Step 2 (hand off to the gateway)
   ========================================================================= */

const CheckoutCard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState('99.00');
  const [currency, setCurrency] = useState('USD');
  const [phone, setPhone] = useState('+8801700000000');
  const [activeTranId, setActiveTranId] = useState<string | null>(searchParams.get('tran_id'));
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);

  const [initiatePayment, { isLoading: isInitiating }] = useInitiatePaymentMutation();

  const returnedTranId = searchParams.get('tran_id');
  useEffect(() => {
    if (returnedTranId) setActiveTranId(returnedTranId);
  }, [returnedTranId]);

  const handleInitiate = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required by SSLCommerz');
      return;
    }
    try {
      const result = await initiatePayment({
        amount: parsedAmount,
        currency,
        cus_phone: phone.trim(),
      }).unwrap();
      setActiveTranId(result.tran_id);
      setGatewayUrl(result.gateway_page_url);
      toast.success(`Checkout session ${result.tran_id} created`);
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to initiate payment';
      toast.error(msg);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Step 1 */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Step 1 — Start a checkout</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Simulates a workspace owner paying an invoice / subscription charge.
        </p>

        <BackendNote>
          Clicking "Initiate Payment" calls <code>POST /payments/initiate</code>. The backend
          generates a unique <code>tran_id</code>, calls SSLCommerz's <code>init_session</code> (mocked),
          and inserts a <code>PaymentTransaction</code> row with <code>status=INITIATED</code> —
          before any money has moved.
        </BackendNote>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BDT">BDT</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="phone">Customer phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801700000000" />
          </div>
        </div>

        <Button
          className="mt-4 w-full gap-2 bg-brand-primary hover:bg-brand-primary-hover"
          onClick={handleInitiate}
          disabled={isInitiating}
        >
          {isInitiating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard size={16} />}
          Initiate Payment
        </Button>
      </div>

      {/* Step 2 */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Step 2 — Complete on the gateway</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          In production your browser fully navigates to SSLCommerz's hosted page.
        </p>

        <BackendNote>
          The mock gateway is a real page served by our own backend — it exercises the exact same
          success/fail/cancel/IPN endpoints the real integration will call. It opens in a new tab
          because that's what a real full-page redirect looks like; this tab keeps polling the
          ledger below so you can watch it update live.
        </BackendNote>

        {activeTranId ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              tran_id: <code className="text-foreground">{activeTranId}</code>
            </p>
            {gatewayUrl && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(gatewayUrl, '_blank', 'noopener')}
              >
                <ExternalLink size={15} />
                Open Mock Gateway
              </Button>
            )}
            <PaymentDetailPanel tranId={activeTranId} />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Initiate a payment to get a gateway link here.
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   Live detail panel for the active transaction — polls fast while pending
   ========================================================================= */

const PaymentDetailPanel: React.FC<{ tranId: string }> = ({ tranId }) => {
  const { data: txn } = useGetPaymentByTranIdQuery(tranId, {
    pollingInterval: 2000,
  });

  if (!txn) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading transaction…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Status</span>
        <Badge className={cn('border-none', statusBadgeClass(txn.status))}>{txn.status}</Badge>
      </div>
      <ol className="space-y-2 border-l border-border pl-3">
        {txn.events.map((event) => (
          <li key={event.id} className="relative text-xs">
            <span className="absolute -left-[15px] top-1 h-2 w-2 rounded-full bg-brand-primary" />
            <p className="font-medium text-foreground">{event.event_type.replace(/_/g, ' ')}</p>
            <p className="text-muted-foreground">{event.description}</p>
            <p className="text-[10px] text-muted-foreground/70">
              {new Date(event.created_at).toLocaleTimeString()}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* =========================================================================
   Ledger — the immutable table, auto-refreshing
   ========================================================================= */

const LedgerTable: React.FC = () => {
  const { data: transactions, isLoading } = useListPaymentsQuery(undefined, { pollingInterval: 4000 });
  const [selected, setSelected] = useState<PaymentTransaction | null>(null);
  const [riskTarget, setRiskTarget] = useState<PaymentTransaction | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-card-foreground">Live Ledger</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Every checkout attempt, immutable once finalized. Refreshes automatically every few seconds.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No transactions yet — initiate one above.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tran ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Initiated by</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="font-mono text-xs">{txn.tran_id}</TableCell>
                <TableCell>
                  {txn.amount.toFixed(2)} {txn.currency}
                </TableCell>
                <TableCell>
                  <Badge className={cn('border-none', statusBadgeClass(txn.status))}>{txn.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {txn.risk_level === null ? '—' : txn.risk_title}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{txn.initiated_by_name ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(txn.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(txn)}>
                      View
                    </Button>
                    {txn.status === 'RISK_HOLD' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-amber-600"
                        onClick={() => setRiskTarget(txn)}
                      >
                        <ShieldAlert size={13} />
                        Resolve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TransactionDetailDialog txn={selected} onClose={() => setSelected(null)} />
      <ResolveRiskDialog txn={riskTarget} onClose={() => setRiskTarget(null)} />
    </div>
  );
};

/* =========================================================================
   Detail dialog — full event timeline for a ledger row
   ========================================================================= */

const TransactionDetailDialog: React.FC<{ txn: PaymentTransaction | null; onClose: () => void }> = ({
  txn,
  onClose,
}) => {
  const { data: detail } = useGetPaymentByTranIdQuery(txn?.tran_id ?? '', { skip: !txn });

  return (
    <Dialog open={!!txn} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction {txn?.tran_id}</DialogTitle>
          <DialogDescription>
            Full event history as recorded by the backend — this is the ground truth, not a
            reconstruction.
          </DialogDescription>
        </DialogHeader>
        {!detail ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : (
          <ol className="space-y-3 border-l border-border pl-4">
            {detail.events.map((event) => (
              <li key={event.id} className="relative text-sm">
                <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary" />
                <p className="font-medium text-foreground">{event.event_type.replace(/_/g, ' ')}</p>
                <p className="text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground/70">{new Date(event.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* =========================================================================
   Resolve-risk dialog — owner approves/rejects a RISK_HOLD transaction
   ========================================================================= */

const ResolveRiskDialog: React.FC<{ txn: PaymentTransaction | null; onClose: () => void }> = ({ txn, onClose }) => {
  const [note, setNote] = useState('');
  const [resolveRisk, { isLoading }] = useResolveRiskMutation();

  const handleResolve = async (approve: boolean) => {
    if (!txn) return;
    if (!note.trim()) {
      toast.error('A note is required to resolve a risk hold');
      return;
    }
    try {
      await resolveRisk({ transactionId: txn.id, data: { approve, note: note.trim() } }).unwrap();
      toast.success(approve ? 'Transaction approved' : 'Transaction rejected');
      setNote('');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to resolve risk hold';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={!!txn} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve risk hold</DialogTitle>
          <DialogDescription>
            SSLCommerz flagged <code>{txn?.tran_id}</code> as high-risk ({txn?.risk_title}). Approve
            to mark it VALIDATED_SUCCESS, or reject to mark it VALIDATED_FAILED.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="risk-note">Note</Label>
          <Input
            id="risk-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Verified customer identity by phone"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isLoading} onClick={() => handleResolve(false)}>
            Reject
          </Button>
          <Button
            className="bg-brand-primary hover:bg-brand-primary-hover"
            disabled={isLoading}
            onClick={() => handleResolve(true)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingTrialPage;
