import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bot, CalendarDays, Check, ChevronDown,
  CircleHelp, Download, LayoutDashboard, LogOut, Menu, MessageCircle, Plus,
  ReceiptText, ShieldCheck, Sparkles, Target, Trash2, TrendingDown, Wallet, X
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

const CATEGORIES = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Health', 'Education', 'Entertainment', 'Family', 'Housing', 'Salary', 'Freelance', 'Gifts', 'Other'];
const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !['Salary', 'Freelance'].includes(c));
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const monthNow = () => localDate().slice(0, 7);
const money = value => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const fmtDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const categoryEmoji = { 'Food & Dining': '🍜', Transport: '🛺', Shopping: '🛍️', 'Bills & Utilities': '💡', Health: '🩺', Education: '📚', Entertainment: '🎬', Family: '🏡', Housing: '🏠', Salary: '💼', Freelance: '💻', Gifts: '🎁', Other: '📦' };

async function api(path, session, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm it, then sign in.');
    } catch (error) { setMessage(error.message || 'Could not authenticate.'); }
    finally { setBusy(false); }
  };
  return <main className="auth-page"><section className="auth-side"><div className="brand brand-light"><span className="brand-mark"><Wallet size={21} /></span><span>ledgerly</span></div><div className="auth-pitch"><span className="eyebrow light-eyebrow">YOUR MONEY, LESS MYSTERIOUS</span><h1>Make your money<br /><em>make sense.</em></h1><p>Track spending, stay inside your budget, and get useful answers about your money without wrestling with spreadsheets.</p><div className="auth-proof"><span><Check size={15} /> Simple daily tracking</span><span><Check size={15} /> AI-assisted insights</span><span><Check size={15} /> Your own private account</span></div></div><div className="auth-decoration"><div className="deco-orbit orbit-one" /><div className="deco-orbit orbit-two" /><div className="deco-spark">✳</div></div><div className="auth-footer">A clearer view of everyday money.</div></section><section className="auth-form-wrap"><form className="auth-card" onSubmit={submit}><div className="mobile-brand brand"><span className="brand-mark"><Wallet size={20} /></span><span>ledgerly</span></div><span className="eyebrow">WELCOME TO LEDGERLY</span><h2>{mode === 'signin' ? 'Sign in to your account' : 'Create your account'}</h2><p className="muted">Your finances deserve better than guesswork.</p><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>{message && <div className="notice">{message}</div>}<button className="btn btn-primary btn-wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16} /></button><p className="auth-switch">{mode === 'signin' ? 'New here?' : 'Already have an account?'} <button type="button" className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></p><div className="secure-note"><ShieldCheck size={15} /> Protected by Supabase authentication. AI features are optional.</div></form></section></main>;
}

function SetupScreen() {
  return <div className="setup-page"><div className="setup-card"><div className="brand"><span className="brand-mark"><Wallet size={21} /></span><span>ledgerly</span></div><div className="setup-icon"><ShieldCheck size={28} /></div><h1>One small setup step.</h1><p>Connect a Supabase project to enable secure sign-in and save your transactions across devices. The app is configured to use per-user database access, not a shared public ledger. A rare case where “setup first” is actually good advice.</p><div className="setup-steps"><div><b>01</b><span>Create a Supabase project</span></div><div><b>02</b><span>Run <code>supabase/schema.sql</code> in its SQL Editor</span></div><div><b>03</b><span>Copy your project URL and anon key into <code>web/.env</code></span></div><div><b>04</b><span>Add the same Supabase values and your Groq key to <code>server/.env</code></span></div></div><a className="btn btn-primary btn-wide" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase <ArrowUpRight size={16} /></a><p className="tiny muted">Never put your Groq API key in a variable starting with VITE_. Browser variables are public by design.</p></div></div>;
}

function MetricCard({ label, value, sub, icon: Icon, tone = 'plain' }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>;
}

function EmptyState({ icon: Icon = ReceiptText, title, detail }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><strong>{title}</strong><p>{detail}</p></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('Overview');
  const [month, setMonth] = useState(monthNow());
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food & Dining', description: '', transaction_date: localDate() });
  const [saving, setSaving] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: 'Food & Dining', monthly_limit: '' });
  const [aiText, setAiText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [question, setQuestion] = useState('Where is most of my money going this month?');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError('');
    try {
      const [tx, bd] = await Promise.all([
        api(`/api/transactions?month=${month}`, session),
        api(`/api/budgets?month=${month}`, session)
      ]);
      setTransactions(tx.transactions || []); setBudgets(bd.budgets || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [session, month]);
  useEffect(() => { loadData(); }, [loadData]);

  const summary = useMemo(() => {
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const catMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
    const categories = Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    const budgetTotal = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);
    return { expense, income, net: income - expense, categories, budgetTotal, txCount: transactions.length };
  }, [transactions, budgets]);

  const addTransaction = async (item = form) => {
    if (!Number(item.amount) || Number(item.amount) <= 0) return setError('Enter an amount greater than zero.');
    setSaving(true); setError('');
    try {
      await api('/api/transactions', session, { method: 'POST', body: JSON.stringify({ ...item, amount: Number(item.amount) }) });
      await loadData(); setShowAdd(false); setForm({ type: 'expense', amount: '', category: 'Food & Dining', description: '', transaction_date: localDate() });
      notify('Transaction saved. Tiny victory for financial order.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteTransaction = async id => {
    try { await api(`/api/transactions/${id}`, session, { method: 'DELETE' }); await loadData(); notify('Transaction deleted.'); }
    catch (e) { setError(e.message); }
  };

  const saveBudget = async e => {
    e.preventDefault(); setError('');
    try {
      await api('/api/budgets', session, { method: 'PUT', body: JSON.stringify({ ...budgetForm, monthly_limit: Number(budgetForm.monthly_limit), month }) });
      setBudgetForm({ ...budgetForm, monthly_limit: '' }); await loadData(); notify('Monthly budget saved.');
    } catch (e2) { setError(e2.message); }
  };
  const deleteBudget = async id => {
    try { await api(`/api/budgets/${id}`, session, { method: 'DELETE' }); await loadData(); notify('Budget removed.'); }
    catch (e) { setError(e.message); }
  };

  const parseNaturalLanguage = async e => {
    e.preventDefault(); if (!aiText.trim()) return;
    setParsing(true); setError(''); setParsedItems([]);
    try { const result = await api('/api/ai/parse', session, { method: 'POST', body: JSON.stringify({ text: aiText, today: localDate() }) }); setParsedItems(result.transactions || []); if (!result.transactions?.length) setError('No clear transactions found. Include an amount, like “Lunch 180 taka”.'); }
    catch (e2) { setError(e2.message); }
    finally { setParsing(false); }
  };
  const saveParsed = async () => {
    if (!parsedItems.length) return;
    setSaving(true); setError('');
    try {
      for (const item of parsedItems) await api('/api/transactions', session, { method: 'POST', body: JSON.stringify(item) });
      setParsedItems([]); setAiText(''); await loadData(); notify('Reviewed AI entries saved.');
    } catch (e) { setError(`Some entries may have saved before this error: ${e.message}`); await loadData(); }
    finally { setSaving(false); }
  };
  const askAi = async e => {
    e.preventDefault(); if (!question.trim()) return;
    setAsking(true); setError(''); setAnswer('');
    try { const result = await api('/api/ai/ask', session, { method: 'POST', body: JSON.stringify({ question, month }) }); setAnswer(result.answer); }
    catch (e2) { setError(e2.message); }
    finally { setAsking(false); }
  };

  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Category', 'Description', 'Amount (BDT)'], ...transactions.map(t => [t.transaction_date, t.type, t.category, t.description, t.amount])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `ledgerly-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (authLoading) return <div className="loading-screen"><div className="loader" /><span>Getting your ledger ready…</span></div>;
  if (!session) return <AuthScreen />;

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard }, { name: 'Transactions', icon: ReceiptText },
    { name: 'Budgets', icon: Target }, { name: 'AI Money Coach', icon: Sparkles }
  ];
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
  const expenseTx = transactions.filter(t => t.type === 'expense');
  const currentBudgetSpent = category => expenseTx.filter(t => t.category === category).reduce((s, t) => s + Number(t.amount), 0);
  const largestCategory = summary.categories[0];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Wallet size={21} /></span><span>ledgerly</span><span className="brand-dot" /></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">{navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'nav-active' : ''}`} onClick={() => { setPage(item.name); setMobileNav(false); }}><item.icon size={18} strokeWidth={1.9} /><span>{item.name}</span>{item.name === 'AI Money Coach' && <span className="nav-ai-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="tip-card"><div className="tip-icon"><Sparkles size={17} /></div><strong>Small habits add up.</strong><p>Log purchases soon after you make them. Future-you likes fewer mysteries.</p><button onClick={() => { setPage('AI Money Coach'); setMobileNav(false); }}>Meet your AI coach <ArrowUpRight size={14} /></button></div><div className="profile-row"><div className="avatar">{(session.user.email || 'U').slice(0, 1).toUpperCase()}</div><div className="profile-text"><strong>{session.user.email?.split('@')[0] || 'My account'}</strong><span>{session.user.email}</span></div><button className="icon-button signout" title="Sign out" onClick={() => supabase.auth.signOut()}><LogOut size={17} /></button></div></div>
    </aside>
    {mobileNav && <button aria-label="Close navigation" className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb">Personal finance <span>/</span> <strong>{page}</strong></div></div><div className="topbar-actions"><label className="month-picker"><CalendarDays size={16} /><input aria-label="Report month" type="month" value={month} onChange={e => setMonth(e.target.value)} /><ChevronDown size={14} /></label><button className="btn btn-primary top-add" onClick={() => setShowAdd(true)}><Plus size={17} /> Add transaction</button></div></header>
      <div className="content-wrap">
        {error && <div className="error-banner"><CircleHelp size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
        <div className="page-heading"><div><span className="eyebrow">YOUR FINANCIAL SNAPSHOT</span><h1>{page === 'Overview' ? 'Money, in perspective.' : page === 'Transactions' ? 'Your transactions' : page === 'Budgets' ? 'Give every taka a job.' : 'Your AI money coach'}</h1><p>{page === 'Overview' ? `Here’s how your money moved in ${monthLabel}.` : page === 'Transactions' ? 'Every purchase and payday, all in one place.' : page === 'Budgets' ? `Set realistic limits for ${monthLabel}, then keep an eye on them.` : 'Ask questions, get spending insights, and turn plain language into entries.'}</p></div>{page === 'Transactions' && <button className="btn btn-secondary" onClick={exportCsv}><Download size={16} /> Export CSV</button>}</div>

        {page === 'Overview' && <>
          <section className="metric-grid"><MetricCard label="Total income" value={money(summary.income)} sub={`${monthLabel} · money in`} icon={ArrowDownLeft} tone="income" /><MetricCard label="Total spending" value={money(summary.expense)} sub={`${expenseTx.length} expense entries`} icon={ArrowUpRight} tone="expense" /><MetricCard label="Net cash flow" value={money(summary.net)} sub={summary.net >= 0 ? 'You earned more than you spent' : 'Spending is above income'} icon={Activity} tone={summary.net >= 0 ? 'positive' : 'negative'} /><MetricCard label="Budget allocated" value={money(summary.budgetTotal)} sub={`${budgets.length} active budget${budgets.length === 1 ? '' : 's'}`} icon={Target} tone="budget" /></section>
          <section className="overview-grid"><div className="panel spending-panel"><div className="panel-heading"><div><h2>Where it went</h2><p>Your spending by category</p></div><span className="panel-period">{monthLabel}</span></div>{summary.categories.length ? <div className="category-chart">{summary.categories.slice(0, 6).map((item, i) => <div className="bar-row" key={item.category}><div className="bar-label"><span className="category-symbol">{categoryEmoji[item.category] || '📦'}</span><span>{item.category}</span><strong>{money(item.amount)}</strong></div><div className="bar-track"><div className={`bar-fill bar-color-${i % 6}`} style={{ width: `${Math.max(3, (item.amount / summary.categories[0].amount) * 100)}%` }} /></div><div className="bar-subline">{summary.expense ? Math.round(item.amount / summary.expense * 100) : 0}% of expenses</div></div>)}</div> : <EmptyState icon={Activity} title="No spending to chart yet" detail="Add your first expense and this space will start telling the story." />}<button className="panel-link" onClick={() => setPage('Transactions')}>View all transactions <ArrowUpRight size={15} /></button></div>
          <div className="panel budget-panel"><div className="panel-heading"><div><h2>Budget pulse</h2><p>How your limits are holding up</p></div><Target size={19} className="heading-icon" /></div>{budgets.length ? <div className="budget-list">{budgets.slice(0, 5).map(b => { const spent = currentBudgetSpent(b.category); const pct = Math.min(100, spent / Number(b.monthly_limit) * 100); const over = spent > Number(b.monthly_limit); return <div className="budget-item" key={b.id}><div className="budget-item-top"><span><i>{categoryEmoji[b.category] || '📦'}</i>{b.category}</span><strong className={over ? 'danger-text' : ''}>{money(spent)} <small>/ {money(b.monthly_limit)}</small></strong></div><div className="budget-track"><div className={`budget-fill ${over ? 'fill-over' : pct > 80 ? 'fill-warn' : ''}`} style={{ width: `${pct}%` }} /></div><div className="budget-status">{over ? `${money(spent - Number(b.monthly_limit))} over limit` : `${money(Number(b.monthly_limit) - spent)} left`}</div></div>; })}</div> : <EmptyState icon={Target} title="No budgets set yet" detail="Choose a few categories to give your spending some guardrails." />}<button className="panel-link" onClick={() => setPage('Budgets')}>Manage budgets <ArrowUpRight size={15} /></button></div></section>
          <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest money movements</p></div><button className="panel-link inline-link" onClick={() => setPage('Transactions')}>See all <ArrowUpRight size={15} /></button></div>{transactions.length ? <TransactionTable transactions={transactions.slice(0, 5)} onDelete={deleteTransaction} /> : <EmptyState title="Your ledger is wonderfully empty" detail="Start by adding an expense or income. We can take it from there." />}</section>
          <div className="dashboard-note"><Sparkles size={17} /><span><strong>Want a second opinion?</strong> Your AI Money Coach can explain the month's patterns using your totals and budget data.</span><button onClick={() => setPage('AI Money Coach')}>Ask AI <ArrowUpRight size={15} /></button></div>
        </>}

        {page === 'Transactions' && <section className="panel transactions-page-panel"><div className="panel-heading"><div><h2>All activity</h2><p>{transactions.length} records in {monthLabel}</p></div><button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add new</button></div>{transactions.length ? <TransactionTable transactions={transactions} onDelete={deleteTransaction} showDelete /> : <EmptyState title="Nothing recorded this month" detail="Add an entry manually or use the AI coach to turn a sentence into draft transactions." />}</section>}

        {page === 'Budgets' && <div className="budget-page-grid"><section className="panel budget-form-panel"><div className="panel-heading"><div><h2>Create a budget</h2><p>Pick a category and set a monthly limit.</p></div><Target size={19} className="heading-icon" /></div><form className="stack-form" onSubmit={saveBudget}><label>Category<select value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label>Monthly limit (BDT)<input type="number" min="1" step="1" required placeholder="e.g. 5000" value={budgetForm.monthly_limit} onChange={e => setBudgetForm({ ...budgetForm, monthly_limit: e.target.value })} /></label><div className="form-hint">Budget month: <strong>{monthLabel}</strong>. You can set a different limit for the same category in another month.</div><button className="btn btn-primary btn-wide"><Plus size={16} /> Save budget</button></form></section><section className="panel active-budgets-panel"><div className="panel-heading"><div><h2>Your budgets</h2><p>Actual spending compared with limits</p></div><span className="count-pill">{budgets.length}</span></div>{budgets.length ? <div className="budget-list large-budget-list">{budgets.map(b => { const spent = currentBudgetSpent(b.category); const limit = Number(b.monthly_limit); const pct = Math.min(100, spent / limit * 100); const over = spent > limit; return <div className="budget-item" key={b.id}><div className="budget-item-top"><span><i>{categoryEmoji[b.category] || '📦'}</i>{b.category}</span><button className="icon-button delete-budget" title="Delete budget" onClick={() => deleteBudget(b.id)}><Trash2 size={15} /></button></div><div className="budget-amount-line"><strong className={over ? 'danger-text' : ''}>{money(spent)}</strong><span>of {money(limit)}</span></div><div className="budget-track"><div className={`budget-fill ${over ? 'fill-over' : pct > 80 ? 'fill-warn' : ''}`} style={{ width: `${pct}%` }} /></div><div className="budget-status">{over ? `${money(spent - limit)} over budget` : `${money(limit - spent)} available · ${Math.round(pct)}% used`}</div></div>; })}</div> : <EmptyState icon={Target} title="A blank budget is a blank canvas" detail="Start with the categories where your spending varies most." />}</section></div>}

        {page === 'AI Money Coach' && <div className="ai-page-grid"><section className="panel ai-entry-panel"><div className="ai-panel-intro"><div className="ai-big-icon"><Sparkles size={22} /></div><div><span className="eyebrow">SMART ENTRY</span><h2>Tell it what happened.</h2><p>Write normally. The assistant will draft transactions for you to review.</p></div></div><form onSubmit={parseNaturalLanguage} className="ai-compose"><label htmlFor="ai-entry">Describe your spending or income</label><textarea id="ai-entry" rows="4" maxLength="1600" value={aiText} onChange={e => setAiText(e.target.value)} placeholder={'Spent 180 taka on lunch and 60 on a rickshaw. Got 12000 taka from my salary today.'} /><div className="ai-compose-bottom"><span>Try “paid 900 for internet yesterday”</span><button className="btn btn-primary" disabled={parsing || !aiText.trim()}>{parsing ? 'Reading entry…' : <><Sparkles size={15} /> Draft transactions</>}</button></div></form><div className="ai-privacy"><ShieldCheck size={16} /><span>Your text is sent to Groq to parse the entries. Review every suggestion before saving. The AI never saves entries by itself.</span></div>{parsedItems.length > 0 && <div className="parse-results"><div className="parsed-heading"><div><h3>Review the draft</h3><p>{parsedItems.length} suggestion{parsedItems.length === 1 ? '' : 's'} · nothing saved yet</p></div><button className="text-button" onClick={() => setParsedItems([])}>Discard</button></div>{parsedItems.map((item, i) => <div className="parsed-row" key={`${item.description}-${i}`}><div className="transaction-symbol">{categoryEmoji[item.category] || '📦'}</div><div className="parsed-details"><strong>{item.description}</strong><span>{item.category} · {fmtDate(item.transaction_date)}</span></div><span className={`parsed-amount ${item.type === 'income' ? 'income-text' : ''}`}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</span></div>)}<button className="btn btn-primary btn-wide" onClick={saveParsed} disabled={saving}><Check size={16} /> {saving ? 'Saving entries…' : 'Confirm and save all'}</button></div>}</section><section className="panel ai-ask-panel"><div className="ai-panel-intro"><div className="ai-big-icon ask-icon"><MessageCircle size={21} /></div><div><span className="eyebrow">SPENDING INSIGHTS</span><h2>Ask about your money.</h2><p>Get a grounded answer from this month's totals and budgets.</p></div></div><form className="ask-form" onSubmit={askAi}><label htmlFor="ai-question">Your question</label><textarea id="ai-question" rows="3" maxLength="600" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should I watch next month?" /><button className="btn btn-primary btn-wide" disabled={asking || !question.trim()}>{asking ? 'Thinking…' : <><Sparkles size={16} /> Ask the coach</>}</button></form><div className="suggested-questions"><span>QUICK QUESTIONS</span>{['Am I spending more than I earn?', 'Which budget is closest to its limit?', 'Suggest 3 realistic ways to save next month.'].map(q => <button key={q} onClick={() => setQuestion(q)}>{q}<ArrowUpRight size={14} /></button>)}</div>{answer && <div className="ai-answer"><div className="answer-heading"><Sparkles size={16} /><strong>Your money snapshot</strong></div><p>{answer}</p><span className="answer-footnote">Based on your recorded {monthLabel} totals. Missing entries mean the picture may be incomplete.</span></div>}<div className="ai-privacy small-privacy"><ShieldCheck size={15} /><span>Insights use monthly totals, category sums, and budgets. Raw transaction descriptions are not needed for this analysis.</span></div></section><div className="ai-disclaimer"><CircleHelp size={16} /><span>This coach offers budgeting support, not certified financial, investment, tax, or debt advice. Your records are only as complete as the entries you add.</span></div></div>}

        <footer className="page-footer"><span>LEDGERLY <i>•</i> PERSONAL FINANCE</span><span>One clearer decision at a time.</span></footer>
      </div>
    </main>
    {showAdd && <div className="modal-scrim" onMouseDown={e => { if (e.target === e.currentTarget) setShowAdd(false); }}><form className="modal-card" onSubmit={e => { e.preventDefault(); addTransaction(); }}><div className="modal-header"><div><span className="eyebrow">NEW RECORD</span><h2>Add a transaction</h2></div><button type="button" className="icon-button" onClick={() => setShowAdd(false)}><X size={19} /></button></div><div className="type-switch"><button type="button" className={form.type === 'expense' ? 'type-selected expense-selected' : ''} onClick={() => setForm({ ...form, type: 'expense', category: 'Food & Dining' })}><ArrowUpRight size={16} /> Expense</button><button type="button" className={form.type === 'income' ? 'type-selected income-selected' : ''} onClick={() => setForm({ ...form, type: 'income', category: 'Salary' })}><ArrowDownLeft size={16} /> Income</button></div><label>Amount in BDT<div className="amount-input-wrap"><span>৳</span><input autoFocus type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{(form.type === 'income' ? ['Salary', 'Freelance', 'Gifts', 'Other'] : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}</select></label><label>Description<input maxLength="180" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Lunch with colleagues" /></label><label>Date<input type="date" required value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} /></label><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Save transaction</>}</button></div></form></div>}
    {toast && <div className="toast"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
  </div>;
}

function TransactionTable({ transactions, onDelete, showDelete = false }) {
  return <div className="table-wrap"><table className="transactions-table"><thead><tr><th>TRANSACTION</th><th>DATE</th><th>CATEGORY</th><th className="amount-column">AMOUNT</th>{showDelete && <th aria-label="Actions" />}</tr></thead><tbody>{transactions.map(t => <tr key={t.id}><td><div className="transaction-cell"><span className="transaction-symbol">{categoryEmoji[t.category] || '📦'}</span><span className="transaction-info"><strong>{t.description || t.category}</strong><small>{t.type === 'income' ? 'Money in' : 'Money out'}</small></span></div></td><td className="date-cell">{fmtDate(t.transaction_date)}</td><td><span className="category-pill">{t.category}</span></td><td className={`amount-cell ${t.type === 'income' ? 'income-text' : ''}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</td>{showDelete && <td><button className="icon-button row-delete" title="Delete transaction" onClick={() => onDelete(t.id)}><Trash2 size={15} /></button></td>}</tr>)}</tbody></table></div>;
}

export default App;
