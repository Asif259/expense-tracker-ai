'use client';

import React from 'react';
import { Zap, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export function HeroIllustration() {
  return (
    <div
      className="relative w-full max-w-[540px] mx-auto select-none"
      aria-label="Illustration showing financial clarity with Ledgerly smart tracking"
      role="img"
    >
      {/* Organic Background Blob Shapes */}
      <div className="absolute -inset-4 sm:-inset-8 -z-10 pointer-events-none opacity-90 overflow-visible">
        <svg
          viewBox="0 0 600 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform scale-105 sm:scale-110"
        >
          {/* Main soft mint organic backdrop */}
          <path
            d="M480 230C520 330 470 450 360 500C250 550 130 510 70 410C10 310 20 170 110 90C200 10 340 30 420 90C470 128 450 170 480 230Z"
            fill="var(--color-landing-mint)"
            className="transition-colors duration-500"
          />
          {/* Layered soft aqua organic accent */}
          <path
            d="M520 180C560 260 510 380 430 420C350 460 270 410 230 350C190 290 210 200 270 140C330 80 440 80 490 120C510 136 505 156 520 180Z"
            fill="var(--color-landing-aqua)"
            opacity="0.65"
            className="transition-colors duration-500"
          />
        </svg>
      </div>

      {/* Main Illustration Canvas */}
      <div className="relative pt-4 pb-2 px-2 sm:px-6">
        {/* Floating Accent Badges (Reference: Floating icons in Trekt) */}
        {/* Top Right: Analytics Growth Badge */}
        <div className="absolute top-2 right-2 sm:right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-landing-surface-card border border-landing-border shadow-sm text-xs font-medium text-landing-text animate-pulse">
          <div className="w-5 h-5 rounded-full bg-landing-teal/15 text-landing-teal flex items-center justify-center">
            <TrendingUp className="w-3 h-3" />
          </div>
          <span>+14% Savings</span>
        </div>

        {/* Top Left: AI Fast Inference Badge */}
        <div className="absolute top-8 left-2 sm:left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-landing-surface-card border border-landing-border shadow-sm text-xs font-medium text-landing-text">
          <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </div>
          <span>Instant Categorization</span>
        </div>

        {/* Central Vector Artwork: Friendly Collaborators with Ledger Tablet */}
        <div className="w-full h-auto aspect-[5/4] relative flex items-center justify-center">
          <svg
            viewBox="0 0 500 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Soft decorative greenery / plants in background */}
            <path
              d="M60 340 C50 310 70 280 90 270 C105 295 100 325 85 345 Z"
              fill="var(--color-landing-teal)"
              opacity="0.3"
            />
            <path
              d="M85 345 C75 320 95 290 115 285 C125 310 115 335 105 348 Z"
              fill="var(--color-landing-teal-dark)"
              opacity="0.25"
            />
            <path
              d="M420 340 C430 315 415 285 395 275 C380 300 385 330 400 345 Z"
              fill="var(--color-landing-teal)"
              opacity="0.3"
            />
            <path
              d="M400 345 C410 320 390 295 375 290 C365 315 375 338 385 348 Z"
              fill="var(--color-landing-teal-dark)"
              opacity="0.25"
            />

            {/* Desk Surface */}
            <rect x="50" y="340" width="400" height="12" rx="6" fill="var(--color-landing-border)" />

            {/* Coffee Cup on Desk */}
            <rect x="95" y="322" width="22" height="18" rx="4" fill="#3CA995" />
            <path d="M117 326 C122 326 125 330 122 334 C120 336 117 336 117 336" stroke="#3CA995" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M101 316 C101 312 105 310 105 306" stroke="var(--color-landing-text-muted)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M109 316 C109 312 113 310 113 306" stroke="var(--color-landing-text-muted)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Potted Succulent on Desk */}
            <path d="M380 340 L375 325 L395 325 L390 340 Z" fill="#D9825B" />
            <circle cx="385" cy="320" r="7" fill="#3CA995" />
            <circle cx="379" cy="322" r="5" fill="#329683" />
            <circle cx="391" cy="322" r="5" fill="#329683" />

            {/* Character Left (Female silhouette reviewing finances) */}
            {/* Hair */}
            <path
              d="M140 180 C130 130 170 100 210 110 C235 115 245 140 240 165 C230 155 210 145 195 155 C180 165 170 190 155 195 C145 198 140 190 140 180 Z"
              fill="#F5A623"
            />
            {/* Head & Neck */}
            <ellipse cx="190" cy="165" rx="19" ry="24" fill="#FAD0B6" />
            <path d="M185 188 L185 205 L195 205 L195 188 Z" fill="#FAD0B6" />
            {/* Torso / Top */}
            <path
              d="M160 205 C150 220 140 270 138 310 L222 310 C220 270 210 220 200 205 Z"
              fill="#E15B64"
            />
            {/* Arm holding tablet */}
            <path
              d="M195 230 C205 245 220 260 240 265 C242 258 230 240 215 225 Z"
              fill="#FAD0B6"
            />

            {/* Character Right (Male silhouette smiling & gesturing) */}
            {/* Hair */}
            <path
              d="M290 140 C290 115 325 115 345 130 C355 138 355 155 350 165 C340 160 330 155 320 155 C310 155 295 150 290 140 Z"
              fill="#2C3E50"
            />
            {/* Head & Neck */}
            <ellipse cx="320" cy="165" rx="19" ry="24" fill="#F8C7A5" />
            <path d="M315 188 L315 205 L325 205 L325 188 Z" fill="#F8C7A5" />
            {/* Torso / T-Shirt */}
            <path
              d="M285 205 C275 225 268 265 266 310 L354 310 C352 265 345 225 335 205 Z"
              fill="#3CA995"
            />
            {/* Arm gesturing to ledger */}
            <path
              d="M285 230 C270 245 260 260 250 265 C252 258 265 240 280 225 Z"
              fill="#F8C7A5"
            />

            {/* Digital Ledger Book / Wide Display Screen held by both */}
            <g transform="translate(195, 185)">
              {/* Device outer frame */}
              <rect
                x="0"
                y="0"
                width="140"
                height="130"
                rx="8"
                fill="var(--color-landing-surface-card)"
                stroke="var(--color-landing-border)"
                strokeWidth="2"
              />
              {/* Display Header */}
              <rect x="8" y="8" width="124" height="16" rx="4" fill="var(--color-landing-mint)" />
              <circle cx="16" cy="16" r="3" fill="#3CA995" />
              <rect x="24" y="14" width="40" height="4" rx="2" fill="#3CA995" />
              <rect x="100" y="14" width="24" height="4" rx="2" fill="var(--color-landing-text-muted)" opacity="0.6" />

              {/* Mini Transaction Lines on Device */}
              <rect x="8" y="32" width="70" height="6" rx="3" fill="var(--color-landing-text-muted)" opacity="0.4" />
              <rect x="95" y="32" width="37" height="6" rx="3" fill="#3CA995" />

              <rect x="8" y="46" width="55" height="6" rx="3" fill="var(--color-landing-text-muted)" opacity="0.4" />
              <rect x="95" y="46" width="37" height="6" rx="3" fill="#E15B64" />

              <rect x="8" y="60" width="65" height="6" rx="3" fill="var(--color-landing-text-muted)" opacity="0.4" />
              <rect x="95" y="60" width="37" height="6" rx="3" fill="#3CA995" />

              {/* Mini Sparkline Chart */}
              <path
                d="M12 110 L35 98 L60 104 L85 90 L110 95 L128 82"
                stroke="#3CA995"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="128" cy="82" r="3" fill="#3CA995" />
            </g>
          </svg>
        </div>

        {/* Floating Live Transaction Draft Preview Card (Centered Bottom) */}
        <div className="relative -mt-10 sm:-mt-12 z-30 max-w-[420px] mx-auto rounded-2xl p-4 sm:p-5 bg-landing-surface-card border border-landing-border shadow-lg shadow-teal-950/5">
          <div className="flex items-center justify-between text-xs pb-2.5 mb-2.5 border-b border-landing-border">
            <span className="font-semibold text-landing-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-landing-teal" />
              Natural Language Draft
            </span>
            <span className="text-landing-teal font-medium inline-flex items-center gap-1 bg-landing-mint px-2 py-0.5 rounded-md text-[11px]">
              <Zap className="w-3 h-3" />
              <span>0.2s Staged Draft</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-landing-text font-medium mb-3">
            &ldquo;Paid ৳1,200 for grocery items at Agora yesterday evening&rdquo;
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-landing-border text-xs">
            <div>
              <span className="text-landing-text-muted text-[10px] sm:text-[11px] block">Amount</span>
              <span className="font-semibold tabular-nums text-landing-text">৳1,200.00</span>
            </div>
            <div>
              <span className="text-landing-text-muted text-[10px] sm:text-[11px] block">Category</span>
              <span className="font-medium text-landing-text">Food &amp; Dining</span>
            </div>
            <div>
              <span className="text-landing-text-muted text-[10px] sm:text-[11px] block">Safe Confirmation</span>
              <span className="font-medium text-landing-teal inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mini Debt Settlement Float Pill */}
        <div className="absolute -bottom-2 -left-2 sm:left-4 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-landing-surface-card border border-landing-border shadow-md text-xs font-medium text-landing-text">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Loan to Tanvir: ৳2,500 settled</span>
        </div>
      </div>
    </div>
  );
}
