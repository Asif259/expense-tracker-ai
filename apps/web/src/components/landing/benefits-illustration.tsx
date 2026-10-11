'use client';

import React from 'react';

export function BenefitsIllustration() {
  return (
    <div
      className="relative w-full max-w-[480px] mx-auto select-none"
      aria-label="Illustration depicting the journey to financial clarity and peace of mind"
      role="img"
    >
      {/* Background Soft Organic Glow */}
      <div className="absolute -inset-4 sm:-inset-6 -z-10 pointer-events-none opacity-80">
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

      {/* Mountain Journey SVG Vector Canvas */}
      <div className="relative p-2 sm:p-4">
        <svg
          viewBox="0 0 440 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-sm"
        >
          {/* Base Ground Ellipse */}
          <ellipse cx="220" cy="430" rx="190" ry="24" fill="var(--color-landing-teal)" opacity="0.15" />

          {/* Main Mountain Silhouette */}
          <path
            d="M220 70 L380 410 C340 425 100 425 60 410 Z"
            fill="#F0E3D0"
            className="dark:fill-[#2B2925]"
          />
          {/* Mountain Shading (Left side warmth) */}
          <path
            d="M220 70 L220 420 C140 420 80 415 60 410 Z"
            fill="#E5D3BD"
            className="dark:fill-[#24221E]"
          />

          {/* Summit Goal Flag & Star */}
          <line x1="220" y1="70" x2="220" y2="35" stroke="#3CA995" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M220 38 L250 48 L220 58 Z" fill="#3CA995" />
          {/* Sunbeams above summit */}
          <path d="M220 20 L220 12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
          <path d="M205 24 L199 18" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
          <path d="M235 24 L241 18" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
          <path d="M194 33 L186 31" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
          <path d="M246 33 L254 31" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />

          {/* Winding Trail / Path Up the Mountain */}
          <path
            d="M130 410 C150 370 210 375 230 330 C250 290 190 280 205 230 C220 180 260 170 240 120 C230 95 224 85 220 70"
            stroke="var(--color-landing-surface-card)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M130 410 C150 370 210 375 230 330 C250 290 190 280 205 230 C220 180 260 170 240 120 C230 95 224 85 220 70"
            stroke="var(--color-landing-aqua)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Milestone Waypoint 1 (Base - Track) */}
          <circle cx="150" cy="390" r="9" fill="#3CA995" />
          <circle cx="150" cy="390" r="4" fill="var(--color-landing-surface-card)" />

          {/* Milestone Waypoint 2 (Mid - Understand) */}
          <circle cx="218" cy="275" r="9" fill="#3CA995" />
          <circle cx="218" cy="275" r="4" fill="var(--color-landing-surface-card)" />

          {/* Milestone Waypoint 3 (High - Plan) */}
          <circle cx="236" cy="145" r="9" fill="#3CA995" />
          <circle cx="236" cy="145" r="4" fill="var(--color-landing-surface-card)" />

          {/* Friendly Travelers on the Trail */}
          {/* Climber 1: Reaching top section */}
          <circle cx="230" cy="98" r="5" fill="#FAD0B6" />
          <path d="M226 104 L234 104 L236 116 L224 116 Z" fill="#3CA995" />
          <path d="M224 116 L222 124 M236 116 L238 124" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />

          {/* Climber 2: Middle path, celebrating with arms up */}
          <circle cx="195" cy="205" r="5" fill="#FAD0B6" />
          <path d="M191 211 L201 211 L203 223 L189 223 Z" fill="#E15B64" />
          <path d="M189 223 L187 232 M203 223 L205 232" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />
          <path d="M187 212 L182 205 M203 212 L208 205" stroke="#FAD0B6" strokeWidth="2" strokeLinecap="round" />

          {/* Climber 3: Stepping onto the path near base */}
          <circle cx="120" cy="380" r="5" fill="#FAD0B6" />
          <path d="M116 386 L124 386 L126 398 L114 398 Z" fill="#F5A623" />
          <path d="M114 398 L112 408 M126 398 L128 408" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />

          {/* Pine trees / landscape vegetation on the mountain sides */}
          <path d="M95 340 L105 315 L115 340 Z" fill="#3CA995" opacity="0.8" />
          <path d="M100 355 L110 330 L120 355 Z" fill="#2FA88F" opacity="0.9" />

          <path d="M330 330 L340 305 L350 330 Z" fill="#3CA995" opacity="0.8" />
          <path d="M340 350 L350 325 L360 350 Z" fill="#2FA88F" opacity="0.9" />

          {/* Small Village Houses at Mountain Base */}
          <rect x="75" y="396" width="16" height="14" fill="#E15B64" rx="1" />
          <path d="M72 396 L83 388 L94 396 Z" fill="#2C3E50" />

          <rect x="98" y="400" width="18" height="12" fill="#F5A623" rx="1" />
          <path d="M96 400 L107 392 L118 400 Z" fill="#2C3E50" />

          {/* Financial Growth Bar Chart at Foot of Mountain */}
          <g transform="translate(145, 415)">
            {/* Chart platform line */}
            <rect x="0" y="28" width="150" height="4" rx="2" fill="var(--color-landing-text-muted)" opacity="0.4" />

            {/* Rising growth bars */}
            <rect x="15" y="18" width="12" height="10" rx="3" fill="#D7F4EC" />
            <rect x="35" y="12" width="12" height="16" rx="3" fill="#3CA995" />
            <rect x="55" y="6" width="12" height="22" rx="3" fill="#F5A623" />
            <rect x="75" y="0" width="12" height="28" rx="3" fill="#3CA995" />
            <rect x="95" y="-6" width="12" height="34" rx="3" fill="#E15B64" />
            <rect x="115" y="-12" width="12" height="40" rx="3" fill="#176F66" />

            {/* Tiny trend line overlay */}
            <path
              d="M21 16 L41 10 L61 4 L81 -2 L101 -8 L121 -14"
              stroke="#3CA995"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Floating Category Badges on Lower Left & Right */}
          {/* Mini Pie Badge */}
          <circle cx="55" cy="380" r="16" fill="var(--color-landing-surface-card)" stroke="var(--color-landing-border)" strokeWidth="1.5" />
          <path d="M55 380 L55 368 A12 12 0 0 1 67 380 Z" fill="#3CA995" />
          <path d="M55 380 L67 380 A12 12 0 0 1 55 392 Z" fill="#F5A623" />
          <path d="M55 380 L55 392 A12 12 0 1 1 55 368 Z" fill="#E15B64" />
        </svg>
      </div>
    </div>
  );
}
