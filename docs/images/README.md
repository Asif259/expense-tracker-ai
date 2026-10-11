# Ledgerly Documentation Images & Assets

This directory contains brand logos and screenshots referenced in the root [README.md](../../README.md).

Currently, **placeholder graphics** are provided so the README displays clean, styled visuals without broken image links. Replace these files with real screenshots from your live application whenever you are ready.

---

## Asset Checklist & Specifications

| File Name | Recommended Size | Format | Description / Page to Capture |
|---|---|---|---|
| `ledgerly-logo.png` | 800 × 200 px | PNG / SVG | Official Ledgerly logo and tagline on transparent or dark background. |
| `dashboard-light.png` | 1600 × 900 px | PNG | Main dashboard in **Light Mode** showing balance cards, recent transactions, and monthly summary. |
| `dashboard-dark.png` | 1600 × 900 px | PNG | Main dashboard in **Dark Mode** showing high-contrast cards and charts. |
| `ai-expense-entry.png` | 1600 × 900 px | PNG | The AI Entry page (`/ai-entry`) showing a natural language prompt and the staged draft review card. |
| `financial-analytics.png` | 1600 × 900 px | PNG | Financial analytics view (`/dashboard`) showcasing Chart.js cash flow bar chart & category breakdown doughnut. |
| `debt-and-loans.png` | 1600 × 900 px | PNG | Debt and loan ledger (`/loans`) showing active borrowed/lent records, repayments, and settlement status. |

---

## How to Replace Placeholders

1. Take a screenshot of the relevant page in your browser (recommended: 1600×900 or 1920×1080 resolution).
2. Save or export the image as a PNG matching the exact filename above.
3. Overwrite the corresponding file in this folder (`docs/images/<filename>.png`).
4. Commit and push your changes to git:
   ```bash
   git add docs/images/
   git commit -m "docs: update screenshots with live app captures"
   git push
   ```
