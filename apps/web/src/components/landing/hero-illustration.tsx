'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, TrendingUp, Wallet, Shield } from 'lucide-react';

export function HeroIllustration() {
  return (
    <div
      className="relative w-full max-w-[520px] mx-auto select-none"
      aria-label="Interactive preview of Ledgerly personal finance ledger"
      role="img"
    >
      {/* Organic Background Blob Shapes */}
      <div className="absolute -inset-6 -z-10 pointer-events-none opacity-80 overflow-visible">
        <svg
          viewBox="0 0 600 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform scale-105"
        >
          <path
            d="M480 230C520 330 470 450 360 500C250 550 130 510 70 410C10 310 20 170 110 90C200 10 340 30 420 90C470 128 450 170 480 230Z"
            fill="var(--color-landing-mint)"
            className="transition-colors duration-500"
          />
          <path
            d="M520 180C560 260 510 380 430 420C350 460 270 410 230 350C190 290 210 200 270 140C330 80 440 80 490 120C510 136 505 156 520 180Z"
            fill="var(--color-landing-aqua)"
            opacity="0.65"
            className="transition-colors duration-500"
          />
        </svg>
      </div>

      {/* Main Financial Ledger Interface Card */}
      <div className="relative rounded-2xl bg-landing-surface-card border border-landing-border shadow-xl shadow-teal-950/5 p-5 sm:p-6 space-y-5">
        {/* Card Header: Account Overview & Net Cash Flow */}
        <div className="flex items-center justify-between pb-4 border-b border-landing-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-landing-mint text-landing-teal flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-landing-text-muted block">
                Net Cash Flow
              </span>
              <span className="text-xl sm:text-2xl font-bold text-landing-text tabular-nums">
                ৳32,450.00
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-landing-mint/60 border border-landing-border text-xs font-semibold text-landing-teal-dark dark:text-landing-teal">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2%</span>
          </div>
        </div>

        {/* Category Budget Progress Bar */}
        <div className="p-3.5 rounded-xl bg-landing-alt border border-landing-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-landing-text">Monthly Budget Usage</span>
            <span className="text-landing-text-muted tabular-nums">৳28,550 of ৳45,000</span>
          </div>
          <div className="w-full h-2 rounded-full bg-landing-border overflow-hidden">
            <div
              className="h-full rounded-full bg-landing-teal"
              style={{ width: '63.4%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-landing-text-muted">
            <span>63.4% spent</span>
            <span>12 days remaining</span>
          </div>
        </div>

        {/* Recent Financial Ledger Transactions */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-landing-text-muted font-medium px-1">
            <span>Recent Transactions</span>
            <span>Status</span>
          </div>

          {/* Transaction 1 */}
          <div className="p-3 rounded-xl bg-landing-surface border border-landing-border/80 flex items-center justify-between hover:border-landing-teal/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-landing-text block">
                  Agora Superstore
                </span>
                <span className="text-[11px] text-landing-text-muted">
                  Food &amp; Dining • Yesterday
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-landing-text tabular-nums block">
                -৳1,200.00
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Cleared
              </span>
            </div>
          </div>

          {/* Transaction 2 */}
          <div className="p-3 rounded-xl bg-landing-surface border border-landing-border/80 flex items-center justify-between hover:border-landing-teal/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-landing-text block">
                  Design Consulting
                </span>
                <span className="text-[11px] text-landing-text-muted">
                  Direct Deposit • Oct 08
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block">
                +৳35,000.00
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Received
              </span>
            </div>
          </div>

          {/* Transaction 3 */}
          <div className="p-3 rounded-xl bg-landing-surface border border-landing-border/80 flex items-center justify-between hover:border-landing-teal/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-landing-text block">
                  Broadband Internet
                </span>
                <span className="text-[11px] text-landing-text-muted">
                  Utilities • Oct 05
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-landing-text tabular-nums block">
                -৳1,050.00
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Cleared
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Settlement & Security Badges (Clean financial indicators) */}
      <div className="absolute -bottom-3 -left-2 sm:-left-4 z-20 flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-landing-surface-card border border-landing-border shadow-md text-xs font-semibold text-landing-text">
        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
        <span>Loan to Tanvir: ৳2,500 settled</span>
      </div>

      <div className="absolute -top-3 right-1 sm:-right-3 z-20 flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-landing-surface-card border border-landing-border shadow-md text-xs font-semibold text-landing-text">
        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-landing-teal shrink-0" />
        <span>PostgreSQL RLS Protected</span>
      </div>
    </div>
  );
}
