const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: Record<string, unknown> | null,
  ) {
    const msg = body?.message || statusText;
    super(typeof msg === 'string' ? msg : statusText);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_URL}${cleanPath}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON error response
    }
    throw new ApiError(res.status, res.statusText, body);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ── Transactions ──

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  category_id: string;
  description: string | null;
  transaction_date: string;
  is_ai_generated: boolean;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionQuery {
  type?: 'income' | 'expense';
  category_id?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CreateTransactionPayload {
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  category_id: string;
  description?: string | null;
  transaction_date: string;
}

export interface UpdateTransactionPayload {
  type?: 'income' | 'expense';
  amount?: string;
  currency?: string;
  category_id?: string;
  description?: string | null;
  transaction_date?: string;
}

export function listTransactions(token: string, query: TransactionQuery = {}) {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.category_id) params.set('category_id', query.category_id);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return request<TransactionListResponse>(
    `/transactions${qs ? `?${qs}` : ''}`,
    token,
  );
}

export function getTransaction(token: string, id: string) {
  return request<Transaction>(`/transactions/${id}`, token);
}

export function createTransaction(token: string, payload: CreateTransactionPayload) {
  return request<Transaction>('/transactions', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTransaction(token: string, id: string, payload: UpdateTransactionPayload) {
  return request<Transaction>(`/transactions/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(token: string, id: string) {
  return request<{ message: string; id: string }>(`/transactions/${id}`, token, {
    method: 'DELETE',
  });
}

// ── AI Parsing ──

export interface ParseExpensePayload {
  text: string;
  currency_preference?: string;
}

export interface ParseExpenseResult {
  success: boolean;
  clarificationNeeded: boolean;
  message: string;
  draftId?: string;
  proposedCategory?: string | null;
  extracted?: {
    type?: string;
    amount?: string | number | null;
    currency?: string;
    category_name?: string | null;
    category_id?: string;
    description?: string;
    transaction_date?: string;
  };
}

export function parseExpense(token: string, payload: ParseExpensePayload) {
  return request<ParseExpenseResult>('/ai/parse-expense', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── AI Drafts ──

export interface AiDraft {
  id: string;
  user_id: string;
  payload: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface AiDraftListResponse {
  data: AiDraft[];
  total: number;
}

export function listDrafts(token: string) {
  return request<AiDraftListResponse>('/ai-drafts', token);
}

export function getDraft(token: string, id: string) {
  return request<AiDraft>(`/ai-drafts/${id}`, token);
}

export function confirmDraft(token: string, id: string) {
  return request<{ message: string; transactionId: string }>(
    `/ai-drafts/${id}/confirm`,
    token,
    { method: 'POST' },
  );
}

export function discardDraft(token: string, id: string) {
  return request<{ message: string; id: string }>(
    `/ai-drafts/${id}`,
    token,
    { method: 'DELETE' },
  );
}

// ── Debt & Loans ──

export interface Loan {
  id: string;
  user_id: string;
  person_name: string;
  person_contact: string | null;
  direction: 'lent' | 'borrowed';
  principal_amount: number | string;
  currency: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  loan_date: string;
  due_date: string | null;
  notes: string | null;
  total_repaid: number;
  outstanding_balance: number;
  progress_pct: number;
  status: 'active' | 'overdue' | 'settled';
  created_at: string;
  updated_at: string;
  repayments?: LoanRepayment[];
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number | string;
  payment_date: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface CurrencyLoanSummary {
  currency: string;
  total_lent: number;
  total_borrowed: number;
  outstanding_receivables: number;
  outstanding_payables: number;
  overdue_receivables: number;
  overdue_payables: number;
  total_repaid_lent: number;
  total_repaid_borrowed: number;
  active_loans_count: number;
  overdue_loans_count: number;
  settled_loans_count: number;
}

export interface LoanListResponse {
  data: Loan[];
  total: number;
  limit: number;
  offset: number;
}

export interface LoanQuery {
  direction?: 'lent' | 'borrowed';
  status?: 'active' | 'overdue' | 'settled';
  search?: string;
  limit?: number;
  offset?: number;
}

export function createLoan(
  token: string,
  payload: {
    person_name: string;
    person_contact?: string | null;
    direction: 'lent' | 'borrowed';
    principal_amount: string | number;
    currency: string;
    payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
    loan_date: string;
    due_date?: string | null;
    notes?: string | null;
  },
) {
  return request<Loan>('/loans', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listLoans(token: string, query: LoanQuery = {}) {
  const params = new URLSearchParams();
  if (query.direction) params.set('direction', query.direction);
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));

  const qs = params.toString() ? `?${params.toString()}` : '';
  return request<LoanListResponse>(`/loans${qs}`, token);
}

export function getLoanSummary(token: string) {
  return request<{ currencies: Record<string, CurrencyLoanSummary> }>('/loans/summary', token);
}

export function getLoan(token: string, id: string) {
  return request<Loan>(`/loans/${id}`, token);
}

export function updateLoan(
  token: string,
  id: string,
  payload: {
    person_name?: string;
    person_contact?: string | null;
    due_date?: string | null;
    notes?: string | null;
  },
) {
  return request<Loan>(`/loans/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteLoan(token: string, id: string) {
  return request<{ success: boolean }>(`/loans/${id}`, token, {
    method: 'DELETE',
  });
}

export function recordLoanRepayment(
  token: string,
  loanId: string,
  payload: {
    amount: string | number;
    payment_date: string;
    payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
    reference?: string | null;
    notes?: string | null;
  },
) {
  return request<{
    repayment_id: string;
    loan_id: string;
    amount: number;
    total_repaid: number;
    outstanding_balance: number;
    progress_pct: number;
    status: 'active' | 'overdue' | 'settled';
  }>(`/loans/${loanId}/repayments`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteLoanRepayment(token: string, loanId: string, repaymentId: string) {
  return request<{ success: boolean }>(`/loans/${loanId}/repayments/${repaymentId}`, token, {
    method: 'DELETE',
  });
}

