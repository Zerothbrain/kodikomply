# KodiComply — Tanzania Tax Compliance Platform

> "Hesabu yako ya kodi, rahisi na sahihi"

The TurboTax for Tanzania. Full-stack web application for PAYE, VAT, WHT, corporate tax, terminal benefits, penalties and more.

---

## Quick Start

### 1. Clone and setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npx prisma generate
npx prisma db push          # Creates tables
npm run db:seed             # Seeds all Tanzania tax data
npm run dev                 # Starts API on port 4000

# Frontend (new terminal)
cd frontend
npm install
# Create .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                 # Starts Next.js on port 3000
```

### 2. Default admin credentials

```
Email: admin@kodicomply.co.tz
Password: Admin@KodiComply2024
```

**Change this immediately after first login.**

---

## Architecture

```
kodicomply/
├── backend/          Express.js API (port 4000)
│   ├── src/
│   │   ├── index.ts              Entry point
│   │   ├── routes/               auth, calculator, admin, reports, deadlines
│   │   ├── controllers/          employment, business, vat, withholding,
│   │   │                         investment, corporate, terminal, penalties
│   │   ├── middleware/           auth.ts (JWT), adminOnly.ts
│   │   └── lib/                  prisma.ts, taxHelpers.ts
│   └── prisma/
│       ├── schema.prisma         Database schema
│       └── seed.ts               All Tanzania tax data
└── frontend/         Next.js 14 App Router (port 3000)
    └── app/
        ├── page.tsx              Landing page
        ├── auth/                 Login, Register
        ├── dashboard/            User dashboard
        ├── calculator/           Employment, Business, VAT, WHT, Investment, Terminal
        ├── admin/                Tax Rules, WHT Rates, Corporate Rates,
        │                         Deductions, Exemptions, Deadlines, Users
        └── reports/              Calculation history + PDF download
```

---

## Tax Calculators

| Calculator | ITA Reference | Key Features |
|---|---|---|
| Employment (PAYE) | ITA s.7-34 | Residency test, allowance classification, reimbursement edge case, SDL |
| Terminal Benefits | ITA s.36 | All 4 contract scenarios (specified, unspecified +/- clause, general) |
| Business Income | ITA s.11-21 | Trading stock, depreciation pools, thin-cap, donations cap, subsistence exemption |
| VAT | VAT Act s.5-28 | Registration check, T/A apportionment, import VAT, reverse charge |
| Withholding Tax | ITA s.82-89 | All rate types, construction split, rent exemption, partnership allocation |
| Investment Income | ITA s.7-10 | Private residence, DSE shares, agricultural land exemptions |
| Corporate Tax | ITA s.4 | All 6 rate scenarios, perpetual loss, quarterly installments |
| Penalties | ITA s.76-81 | Late filing formula, compound interest I=P[(1+r/12)^t-1] |

---

## Database Schema

All tax rates, bands, and rules are stored in MySQL and loaded at calculation time:

- **TaxRule** — PAYE bands, SDL rate, VAT settings, depreciation rates, currency point
- **WithholdingRate** — All WHT rates (resident/non-resident, final/non-final)
- **CorporateRate** — All 6 corporate tax scenarios
- **Deduction** — Allowable deductions with conditions
- **Exemption** — Income exemptions with eligibility
- **FilingDeadline** — All TRA filing dates with reminder configuration
- **Calculation** — Audit log of every calculation (user + input + result)

---

## cPanel Deployment

### Backend (Node.js App)
1. Upload `backend/` to server
2. In cPanel → Node.js Selector:
   - Node.js version: 20.x
   - Application root: `backend/`
   - Application startup file: `dist/index.js`
   - Run: `npm install && npm run build && npm run db:migrate && npm run db:seed`
3. Set environment variables in cPanel Node.js UI

### Frontend (Static Export)
```bash
cd frontend
npm run build
# Upload .next/standalone/ or use Vercel/Netlify for easier deployment
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL="mysql://user:pass@localhost:3306/kodicomply"
JWT_SECRET="your-secret-at-least-32-chars"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="https://yourdomain.co.tz"
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.co.tz
```

---

## Admin Panel

Access at `/admin` (requires ADMIN role).

| Section | What You Can Edit |
|---|---|
| Tax Rules | PAYE bands, SDL rate, VAT threshold, depreciation rates, currency point value |
| Withholding Rates | All WHT rates — rate, final/non-final, resident/non-resident |
| Corporate Rates | All 6 scenarios — rate, conditions, start/end dates |
| Deductions | Add/edit/delete with conditions, caps, effective dates |
| Exemptions | Add/edit/delete with eligibility criteria |
| Filing Deadlines | All due dates with reminder day configuration |
| Users | View all users, deactivate accounts, view calculation history |

---

## Key Implementation Rules

1. **All rates from DB** — Never hardcoded in calculation logic
2. **Every calculation is audit-logged** — Calculation table stores input + result as JSON
3. **Admin-only endpoints** — Protected by JWT + role check middleware
4. **TZS as integers** — All money stored as `Decimal(20,4)` to avoid float errors
5. **PAYE = monthly basis** — Calculated monthly, annualised by × 12
6. **WHT exclusive of VAT** — Always subtract VAT before applying WHT rate
7. **Reimbursement edge case** — Excess over actual expense is taxable (Step 5 of employment wizard)
8. **VAT apportionment** — T/A formula: ≥90% = full, <10% = none, in-between = apply formula
9. **Installment formula** — (A-C) ÷ B with nil threshold (estimated tax ≤50K or installment ≤12.5K)
10. **Penalty interest** — Compound monthly: I = P × [(1 + r/12)^t - 1]

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + jsPDF
- **Backend**: Express.js + TypeScript
- **Database**: MySQL (cPanel compatible)
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **PDF**: jsPDF + jspdf-autotable (client-side) + Puppeteer (server-side)

---

*KodiComply is for informational purposes only and does not constitute legal or tax advice. Always consult a registered tax consultant for advice specific to your situation.*
