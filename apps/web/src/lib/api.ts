const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  const res = await fetch(`${API_URL}${path}`, {
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
