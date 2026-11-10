'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SectionLabel, SampleDataNote } from './primitives';

type DemoRow = {
  label: string;
  detail: string;
  amount: string;
};

type Demo = {
  id: string;
  question: string;
  answer: string;
  columnLabel: string;
  rows: DemoRow[];
};

const DEMOS: Demo[] = [
  {
    id: 'top-category',
    question: 'What cost me the most this month?',
    answer: 'Food and dining is your highest spending category this month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: '9 transactions · 28% of expenses', amount: '৳12,200.00' },
      { label: 'Rent', detail: '1 transaction · 25% of expenses', amount: '৳11,000.00' },
      { label: 'Groceries', detail: '12 transactions · 18% of expenses', amount: '৳7,800.00' },
    ],
  },
  {
    id: 'this-week',
    question: 'How much did I spend this week?',
    answer: 'You spent ৳8,420 this week across 9 transactions.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: '4 transactions', amount: '৳3,200.00' },
      { label: 'Groceries', detail: '2 transactions', amount: '৳2,600.00' },
      { label: 'Utilities', detail: '1 transaction', amount: '৳1,500.00' },
      { label: 'Transport', detail: '2 transactions', amount: '৳1,120.00' },
    ],
  },
  {
    id: 'compare',
    question: 'Compare my spending with last month.',
    answer:
      'You spent ৳43,500 this month — 12% more than the ৳38,800 you spent last month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: 'Up ৳1,400 vs October', amount: '৳12,200.00' },
      { label: 'Rent', detail: 'Unchanged vs October', amount: '৳11,000.00' },
      { label: 'Utilities', detail: 'Up ৳320 vs October', amount: '৳4,800.00' },
      { label: 'Groceries', detail: 'Down ৳700 vs October', amount: '৳7,800.00' },
      { label: 'Other categories', detail: 'Transport, health, subscriptions', amount: '৳7,700.00' },
    ],
  },
  {
    id: 'increased',
    question: 'Which category increased the most?',
    answer: 'Food and dining increased the most, up ৳1,400 (13%) from last month.',
    columnLabel: 'Category',
    rows: [
      { label: 'Food & dining', detail: 'October: ৳10,800 · +13%', amount: '৳12,200.00' },
      { label: 'Utilities', detail: 'October: ৳4,480 · +7%', amount: '৳4,800.00' },
      { label: 'Transport', detail: 'October: ৳2,900 · −7%', amount: '৳2,700.00' },
    ],
  },
  {
    id: 'owed',
    question: 'How much money do people still owe me?',
    answer: 'Two people still owe you ৳19,500 in total.',
    columnLabel: 'Person',
    rows: [
      { label: 'Tanvir Ahmed', detail: '62% repaid', amount: '৳4,500.00' },
      { label: 'Rafiqul Islam', detail: 'No repayments yet', amount: '৳15,000.00' },
    ],
  },
  {
    id: 'owe',
    question: 'How much do I still need to repay?',
    answer: 'You still need to repay ৳19,500 across two loans.',
    columnLabel: 'Person',
    rows: [
      { label: 'Nusrat Jahan', detail: '40% repaid', amount: '৳15,000.00' },
      { label: 'Farzana Akter', detail: '25% repaid · overdue', amount: '৳4,500.00' },
    ],
  },
];

export function AiAssistantShowcase() {
  const [activeId, setActiveId] = useState(DEMOS[0].id);
  const activeDemo = DEMOS.find((demo) => demo.id === activeId) ?? DEMOS[0];

  return (
    <section
      id="ai-assistant"
      className="scroll-mt-20 bg-[var(--color-surface)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>AI financial assistant</SectionLabel>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal tracking-[-0.015em] text-[var(--color-text)] sm:text-[2.4rem]">
            Your financial questions, answered.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Go beyond recording transactions. Understand your spending by asking questions
            about your financial activity.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:gap-12">
          {/* Questions */}
          <div>
            <p className="text-label text-[var(--color-text-muted)]">Try a question</p>
            <div
              className="mt-3 flex flex-wrap gap-2 xl:flex-col xl:items-stretch"
              role="group"
              aria-label="Example financial questions"
            >
              {DEMOS.map((demo) => {
                const active = demo.id === activeDemo.id;
                return (
                  <button
                    key={demo.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveId(demo.id)}
                    className={`cursor-pointer rounded-[var(--radius-md)] border px-3 py-2 text-left text-[13px] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] font-medium text-[var(--color-primary-text)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {demo.question}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-text-subtle)]">
              This is a product demonstration. In the app, answers are generated from your own
              transaction records — nothing is sent from this page.
            </p>
          </div>

          {/* Conversation preview */}
          <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5 xl:max-w-none">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold text-[var(--color-text)]">
                  Ledgerly AI
                </span>
              </span>
              <SampleDataNote />
            </div>

            <div className="mt-4 space-y-3">
              <p className="ml-auto w-fit max-w-[90%] rounded-[var(--radius-md)] rounded-br-[var(--radius-xs)] bg-[var(--color-surface-sunken)] px-3 py-2 text-[13px] text-[var(--color-text)]">
                {activeDemo.question}
              </p>

              <div aria-live="polite" className="space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text)]"
                  aria-hidden="true"
                />
                <p className="max-w-[92%] text-[13.5px] leading-relaxed text-[var(--color-text)]">
                  {activeDemo.answer}
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                <div className="flex items-baseline justify-between text-[11px] text-[var(--color-text-subtle)]">
                  <span>{activeDemo.columnLabel}</span>
                  <span>Amount</span>
                </div>
                <ul className="mt-1.5 divide-y divide-[var(--color-border)]">
                  {activeDemo.rows.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-start justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-[var(--color-text)]">
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--color-text-subtle)]">
                          {row.detail}
                        </p>
                      </div>
                      <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--color-text)]">
                        {row.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

                <p className="text-[11px] text-[var(--color-text-subtle)]">
                  Illustrative sample data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
