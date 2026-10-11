'use client';

import React from 'react';
import { PieChart, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export function BenefitsIllustration() {
  return (
    <div
      className="relative w-full max-w-[480px] mx-auto select-none"
      aria-label="Visual breakdown of category budgets and settled debt commitments"
      role="img"
    >
      {/* Background Soft Organic Glow */}
      <div className="absolute -inset-6 -z-10 pointer-events-none opacity-80">
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform scale-105"
        >
          <path
            d="M380 140C440 210 420 340 350 410C280 480 160 460 90 390C20 320 30 200 100 130C170 60 320 70 380 140Z"
            fill="var(--color-landing-mint)"
            className="transition-colors duration-500"
          />
          <path
            d="M340 180C390 230 380 330 320 380C260 430 170 410 120 360C70 310 80 220 130 170C180 120 290 130 340 180Z"
            fill="var(--color-landing-aqua)"
            opacity="0.5"
            className="transition-colors duration-500"
          />
        </svg>
      </div>

      {/* Main Benefits Visual Card Stack */}
      <div className="space-y-4">
        {/* Card 1: Category Budget Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-landing-surface-card border border-landing-border shadow-xl shadow-teal-950/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-landing-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-landing-mint text-landing-teal flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-landing-text">
                Monthly Spending Distribution
              </span>
            </div>
            <span className="text-xs text-landing-text-muted font-medium">
              October 2026
            </span>
          </div>

          {/* Segmented Distribution Visual Bar */}
          <div className="w-full h-3 rounded-full bg-landing-border overflow-hidden flex gap-0.5">
            <div className="h-full bg-landing-teal" style={{ width: '42%' }} title="Housing (42%)" />
            <div className="h-full bg-amber-400" style={{ width: '28%' }} title="Food & Dining (28%)" />
            <div className="h-full bg-emerald-500" style={{ width: '18%' }} title="Savings Reserve (18%)" />
            <div className="h-full bg-rose-400" style={{ width: '12%' }} title="Utilities (12%)" />
          </div>

          {/* Category Breakdown Rows */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-landing-alt border border-landing-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-landing-teal" />
                <span className="text-landing-text-muted">Housing</span>
              </div>
              <span className="font-bold text-landing-text tabular-nums">৳18,500.00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-landing-alt border border-landing-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-landing-text-muted">Food &amp; Dining</span>
              </div>
              <span className="font-bold text-landing-text tabular-nums">৳12,200.00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-landing-alt border border-landing-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-landing-text-muted">Savings Reserve</span>
              </div>
              <span className="font-bold text-landing-text tabular-nums">৳9,500.00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-landing-alt border border-landing-border/60">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-landing-text-muted">Utilities</span>
              </div>
              <span className="font-bold text-landing-text tabular-nums">৳4,800.00</span>
            </div>
          </div>
        </div>

        {/* Card 2: Debt Settlement & Repayment Ledger Card */}
        <div className="p-4 rounded-xl bg-landing-surface-card border border-landing-border shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-landing-text block">
                Tanvir Ahmed • Trip Share
              </span>
              <span className="text-[11px] text-landing-text-muted">
                Settled in full via bKash • No balance remaining
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            ৳2,500.00
          </span>
        </div>
      </div>
    </div>
  );
}
