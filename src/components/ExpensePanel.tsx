import { useState } from 'react'
import type { Person, Expense } from '../settlement'
import { parseCents, formatCents } from '../money'

interface Props {
  people: Person[]
  expenses: Expense[]
  onAdd: (expense: Omit<Expense, 'id'>) => void
  onRemove: (id: string) => void
}

export function ExpensePanel({ people, expenses, onAdd, onRemove }: Props) {
  const [payer, setPayer] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const effectivePayer = payer || people[0]?.id || ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cents = parseCents(amount)
    if (cents <= 0 || !effectivePayer) return
    onAdd({
      payer: effectivePayer,
      amountCents: cents,
      description: description.trim(),
      participants: people.map(p => p.id),
    })
    setAmount('')
    setDescription('')
  }

  const payerName = (id: string) => people.find(p => p.id === id)?.name ?? 'Unknown'

  if (people.length === 0) {
    return (
      <section className="panel">
        <h2>Expenses</h2>
        <p className="empty">Add people before adding expenses.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Expenses</h2>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-row">
          <label htmlFor="payer">Paid by</label>
          <select
            id="payer"
            value={effectivePayer}
            onChange={e => setPayer(e.target.value)}
          >
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            placeholder="Optional"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" disabled={parseCents(amount) <= 0}>
          Add expense
        </button>
      </form>

      {expenses.length > 0 && (
        <ul className="expense-list">
          {expenses.map(exp => (
            <li key={exp.id}>
              <div className="expense-info">
                <span className="expense-amount">{formatCents(exp.amountCents)}</span>
                <span className="expense-detail">
                  {payerName(exp.payer)} paid
                  {exp.description ? ` · ${exp.description}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="remove"
                onClick={() => onRemove(exp.id)}
                aria-label="Remove expense"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
