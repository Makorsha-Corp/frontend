export type PaymentTransactionStatus =
  | 'INITIATED'
  | 'VALIDATED_SUCCESS'
  | 'VALIDATED_FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'RISK_HOLD';

export interface InitiatePaymentRequest {
  amount: number;
  currency: string;
  cus_phone: string;
  cus_name?: string | null;
  cus_email?: string | null;
  value_a?: string | null;
  value_b?: string | null;
  value_c?: string | null;
  value_d?: string | null;
}

export interface InitiatePaymentResponse {
  tran_id: string;
  status: string;
  gateway_page_url: string | null;
  failed_reason: string | null;
}

export interface PaymentTransactionApiResponse {
  id: number;
  workspace_id: number;
  tran_id: string;
  status: PaymentTransactionStatus;
  amount: number | string;
  currency: string;
  cus_name: string | null;
  cus_email: string | null;
  cus_phone: string | null;
  value_a: string | null;
  value_b: string | null;
  value_c: string | null;
  value_d: string | null;
  session_key: string | null;
  gateway_page_url: string | null;
  val_id: string | null;
  risk_level: number | null;
  risk_title: string | null;
  bank_tran_id: string | null;
  card_type: string | null;
  risk_resolved_by: number | null;
  risk_resolved_at: string | null;
  risk_resolution_note: string | null;
  initiated_by: number | null;
  initiated_by_name: string | null;
  initiated_at: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction extends Omit<PaymentTransactionApiResponse, 'amount'> {
  amount: number;
}

export interface PaymentTransactionEvent {
  id: number;
  payment_transaction_id: number;
  event_type: string;
  description: string;
  metadata_json: Record<string, unknown> | null;
  performed_by: number | null;
  created_at: string;
}

export interface PaymentTransactionDetailApiResponse extends PaymentTransactionApiResponse {
  events: PaymentTransactionEvent[];
}

export interface PaymentTransactionDetail extends PaymentTransaction {
  events: PaymentTransactionEvent[];
}

export interface ResolveRiskRequest {
  approve: boolean;
  note: string;
}
