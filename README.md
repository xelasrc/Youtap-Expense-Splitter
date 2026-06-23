# youtab — Expense Splitter

Split shared expenses and see who owes whom.

## Running the app

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm test          # run unit tests
npm run build     # production build
```

## How it works

Add people, record expenses, and the app works out the minimum number of payments to settle up. Your data is saved in localStorage so it survives a page refresh. Hit **Reset** in the header to start over.

## Key decisions

- **Settlement logic is a pure function** with no React imports — easy to test independently of the UI.
- **All money is integer cents** internally. Dollars only appear at input and display. No floating-point rounding bugs.
- **Greedy settlement algorithm** — repeatedly pairs the biggest debtor with the biggest creditor. Produces at most n − 1 transactions. (Finding the true minimum is NP-hard; greedy is a practical near-optimal choice.)
- **Derived state** — balances and settlements are always computed from the raw people and expenses lists, never stored separately.

## What I'd add next

- Edit an expense in place
- Per-person spend breakdown
- Expense categories (food, transport, etc.)
- A shareable group link so everyone can add their own expenses
