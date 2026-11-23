import { ReactNode } from 'react';

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

/**
 * PostgREST serialises Postgres `numeric` columns as JSON numbers, while the
 * rest of the app treats amounts as decimal strings. Normalise once here so
 * every consumer (forms, tables, charts) receives the shape it expects.
 */
function normalizeTransaction(row: Transaction): Transaction {
  const amount = row.amount as unknown;
  return typeof amount === 'number'
    ? { ...row, amount: amount.toFixed(2) }
    : row;
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

export async function listTransactions(token: string, query: TransactionQuery = {}) {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.category_id) params.set('category_id', query.category_id);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  const response = await request<TransactionListResponse>(
    `/transactions${qs ? `?${qs}` : ''}`,
    token,
  );
  return { ...response, data: (response.data ?? []).map(normalizeTransaction) };
}

/**
 * Every transaction on or after `startDate`, paged 100 at a time.
 * `complete` is false when the page cap was hit, so callers never show a partial total as a real one.
 */
export async function listAllTransactions(token: string, startDate: string, maxPages = 20) {
  const data: Transaction[] = [];
  for (let page = 0; page < maxPages; page++) {
    const res = await listTransactions(token, { startDate, limit: 100, offset: page * 100 });
    data.push(...res.data);
    if (res.data.length < 100 || data.length >= res.total) return { data, complete: true };
  }
  return { data, complete: false };
}

export async function getTransaction(token: string, id: string) {
  const transaction = await request<Transaction>(`/transactions/${id}`, token);
  return normalizeTransaction(transaction);
}

export async function createTransaction(token: string, payload: CreateTransactionPayload) {
  const transaction = await request<Transaction>('/transactions', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeTransaction(transaction);
}

export async function updateTransaction(token: string, id: string, payload: UpdateTransactionPayload) {
  const transaction = await request<Transaction>(`/transactions/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeTransaction(transaction);
}

export function deleteTransaction(token: string, id: string) {
  return request<{ message: string; id: string }>(`/transactions/${id}`, token, {
    method: 'DELETE',
  });
}

// ── Monthly Summary ──

export interface CurrencySummaryItem {
  income: string;
  expenses: string;
  net: string;
}

export interface MonthlySummary {
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  currencies: Record<string, CurrencySummaryItem>;
  transactionCount: number;
}

export function getMonthlySummary(token: string, month: number, year: number) {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  return request<MonthlySummary>(`/transactions/summary?${params}`, token);
}

// ── AI Transaction Analysis ──

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalysisRequest {
  question: string;
  period: { month: number; year: number };
  conversationHistory?: ConversationMessage[];
}

export interface AnalysisResult {
  answer: string;
  dataUsed: {
    intent: string;
    period: string;
    queriedAt: string;
  };
  insights: string[];
  suggestedQuestions: string[];
}

export function analyzeTransactions(token: string, payload: AnalysisRequest) {
  return request<AnalysisResult>('/transactions/analysis', token, {
    method: 'POST',
    body: JSON.stringify(payload),
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

// ── Investments ──

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  asset_type: 'gold' | 'silver' | 'fdr_dps' | 'sanchaypatra' | 'stocks' | 'mutual_fund' | 'real_estate' | 'other';
  invested_amount: string;
  current_value: string;
  purchased_date: string;
  status: 'active' | 'sold';
  details?: Record<string, unknown>;
  sold_amount?: string | null;
  sold_date?: string | null;
}

export interface InvestmentSummary {
  totalInvested: string;
  currentValue: string;
  resaleValue: string;
  unrealizedPnlMarket: string;
  unrealizedPnlResale: string;
  returnPctMarket: string;
  returnPctResale: string;
  activeCount: number;
  allocationByType: Record<string, number>;
}


export interface InvestmentQuery {
  assetType?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateInvestmentDto {
  name: string;
  asset_type: 'gold' | 'silver' | 'fdr_dps' | 'sanchaypatra' | 'stocks' | 'mutual_fund' | 'real_estate' | 'other';
  invested_amount: string;
  purchase_date: string;
  status?: 'active' | 'sold';
  notes?: string;
}

export interface UpdateInvestmentDto {
  name?: string;
  current_value?: string;
  status?: 'active' | 'sold';
  details?: Record<string, unknown>;
}

export interface SellInvestmentDto {
  sold_amount: string;
  sold_date: string;
  linked_transaction_id?: string;
}

export async function listInvestments(token: string, query: InvestmentQuery = {}) {
  const params = new URLSearchParams();
  if (query.assetType) params.set('assetType', query.assetType);
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request<{ data: Investment[]; total: number }>(
    `/investments${qs}`,
    token,
  );
  return {
    ...response,
    data: (response.data ?? []).map(normalizeInvestment),
  };
}

export async function getInvestment(token: string, id: string) {
  const investment = await request<Investment>(`/investments/${id}`, token);
  return normalizeInvestment(investment);
}

export async function createInvestment(
  token: string,
  dto: CreateInvestmentDto,
) {
  return request<Investment>('/investments', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateInvestment(
  token: string,
  id: string,
  dto: UpdateInvestmentDto,
) {
  return request<Investment>(`/investments/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function sellInvestment(
  token: string,
  id: string,
  dto: SellInvestmentDto,
) {
  return request<Investment>(`/investments/${id}/sell`, token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteInvestment(token: string, id: string) {
  return request<{ success: boolean }>(`/investments/${id}`, token, {
    method: 'DELETE',
  });
}

export function normalizeInvestment(row: Investment): Investment {
  const amount = row.invested_amount as unknown;
  const current = row.current_value as unknown;
  return {
    ...row,
    invested_amount: typeof amount === 'number' ? amount.toFixed(2) : String(amount ?? '0.00'),
    current_value: typeof current === 'number' ? current.toFixed(2) : String(current ?? '0.00'),
    sold_amount: row.sold_amount !== undefined ? (row.sold_amount ?? null) : null,
    sold_date: row.sold_date ?? undefined,
  };
}

// ── Investment Allocation Chart ──

export interface AllocationPoint {
  type: string;
  invested: string;
  current: string;
}

export async function fetchAllocation(token: string): Promise<AllocationPoint[]> {
  const summary = await fetchInvestmentSummary(token);
  const totalInvested = parseFloat(summary.totalInvested);
  const totalCurrent = parseFloat(summary.currentValue);
  if (totalInvested === 0) return [];
  return Object.entries(summary.allocationByType ?? {}).map(([type, invested]) => {
    const investedAmount = parseFloat(String(invested));
    return {
      type,
      invested: investedAmount.toFixed(2),
      current: (totalCurrent * (investedAmount / totalInvested)).toFixed(2),
    };
  });
}


export async function fetchInvestmentSummary(token: string): Promise<InvestmentSummary> {
  const response = await request<InvestmentSummary>(`/investments/summary`, token);
  return response;
}

// ── Budgets ──

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  period_year: number;
  period_month: number;
  limit_amount: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetQuery {
  month?: string;
  year?: string;
  category_id?: string;
}

export interface CreateBudgetDto {
  category_id?: string | null;
  period_year: number;
  period_month: number;
  limit_amount: string;
  currency?: string;
}

export interface UpdateBudgetDto {
  category_id?: string | null;
  limit_amount?: string;
  currency?: string;
}

export interface BudgetProgressItem {
  id: string;
  category_id: string | null;
  category_name: string | null;
  period_year: number;
  period_month: number;
  limit_amount: string;
  currency: string;
  spent_amount: string;
  remaining_amount: string;
  percent: number;
  is_over_budget: boolean;
}

export async function listBudgets(token: string, query: BudgetQuery = {}) {
  const params = new URLSearchParams();
  if (query.month) params.set('month', query.month);
  if (query.year) params.set('year', query.year);
  if (query.category_id) params.set('category_id', query.category_id);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request<{ data: Budget[]; total: number }>(`/budgets${qs}`, token);
  return {
    ...response,
    data: (response.data ?? []).map(normalizeBudget),
  };
}

export async function getBudgetProgress(
  token: string,
  year?: number,
  month?: number,
) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request<BudgetProgressItem[]>(`/budgets/progress${qs}`, token);
  return (response ?? []).map(normalizeBudgetProgress);
}

export async function createBudget(token: string, dto: CreateBudgetDto) {
  const budget = await request<Budget>('/budgets', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return normalizeBudget(budget);
}

export async function updateBudget(token: string, id: string, dto: UpdateBudgetDto) {
  const budget = await request<Budget>(`/budgets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return normalizeBudget(budget);
}

export async function deleteBudget(token: string, id: string) {
  return request<{ success: boolean }>(`/budgets/${id}`, token, {
    method: 'DELETE',
  });
}

export function normalizeBudget(row: Budget): Budget {
  const amount = row.limit_amount as unknown;
  return {
    ...row,
    limit_amount: typeof amount === 'number' ? amount.toFixed(2) : String(amount ?? '0.00'),
  };
}

export function normalizeBudgetProgress(row: BudgetProgressItem): BudgetProgressItem {
  const amount = (key: keyof BudgetProgressItem): string => {
    const val = row[key] as unknown;
    return typeof val === 'number' ? val.toFixed(2) : String(val ?? '0.00');
  };
  return {
    ...row,
    limit_amount: amount('limit_amount'),
    spent_amount: amount('spent_amount'),
    remaining_amount: amount('remaining_amount'),
  };
}

// ── Responsive Data Table ──

export interface ResponsiveColumn {
  key: string;
  header: string;
  render?: (value: string) => ReactNode;
}

export interface ResponsiveDataTableProps {
  columns: ResponsiveColumn[];
  data: Investment[];
  title?: string;
  loading?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export { ResponsiveDataTable } from '@/components/responsive-table/responsive-data-table';


