import { useState, useEffect } from 'react'
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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    people.map(p => p.id)
  )

  const effectivePayer =
    payer && people.some(p => p.id === payer) ? payer : people[0]?.id ?? ''

  useEffect(() => {
    setSelectedParticipants(prev => {
      const currentIds = new Set(people.map(p => p.id))
      const filtered = prev.filter(id => currentIds.has(id))
      const existing = new Set(filtered)
      const added = people.filter(p => !existing.has(p.id)).map(p => p.id)
      return [...filtered, ...added]
    })
  }, [people])

  function toggleParticipant(id: string) {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cents = parseCents(amount)
    if (cents <= 0 || !effectivePayer || selectedParticipants.length === 0) return
    onAdd({
      payer: effectivePayer,
      amountCents: cents,
      description: description.trim(),
      participants: selectedParticipants,
    })
    setAmount('')
    setDescription('')
    setSelectedParticipants(people.map(p => p.id))
  }

  const nameOf = (id: string) => people.find(p => p.id === id)?.name ?? 'Unknown'

  const participantLabel = (ids: string[]) =>
    ids.length === people.length
      ? 'Everyone'
      : ids.map(nameOf).join(', ')

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

        <div className="form-row">
          <label>Split between</label>
          <div className="participant-checkboxes">
            {people.map(p => (
              <label
                key={p.id}
                className={`participant-chip${selectedParticipants.includes(p.id) ? ' participant-chip--on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(p.id)}
                  onChange={() => toggleParticipant(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={parseCents(amount) <= 0 || selectedParticipants.length === 0}
        >
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
                  {nameOf(exp.payer)} paid
                  {exp.description ? ` · ${exp.description}` : ''}
                </span>
                {exp.participants.length < people.length && (
                  <span className="expense-participants">
                    {participantLabel(exp.participants)}
                  </span>
                )}
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
